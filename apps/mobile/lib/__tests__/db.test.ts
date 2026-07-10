import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileWithRelations } from '../types';

const fakeDatabase = vi.hoisted(() => {
    const files = new Map<string, Record<string, unknown>>();

    return {
        files,
        execAsync: vi.fn(async () => undefined),
        getAllAsync: vi.fn(async (query: string) => {
            if (query.includes('PRAGMA table_info')) {
                return [{ name: 'conflict_json' }];
            }
            const rows = [...files.values()];
            return query.includes('dirty = 1')
                ? rows.filter((row) => row.dirty === 1)
                : rows.filter((row) => row.deleted_at === null);
        }),
        getFirstAsync: vi.fn(async (query: string, params: unknown[]) => {
            if (query.includes('FROM files')) {
                return files.get(String(params[0])) ?? null;
            }
            return null;
        }),
        runAsync: vi.fn(async (query: string, params: unknown[]) => {
            if (query.includes('INSERT OR REPLACE INTO files')) {
                const [
                    id,
                    title,
                    content,
                    folderId,
                    createdAt,
                    updatedAt,
                    deletedAt,
                    lastSynced,
                    dirty,
                    versionId,
                    conflictJson,
                ] = params;
                files.set(String(id), {
                    id,
                    title,
                    content,
                    folder_id: folderId,
                    created_at: createdAt,
                    updated_at: updatedAt,
                    deleted_at: deletedAt,
                    last_synced: lastSynced,
                    dirty,
                    version_id: versionId,
                    conflict_json: conflictJson,
                });
            } else if (query.includes('DELETE FROM files')) {
                files.delete(String(params[0]));
            }
        }),
    };
});

vi.mock('expo-sqlite', () => ({
    openDatabaseAsync: vi.fn(async () => fakeDatabase),
}));

import { dbFiles, initDb, type LocalFile } from '../db';

const localFile = (overrides: Partial<LocalFile> = {}): LocalFile => ({
    id: 'local-file',
    title: 'Local title',
    content: 'Local content',
    folder_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    last_synced: null,
    dirty: 0,
    version_id: null,
    conflict_json: null,
    ...overrides,
});

const remoteFile = (
    overrides: Partial<FileWithRelations> = {}
): FileWithRelations => ({
    id: 'local-file',
    title: 'Server title',
    content: 'Server content',
    folderId: null,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    deletedAt: null,
    lastSynced: '2026-01-02T00:00:00.000Z',
    ...overrides,
});

describe('mobile file repository', () => {
    beforeEach(async () => {
        fakeDatabase.files.clear();
        vi.clearAllMocks();
        await initDb();
    });

    it('marks local edits dirty', async () => {
        await dbFiles.insert(localFile());

        const updated = await dbFiles.updateLocal('local-file', {
            title: 'Edited offline',
            dirty: 0,
        });

        expect(updated).toBe(true);
        expect(await dbFiles.getById('local-file')).toMatchObject({
            title: 'Edited offline',
            dirty: 1,
        });
    });

    it('does not overwrite an unsynced local edit with a remote pull', async () => {
        await dbFiles.insert(localFile({ title: 'Edited offline', dirty: 1 }));

        const applied = await dbFiles.upsertRemote(
            remoteFile(),
            '2026-01-02T00:01:00.000Z'
        );

        expect(applied).toBe(true);
        expect(await dbFiles.getById('local-file')).toMatchObject({
            title: 'Edited offline',
            dirty: 1,
        });
        await expect(dbFiles.getConflict('local-file')).resolves.toMatchObject({
            kind: 'remote-update',
            file: { title: 'Server title' },
        });
    });

    it('replaces a local record with the acknowledged server version', async () => {
        await dbFiles.insert(localFile({ id: 'temporary-id', dirty: 1 }));

        await dbFiles.markSynced(
            'temporary-id',
            remoteFile({ id: 'server-id' }),
            '2026-01-02T00:01:00.000Z'
        );

        expect(await dbFiles.getById('temporary-id')).toBeNull();
        expect(await dbFiles.getById('server-id')).toMatchObject({
            title: 'Server title',
            dirty: 0,
            last_synced: '2026-01-02T00:01:00.000Z',
        });
    });

    it('rebases an explicitly chosen local version onto the remote revision', async () => {
        await dbFiles.insert(localFile({ title: 'Edited offline', dirty: 1 }));
        await dbFiles.upsertRemote(remoteFile(), '2026-01-02T00:01:00.000Z');

        await dbFiles.resolveConflict('local-file', 'local');

        expect(await dbFiles.getById('local-file')).toMatchObject({
            title: 'Edited offline',
            version_id: '2026-01-02T00:00:00.000Z',
            conflict_json: null,
            dirty: 1,
        });
    });

    it('can replace a local edit with the remote conflict version', async () => {
        await dbFiles.insert(localFile({ title: 'Edited offline', dirty: 1 }));
        await dbFiles.upsertRemote(remoteFile(), '2026-01-02T00:01:00.000Z');

        await dbFiles.resolveConflict('local-file', 'remote');

        expect(await dbFiles.getById('local-file')).toMatchObject({
            title: 'Server title',
            conflict_json: null,
            dirty: 0,
        });
    });
});
