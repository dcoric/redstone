import * as SQLite from 'expo-sqlite';
import type { FileWithRelations, Folder, Tag } from './types';

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
    conflict_json: string | null;
}

export type FileConflict =
    | { kind: 'remote-update'; file: FileWithRelations }
    | { kind: 'remote-delete' };

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

export interface LocalTag {
    id: string;
    name: string;
    is_temporary: number;
    file_count?: number;
}

export interface LocalFileTag {
    file_id: string;
    tag_id: string;
}

export interface LocalTagMutation {
    id: string;
    file_id: string;
    tag_id: string;
    tag_name: string;
    operation: 'add' | 'remove';
    created_at: string;
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
          version_id TEXT,
          conflict_json TEXT
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

        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL COLLATE NOCASE,
          is_temporary INTEGER NOT NULL DEFAULT 0
        );

        CREATE UNIQUE INDEX IF NOT EXISTS tags_name_unique
          ON tags(name COLLATE NOCASE);

        CREATE TABLE IF NOT EXISTS file_tags (
          file_id TEXT NOT NULL,
          tag_id TEXT NOT NULL,
          PRIMARY KEY (file_id, tag_id)
        );

        CREATE TABLE IF NOT EXISTS tag_mutations (
          id TEXT PRIMARY KEY NOT NULL,
          file_id TEXT NOT NULL,
          tag_id TEXT NOT NULL,
          tag_name TEXT NOT NULL,
          operation TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
    `);

    const fileColumns = await database.getAllAsync<{ name: string }>(
        'PRAGMA table_info(files)'
    );
    if (!fileColumns.some((column) => column.name === 'conflict_json')) {
        await database.execAsync(
            'ALTER TABLE files ADD COLUMN conflict_json TEXT'
        );
    }
};

async function writeFile(file: LocalFile) {
    const database = await getDb();
    await database.runAsync(
        `INSERT OR REPLACE INTO files
         (id, title, content, folder_id, created_at, updated_at, deleted_at, last_synced, dirty, version_id, conflict_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            file.conflict_json,
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
        conflict_json: null,
    };
}

async function replaceRemoteFileTags(file: FileWithRelations) {
    const database = await getDb();
    const pending = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM tag_mutations WHERE file_id = ?',
        [file.id]
    );
    if ((pending?.count ?? 0) > 0) return;

    await database.runAsync('DELETE FROM file_tags WHERE file_id = ?', [file.id]);
    for (const fileTag of file.tags ?? []) {
        const tag = fileTag.tag;
        await database.runAsync(
            `INSERT INTO tags (id, name, is_temporary) VALUES (?, ?, 0)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, is_temporary = 0`,
            [tag.id, tag.name]
        );
        await database.runAsync(
            'INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)',
            [file.id, tag.id]
        );
    }
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
        if (current?.dirty) {
            await writeFile({
                ...current,
                conflict_json: JSON.stringify({
                    kind: 'remote-update',
                    file,
                } satisfies FileConflict),
            });
            return true;
        }
        await writeFile(remoteToLocalFile(file, syncedAt));
        await replaceRemoteFileTags(file);
        return true;
    },

    markSynced: async (
        localId: string,
        remoteFile: FileWithRelations,
        syncedAt: string
    ) => {
        const database = await getDb();
        if (localId !== remoteFile.id) {
            await database.runAsync(
                'UPDATE file_tags SET file_id = ? WHERE file_id = ?',
                [remoteFile.id, localId]
            );
            await database.runAsync(
                'UPDATE tag_mutations SET file_id = ? WHERE file_id = ?',
                [remoteFile.id, localId]
            );
            await database.runAsync('DELETE FROM files WHERE id = ?', [localId]);
        }
        await writeFile(remoteToLocalFile(remoteFile, syncedAt));
        await replaceRemoteFileTags(remoteFile);
    },

    applyRemoteDelete: async (id: string) => {
        const current = await dbFiles.getById(id);
        if (current?.dirty) {
            await writeFile({
                ...current,
                conflict_json: JSON.stringify({
                    kind: 'remote-delete',
                } satisfies FileConflict),
            });
            return true;
        }
        const database = await getDb();
        await database.runAsync('DELETE FROM files WHERE id = ?', [id]);
        return true;
    },

    deletePermanently: async (id: string) => {
        const database = await getDb();
        await database.runAsync('DELETE FROM file_tags WHERE file_id = ?', [id]);
        await database.runAsync('DELETE FROM tag_mutations WHERE file_id = ?', [id]);
        await database.runAsync('DELETE FROM files WHERE id = ?', [id]);
    },

    recordConflict: async (id: string, conflict: FileConflict) => {
        const current = await dbFiles.getById(id);
        if (!current) return;
        await writeFile({
            ...current,
            conflict_json: JSON.stringify(conflict),
        });
    },

    getConflict: async (id: string): Promise<FileConflict | null> => {
        const current = await dbFiles.getById(id);
        if (!current?.conflict_json) return null;
        return JSON.parse(current.conflict_json) as FileConflict;
    },

    resolveConflict: async (id: string, resolution: 'local' | 'remote') => {
        const current = await dbFiles.getById(id);
        const conflict = await dbFiles.getConflict(id);
        if (!current || !conflict) return;

        if (resolution === 'local') {
            await writeFile({
                ...current,
                last_synced:
                    conflict.kind === 'remote-delete'
                        ? null
                        : current.last_synced,
                version_id:
                    conflict.kind === 'remote-update'
                        ? conflict.file.updatedAt
                        : null,
                conflict_json: null,
                dirty: 1,
            });
            return;
        }

        if (conflict.kind === 'remote-delete') {
            await dbFiles.deletePermanently(id);
        } else {
            await writeFile(
                remoteToLocalFile(conflict.file, new Date().toISOString())
            );
        }
    },
};

