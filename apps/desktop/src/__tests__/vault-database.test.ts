import { describe, expect, it } from 'vitest';
import type { FileWithRelations } from '@redstone/shared';
import { VaultDatabase } from '../vault-database';

const remoteFile = (overrides: Partial<FileWithRelations> = {}): FileWithRelations => ({
  id: 'server-file',
  title: 'Server note',
  content: 'Server content',
  folderId: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  deletedAt: null,
  lastSynced: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

describe('VaultDatabase', () => {
  it('supports offline create, update, search, and delete', () => {
    const database = new VaultDatabase(':memory:');
    const created = database.create();
    const updated = database.update(created.id, {
      title: 'Offline knowledge',
      content: 'Searchable content',
    });

    expect(updated.dirty).toBe(1);
    expect(database.list('searchable')).toMatchObject([
      { id: created.id, title: 'Offline knowledge' },
    ]);

    database.softDelete(created.id);
    expect(database.list()).toEqual([]);
    expect(database.dirtyFiles()).toHaveLength(1);
    database.close();
  });

  it('preserves local changes and records remote conflicts', () => {
    const database = new VaultDatabase(':memory:');
    database.applyRemote(remoteFile(), '2026-01-02T00:01:00.000Z');
    database.update('server-file', { content: 'Edited offline' });
    database.applyRemote(
      remoteFile({ content: 'Edited elsewhere', updatedAt: '2026-01-03T00:00:00.000Z' }),
      '2026-01-03T00:01:00.000Z'
    );

    expect(database.get('server-file')).toMatchObject({
      content: 'Edited offline',
      dirty: 1,
    });
    expect(database.get('server-file')?.conflictJson).toContain('remote-update');

    database.resolveConflict('server-file', 'remote');
    expect(database.get('server-file')).toMatchObject({
      content: 'Edited elsewhere',
      dirty: 0,
      conflictJson: null,
    });
    database.close();
  });

  it('persists the incremental sync cursor', () => {
    const database = new VaultDatabase(':memory:');
    expect(database.getCursor()).toBe('1970-01-01T00:00:00.000Z');
    database.setCursor('2026-01-04T00:00:00.000Z');
    expect(database.getCursor()).toBe('2026-01-04T00:00:00.000Z');
    database.close();
  });
});
