import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type { FileWithRelations } from '@redstone/shared';
import type { DesktopConflict, DesktopFile } from './contracts';

const CURSOR_KEY = 'files_cursor';

export class VaultDatabase {
  private readonly database: DatabaseSync;

  constructor(filename: string) {
    this.database = new DatabaseSync(filename);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        folder_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        last_synced_at TEXT,
        base_updated_at TEXT,
        dirty INTEGER NOT NULL DEFAULT 0,
        conflict_json TEXT
      );
      CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }

  close(): void {
    this.database.close();
  }

  list(query = ''): DesktopFile[] {
    const normalized = `%${query.trim().toLowerCase()}%`;
    return this.database.prepare(`
      SELECT id, title, content, folder_id AS folderId,
             created_at AS createdAt, updated_at AS updatedAt,
             deleted_at AS deletedAt, last_synced_at AS lastSyncedAt,
             base_updated_at AS baseUpdatedAt, dirty,
             conflict_json AS conflictJson
      FROM files
      WHERE deleted_at IS NULL
        AND (? = '%%' OR lower(title) LIKE ? OR lower(content) LIKE ?)
      ORDER BY updated_at DESC
    `).all(normalized, normalized, normalized) as unknown as DesktopFile[];
  }

  get(id: string): DesktopFile | null {
    return (this.database.prepare(`
      SELECT id, title, content, folder_id AS folderId,
             created_at AS createdAt, updated_at AS updatedAt,
             deleted_at AS deletedAt, last_synced_at AS lastSyncedAt,
             base_updated_at AS baseUpdatedAt, dirty,
             conflict_json AS conflictJson
      FROM files WHERE id = ?
    `).get(id) as unknown as DesktopFile | undefined) ?? null;
  }

  create(): DesktopFile {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO files
        (id, title, content, folder_id, created_at, updated_at, deleted_at,
         last_synced_at, base_updated_at, dirty, conflict_json)
      VALUES (?, 'Untitled', '', NULL, ?, ?, NULL, NULL, NULL, 1, NULL)
    `).run(id, now, now);
    return this.get(id)!;
  }

  update(
    id: string,
    changes: { title?: string; content?: string; folderId?: string | null }
  ): DesktopFile {
    const current = this.get(id);
    if (!current) throw new Error('File not found');
    this.database.prepare(`
      UPDATE files SET title = ?, content = ?, folder_id = ?,
        updated_at = ?, dirty = 1
      WHERE id = ?
    `).run(
      changes.title ?? current.title,
      changes.content ?? current.content,
      changes.folderId === undefined ? current.folderId : changes.folderId,
      new Date().toISOString(),
      id
    );
    return this.get(id)!;
  }

  softDelete(id: string): void {
    const now = new Date().toISOString();
    this.database.prepare(`
      UPDATE files SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?
    `).run(now, now, id);
  }

  deletePermanently(id: string): void {
    this.database.prepare('DELETE FROM files WHERE id = ?').run(id);
  }

  dirtyFiles(): DesktopFile[] {
    return this.database.prepare(`
      SELECT id, title, content, folder_id AS folderId,
             created_at AS createdAt, updated_at AS updatedAt,
             deleted_at AS deletedAt, last_synced_at AS lastSyncedAt,
             base_updated_at AS baseUpdatedAt, dirty,
             conflict_json AS conflictJson
      FROM files WHERE dirty = 1 ORDER BY updated_at ASC
    `).all() as unknown as DesktopFile[];
  }

  applyRemote(file: FileWithRelations, syncedAt: string): void {
    const current = this.get(file.id);
    if (current?.dirty) {
      this.recordConflict(file.id, { kind: 'remote-update', file });
      return;
    }
    this.writeRemote(file, syncedAt);
  }

  markSynced(localId: string, file: FileWithRelations, syncedAt: string): void {
    if (localId !== file.id) this.deletePermanently(localId);
    this.writeRemote(file, syncedAt);
  }

  applyRemoteDelete(id: string): void {
    const current = this.get(id);
    if (!current) return;
    if (current.dirty) {
      this.recordConflict(id, { kind: 'remote-delete' });
    } else {
      this.deletePermanently(id);
    }
  }

  recordConflict(id: string, conflict: DesktopConflict): void {
    this.database.prepare('UPDATE files SET conflict_json = ? WHERE id = ?')
      .run(JSON.stringify(conflict), id);
  }

  resolveConflict(id: string, resolution: 'local' | 'remote'): void {
    const current = this.get(id);
    if (!current?.conflictJson) return;
    const conflict = JSON.parse(current.conflictJson) as DesktopConflict;
    if (resolution === 'remote') {
      if (conflict.kind === 'remote-delete') this.deletePermanently(id);
      else this.writeRemote(conflict.file, new Date().toISOString());
      return;
    }
    this.database.prepare(`
      UPDATE files SET conflict_json = NULL, dirty = 1,
        last_synced_at = ?, base_updated_at = ? WHERE id = ?
    `).run(
      conflict.kind === 'remote-delete' ? null : current.lastSyncedAt,
      conflict.kind === 'remote-update' ? conflict.file.updatedAt : null,
      id
    );
  }

  getCursor(): string {
    const row = this.database.prepare('SELECT value FROM sync_state WHERE key = ?')
      .get(CURSOR_KEY) as { value?: string } | undefined;
    return row?.value ?? '1970-01-01T00:00:00.000Z';
  }

  setCursor(value: string): void {
    this.database.prepare(`
      INSERT INTO sync_state (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(CURSOR_KEY, value);
  }

  private writeRemote(file: FileWithRelations, syncedAt: string): void {
    this.database.prepare(`
      INSERT OR REPLACE INTO files
        (id, title, content, folder_id, created_at, updated_at, deleted_at,
         last_synced_at, base_updated_at, dirty, conflict_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
    `).run(
      file.id,
      file.title,
      file.content,
      file.folderId,
      file.createdAt,
      file.updatedAt,
      file.deletedAt,
      syncedAt,
      file.updatedAt
    );
  }
}
