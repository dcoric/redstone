import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileWithRelations } from '../types';

const fakeDatabase = vi.hoisted(() => {
    const files = new Map<string, Record<string, unknown>>();
    const tags = new Map<string, Record<string, unknown>>();
    const fileTags = new Set<string>();
    const tagMutations = new Map<string, Record<string, unknown>>();

    return {
        files,
        tags,
        fileTags,
        tagMutations,
        execAsync: vi.fn(async () => undefined),
        getAllAsync: vi.fn(async (query: string, params: unknown[] = []) => {
            if (query.includes('PRAGMA table_info')) {
                return [{ name: 'conflict_json' }];
            }
            if (query.includes('FROM tag_mutations')) {
                return [...tagMutations.values()];
            }
            if (query.includes('SELECT file_id, tag_id FROM file_tags')) {
                return [...fileTags].map((pair) => {
                    const [file_id, tag_id] = pair.split('|');
                    return { file_id, tag_id };
                });
            }
            if (query.includes('FROM tags')) {
                if (query.includes('INNER JOIN file_tags')) {
                    const fileId = String(params[0]);
                    const tagIds = [...fileTags]
                        .filter((pair) => pair.startsWith(`${fileId}|`))
                        .map((pair) => pair.split('|')[1]);
                    return tagIds.flatMap((id) => {
                        const tag = tags.get(id);
                        return tag ? [tag] : [];
                    });
                }
                return [...tags.values()].map((tag) => ({
                    ...tag,
                    file_count: [...fileTags].filter((pair) => pair.endsWith(`|${tag.id}`)).length,
                }));
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
            if (query.includes('COUNT(*) AS count FROM tag_mutations')) {
                const fileId = String(params[0]);
                return {
                    count: [...tagMutations.values()].filter(
                        (mutation) => mutation.file_id === fileId
                    ).length,
                };
            }
            if (query.includes('COUNT(*) AS count FROM file_tags')) {
                const tagId = String(params[0]);
                return {
                    count: [...fileTags].filter((pair) => pair.endsWith(`|${tagId}`)).length,
                };
            }
            if (query.includes('FROM tags WHERE name')) {
                const name = String(params[0]).toLowerCase();
                return [...tags.values()].find(
                    (tag) => String(tag.name).toLowerCase() === name
                ) ?? null;
            }
            if (query.includes('FROM tag_mutations')) {
                const [fileId, tagId] = params.map(String);
                const operation = query.includes("operation = 'remove'")
                    ? 'remove'
                    : 'add';
                return [...tagMutations.values()].find(
                    (mutation) => mutation.file_id === fileId
                        && mutation.tag_id === tagId
                        && mutation.operation === operation
                ) ?? null;
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
            } else if (query.includes('INSERT INTO tags')) {
                const [id, name] = params;
                tags.set(String(id), {
                    id,
                    name,
                    is_temporary: query.includes('VALUES (?, ?, 1)') ? 1 : 0,
                });
            } else if (query.includes('INSERT OR IGNORE INTO file_tags')) {
                fileTags.add(`${params[0]}|${params[1]}`);
            } else if (query.includes('DELETE FROM file_tags')) {
                if (params.length === 2) {
                    fileTags.delete(`${params[0]}|${params[1]}`);
                } else {
                    for (const pair of [...fileTags]) {
                        if (pair.startsWith(`${params[0]}|`)) fileTags.delete(pair);
                    }
                }
            } else if (query.includes('INSERT INTO tag_mutations')) {
                const [id, fileId, tagId, tagName, createdAt] = params;
                tagMutations.set(String(id), {
                    id,
                    file_id: fileId,
                    tag_id: tagId,
                    tag_name: tagName,
                    operation: query.includes("'remove'") ? 'remove' : 'add',
                    created_at: createdAt,
                });
            } else if (query.includes('DELETE FROM tag_mutations')) {
                tagMutations.delete(String(params[0]));
            } else if (query.includes('DELETE FROM tags')) {
                tags.delete(String(params[0]));
            } else if (query.includes('UPDATE file_tags SET file_id')) {
                const [newId, oldId] = params.map(String);
                for (const pair of [...fileTags]) {
                    if (!pair.startsWith(`${oldId}|`)) continue;
                    fileTags.delete(pair);
                    fileTags.add(`${newId}|${pair.split('|')[1]}`);
                }
            } else if (query.includes('UPDATE tag_mutations SET file_id')) {
                const [newId, oldId] = params.map(String);
                for (const mutation of tagMutations.values()) {
                    if (mutation.file_id === oldId) mutation.file_id = newId;
                }
            }
        }),
    };
});

vi.mock('expo-sqlite', () => ({
    openDatabaseAsync: vi.fn(async () => fakeDatabase),
}));

import { dbFiles, dbTags, initDb, type LocalFile } from '../db';

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
        fakeDatabase.tags.clear();
        fakeDatabase.fileTags.clear();
        fakeDatabase.tagMutations.clear();
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

describe('mobile tag repository', () => {
    beforeEach(async () => {
        fakeDatabase.files.clear();
        fakeDatabase.tags.clear();
        fakeDatabase.fileTags.clear();
        fakeDatabase.tagMutations.clear();
        vi.clearAllMocks();
        await initDb();
        await dbFiles.insert(localFile());
    });

    it('queues an offline tag addition and cancels it when removed', async () => {
        const tag = await dbTags.addLocal(
            'local-file',
            'offline',
            'temporary-tag',
            'add-mutation'
        );

        await expect(dbTags.getForFile('local-file')).resolves.toMatchObject([
            { id: 'temporary-tag', name: 'offline', is_temporary: 1 },
        ]);
        await expect(dbTags.getPendingMutations()).resolves.toMatchObject([
            { operation: 'add', tag_name: 'offline' },
        ]);

        await dbTags.removeLocal('local-file', tag, 'remove-mutation');
        await expect(dbTags.getForFile('local-file')).resolves.toEqual([]);
        await expect(dbTags.getPendingMutations()).resolves.toEqual([]);
    });

    it('reconciles a temporary tag with the server tag', async () => {
        await dbTags.addLocal(
            'local-file',
            'shared',
            'temporary-tag',
            'add-mutation'
        );
        const [mutation] = await dbTags.getPendingMutations();

        await dbTags.markAddSynced(mutation, {
            id: 'server-tag',
            name: 'shared',
            userId: 'user-1',
            createdAt: '2026-01-01T00:00:00.000Z',
        });

        await expect(dbTags.getForFile('local-file')).resolves.toMatchObject([
            { id: 'server-tag', name: 'shared', is_temporary: 0 },
        ]);
        await expect(dbTags.getPendingMutations()).resolves.toEqual([]);
    });
});
