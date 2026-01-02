import * as SQLite from 'expo-sqlite';
import { File, Folder } from './types';

// Define local types that mirror our API types but for SQLite
export interface LocalFile {
    id: string;
    title: string;
    content: string;
    folder_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    last_synced: string | null; // null if never synced (newly created offline)
    dirty: number; // 1 if modified locally and needs sync
    versionId: string | null; // matches the server version
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

// Open database synchronously (new EXPO SQLite API might be async, checking docs behavior)
// Expo SQLite Next (new) is async. Standard is sync-ish open but async execution.
// We'll use the standard openDatabase for now or use the new useSQLiteContext if we went with that.
// Let's stick to the simple `openDatabaseSync` if available in recent versions, or `openDatabaseAsync`.
// Expo 50+ recommends `openDatabaseAsync` or `useSQLiteContext`.

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
      dirty INTEGER DEFAULT 0,
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
      dirty INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
};

// CRUD Operations

// FILES
export const dbFiles = {
    getAll: async (): Promise<LocalFile[]> => {
        const database = await getDb();
        return await database.getAllAsync<LocalFile>('SELECT * FROM files WHERE deleted_at IS NULL ORDER BY updated_at DESC');
    },

    getById: async (id: string): Promise<LocalFile | null> => {
        const database = await getDb();
        return await database.getFirstAsync<LocalFile>('SELECT * FROM files WHERE id = ?', [id]);
    },

    insert: async (file: LocalFile) => {
        const database = await getDb();
        await database.runAsync(
            `INSERT OR REPLACE INTO files (id, title, content, folder_id, created_at, updated_at, deleted_at, last_synced, dirty, version_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [file.id, file.title, file.content, file.folder_id, file.created_at, file.updated_at, file.deleted_at, file.last_synced, file.dirty, file.versionId]
        );
    },

    update: async (id: string, updates: Partial<LocalFile>) => {
        const database = await getDb();
        // Simplified update builder could be done here, but for now hardcode common case or specific updates
        // For general usage, let's just use specific methods or a smarter helper
        // Doing a "mark dirty" update
        const current = await database.getFirstAsync<LocalFile>('SELECT * FROM files WHERE id = ?', [id]);
        if (!current) return;

        const updated = { ...current, ...updates, dirty: 1, updated_at: new Date().toISOString() };
        await dbFiles.insert(updated);
    },

    softDelete: async (id: string) => {
        const database = await getDb();
        await database.runAsync(
            'UPDATE files SET deleted_at = ?, dirty = 1 WHERE id = ?',
            [new Date().toISOString(), id]
        );
    },

    getDirty: async (): Promise<LocalFile[]> => {
        const database = await getDb();
        return await database.getAllAsync<LocalFile>('SELECT * FROM files WHERE dirty = 1');
    }
};
