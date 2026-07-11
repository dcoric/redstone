import { describe, expect, it } from 'vitest';
import { flattenFolders } from '../folders';
import type { LocalFolder } from '../db';

const folder = (
    id: string,
    name: string,
    parentId: string | null
): LocalFolder => ({
    id,
    name,
    parent_id: parentId,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    last_synced: '2026-01-01T00:00:00.000Z',
    dirty: 0,
});

describe('flattenFolders', () => {
    it('orders a nested folder tree with depth metadata', () => {
        const result = flattenFolders([
            folder('child', 'Child', 'root'),
            folder('other', 'Another root', null),
            folder('root', 'Root', null),
        ]);

        expect(result.map(({ folder: item, depth }) => [item.name, depth])).toEqual([
            ['Another root', 0],
            ['Root', 0],
            ['Child', 1],
        ]);
    });

    it('treats an orphaned folder as a root', () => {
        expect(flattenFolders([folder('orphan', 'Orphan', 'missing')])).toMatchObject([
            { folder: { id: 'orphan' }, depth: 0 },
        ]);
    });
});