export const dbTags = {
    getAll: async (): Promise<LocalTag[]> => {
        const database = await getDb();
        return database.getAllAsync<LocalTag>(
            `SELECT tags.id, tags.name, tags.is_temporary,
                    COUNT(file_tags.file_id) AS file_count
             FROM tags
             LEFT JOIN file_tags ON file_tags.tag_id = tags.id
             GROUP BY tags.id, tags.name, tags.is_temporary
             ORDER BY tags.name ASC`
        );
    },

    getForFile: async (fileId: string): Promise<LocalTag[]> => {
        const database = await getDb();
        return database.getAllAsync<LocalTag>(
            `SELECT tags.id, tags.name, tags.is_temporary
             FROM tags
             INNER JOIN file_tags ON file_tags.tag_id = tags.id
             WHERE file_tags.file_id = ?
             ORDER BY tags.name ASC`,
            [fileId]
        );
    },

    getFileTags: async (): Promise<LocalFileTag[]> => {
        const database = await getDb();
        return database.getAllAsync<LocalFileTag>(
            'SELECT file_id, tag_id FROM file_tags'
        );
    },

    addLocal: async (
        fileId: string,
        tagName: string,
        temporaryTagId: string,
        mutationId: string
    ) => {
        const database = await getDb();
        const normalizedName = tagName.trim();
        const existing = await database.getFirstAsync<LocalTag>(
            'SELECT id, name, is_temporary FROM tags WHERE name = ? COLLATE NOCASE',
            [normalizedName]
        );
        const tag = existing ?? {
            id: temporaryTagId,
            name: normalizedName,
            is_temporary: 1,
        };

        if (!existing) {
            await database.runAsync(
                'INSERT INTO tags (id, name, is_temporary) VALUES (?, ?, 1)',
                [tag.id, tag.name]
            );
        }
        await database.runAsync(
            'INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)',
            [fileId, tag.id]
        );

        const pendingRemove = await database.getFirstAsync<LocalTagMutation>(
            `SELECT * FROM tag_mutations
             WHERE file_id = ? AND tag_id = ? AND operation = 'remove'`,
            [fileId, tag.id]
        );
        if (pendingRemove) {
            await database.runAsync('DELETE FROM tag_mutations WHERE id = ?', [pendingRemove.id]);
        } else {
            await database.runAsync(
                `INSERT INTO tag_mutations
                 (id, file_id, tag_id, tag_name, operation, created_at)
                 VALUES (?, ?, ?, ?, 'add', ?)`,
                [mutationId, fileId, tag.id, tag.name, new Date().toISOString()]
            );
        }
        return tag;
    },

    removeLocal: async (fileId: string, tag: LocalTag, mutationId: string) => {
        const database = await getDb();
        await database.runAsync(
            'DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?',
            [fileId, tag.id]
        );

        const pendingAdd = await database.getFirstAsync<LocalTagMutation>(
            `SELECT * FROM tag_mutations
             WHERE file_id = ? AND tag_id = ? AND operation = 'add'`,
            [fileId, tag.id]
        );
        if (pendingAdd) {
            await database.runAsync('DELETE FROM tag_mutations WHERE id = ?', [pendingAdd.id]);
        } else if (tag.is_temporary === 0) {
            await database.runAsync(
                `INSERT INTO tag_mutations
                 (id, file_id, tag_id, tag_name, operation, created_at)
                 VALUES (?, ?, ?, ?, 'remove', ?)`,
                [mutationId, fileId, tag.id, tag.name, new Date().toISOString()]
            );
        }

        if (tag.is_temporary) {
            const references = await database.getFirstAsync<{ count: number }>(
                'SELECT COUNT(*) AS count FROM file_tags WHERE tag_id = ?',
                [tag.id]
            );
            if ((references?.count ?? 0) === 0) {
                await database.runAsync('DELETE FROM tags WHERE id = ?', [tag.id]);
            }
        }
    },

    getPendingMutations: async (): Promise<LocalTagMutation[]> => {
        const database = await getDb();
        return database.getAllAsync<LocalTagMutation>(
            'SELECT * FROM tag_mutations ORDER BY created_at ASC'
        );
    },

    markAddSynced: async (mutation: LocalTagMutation, remoteTag: Tag) => {
        const database = await getDb();
        if (mutation.tag_id !== remoteTag.id) {
            await database.runAsync(
                'DELETE FROM tags WHERE id = ? AND is_temporary = 1',
                [mutation.tag_id]
            );
        }
        await database.runAsync(
            `INSERT INTO tags (id, name, is_temporary) VALUES (?, ?, 0)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, is_temporary = 0`,
            [remoteTag.id, remoteTag.name]
        );
        await database.runAsync(
            'INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)',
            [mutation.file_id, remoteTag.id]
        );
        if (mutation.tag_id !== remoteTag.id) {
            await database.runAsync(
                'DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?',
                [mutation.file_id, mutation.tag_id]
            );
        }
        await database.runAsync('DELETE FROM tag_mutations WHERE id = ?', [mutation.id]);
    },

    markRemoveSynced: async (mutationId: string) => {
        const database = await getDb();
        await database.runAsync('DELETE FROM tag_mutations WHERE id = ?', [mutationId]);
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
    getAll: async (): Promise<LocalFolder[]> => {
        const database = await getDb();
        return database.getAllAsync<LocalFolder>(
            'SELECT * FROM folders WHERE deleted_at IS NULL ORDER BY name ASC'
        );
    },

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
