import * as SQLite from 'expo-sqlite';
import type { FileWithRelations, Folder } from './types';

export interface LocalFile {
    id: string;
    title: string;
    content: string;
    folder_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    last_synced: string | null;
    dirty: number;
    version_id: string | null;
}

export interface LocalFolder {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    last_synced: string | null;
    dirty: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('redstone.db');
    return db;
};

export const initDb = async () => {
    const database = await getDb();

    await database.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          folder_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          last_synced TEXT,
          dirty INTEGER NOT NULL DEFAULT 0,
          version_id TEXT
        );

        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          parent_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          last_synced TEXT,
          dirty INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sync_state (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
    `);
};

async function writeFile(file: LocalFile) {
    const database = await getDb();
    await database.runAsync(
        `INSERT OR REPLACE INTO files
         (id, title, content, folder_id, created_at, updated_at, deleted_at, last_synced, dirty, version_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            file.id,
            file.title,
            file.content,
            file.folder_id,
            file.created_at,
            file.updated_at,
            file.deleted_at,
            file.last_synced,
            file.dirty,
            file.version_id,
        ]
    );
}

function remoteToLocalFile(file: FileWithRelations, syncedAt: string): LocalFile {
    return {
        id: file.id,
        title: file.title,
        content: file.content,
        folder_id: file.folderId,
        created_at: file.createdAt,
        updated_at: file.updatedAt,
        deleted_at: file.deletedAt,
        last_synced: syncedAt,
        dirty: 0,
        version_id: file.updatedAt,
    };
}

export const dbFiles = {
    getAll: async (): Promise<LocalFile[]> => {
        const database = await getDb();
        return database.getAllAsync<LocalFile>(
            'SELECT * FROM files WHERE deleted_at IS NULL ORDER BY updated_at DESC'
        );
    },

    getById: async (id: string): Promise<LocalFile | null> => {
        const database = await getDb();
        return database.getFirstAsync<LocalFile>(
            'SELECT * FROM files WHERE id = ?',
            [id]
        );
    },

    insert: writeFile,

    updateLocal: async (id: string, updates: Partial<LocalFile>) => {
        const current = await dbFiles.getById(id);
        if (!current) return false;

        await writeFile({
            ...current,
            ...updates,
            id: current.id,
            updated_at: new Date().toISOString(),
            dirty: 1,
        });
        return true;
    },

    softDelete: async (id: string) => {
        const database = await getDb();
        const now = new Date().toISOString();
        await database.runAsync(
            'UPDATE files SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?',
            [now, now, id]
        );
    },

    getDirty: async (): Promise<LocalFile[]> => {
        const database = await getDb();
        return database.getAllAsync<LocalFile>(
            'SELECT * FROM files WHERE dirty = 1 ORDER BY updated_at ASC'
        );
    },

    upsertRemote: async (file: FileWithRelations, syncedAt: string) => {
        const current = await dbFiles.getById(file.id);
        if (current?.dirty) return false;
        await writeFile(remoteToLocalFile(file, syncedAt));
        return true;
    },

    markSynced: async (
        localId: string,
        remoteFile: FileWithRelations,
        syncedAt: string
    ) => {
        const database = await getDb();
        if (localId !== remoteFile.id) {
            await database.runAsync('DELETE FROM files WHERE id = ?', [localId]);
        }
        await writeFile(remoteToLocalFile(remoteFile, syncedAt));
    },

    applyRemoteDelete: async (id: string) => {
        const current = await dbFiles.getById(id);
        if (current?.dirty) return false;
        const database = await getDb();
        await database.runAsync('DELETE FROM files WHERE id = ?', [id]);
        return true;
    },

    deletePermanently: async (id: string) => {
        const database = await getDb();
        await database.runAsync('DELETE FROM files WHERE id = ?', [id]);
    },
};

async function writeFolder(folder: LocalFolder) {
    const database = await getDb();
    await database.runAsync(
        `INSERT OR REPLACE INTO folders
         (id, name, parent_id, created_at, updated_at, deleted_at, last_synced, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            folder.id,
            folder.name,
            folder.parent_id,
            folder.created_at,
            folder.updated_at,
            folder.deleted_at,
            folder.last_synced,
            folder.dirty,
        ]
    );
}

export const dbFolders = {
    getById: async (id: string): Promise<LocalFolder | null> => {
        const database = await getDb();
        return database.getFirstAsync<LocalFolder>(
            'SELECT * FROM folders WHERE id = ?',
            [id]
        );
    },

    upsertRemote: async (folder: Folder, syncedAt: string) => {
        const current = await dbFolders.getById(folder.id);
        if (current?.dirty) return false;
        await writeFolder({
            id: folder.id,
            name: folder.name,
            parent_id: folder.parentId,
            created_at: folder.createdAt,
            updated_at: folder.updatedAt,
            deleted_at: folder.deletedAt,
            last_synced: syncedAt,
            dirty: 0,
        });
        return true;
    },

    applyRemoteDelete: async (id: string) => {
        const current = await dbFolders.getById(id);
        if (current?.dirty) return false;
        const database = await getDb();
        await database.runAsync('DELETE FROM folders WHERE id = ?', [id]);
        return true;
    },
};

export const syncState = {
    get: async (key: string): Promise<string | null> => {
        const database = await getDb();
        const row = await database.getFirstAsync<{ value: string | null }>(
            'SELECT value FROM sync_state WHERE key = ?',
            [key]
        );
        return row?.value ?? null;
    },

    set: async (key: string, value: string) => {
        const database = await getDb();
        await database.runAsync(
            `INSERT INTO sync_state (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
            [key, value]
        );
    },
};
