import type { FileWithRelations } from '@redstone/shared';
import type { DesktopSyncResult } from './contracts';
import { DesktopApiClient, DesktopApiError } from './api-client';
import { VaultDatabase } from './vault-database';

function conflictFile(error: unknown): FileWithRelations | null {
  if (!(error instanceof DesktopApiError) || error.status !== 409) return null;
  if (!error.details || typeof error.details !== 'object') return null;
  if (!('currentFile' in error.details)) return null;
  return error.details.currentFile as FileWithRelations;
}

export async function syncVault(
  database: VaultDatabase,
  api: DesktopApiClient,
  token: string | null
): Promise<DesktopSyncResult> {
  if (!token) return { status: 'offline', errors: [] };
  const errors: string[] = [];

  for (const file of database.dirtyFiles()) {
    try {
      if (file.deletedAt) {
        if (file.lastSyncedAt) {
          await api.deleteFile(token, file.id, file.baseUpdatedAt);
        }
        database.deletePermanently(file.id);
      } else if (!file.lastSyncedAt) {
        const response = await api.createFile(token, file.title, file.content);
        database.markSynced(file.id, response.file, new Date().toISOString());
      } else {
        const response = await api.updateFile(token, file.id, {
          title: file.title,
          content: file.content,
          folderId: file.folderId,
          baseUpdatedAt: file.baseUpdatedAt ?? undefined,
        });
        database.markSynced(file.id, response.file, new Date().toISOString());
      }
    } catch (error) {
      const remote = conflictFile(error);
      if (remote) database.recordConflict(file.id, { kind: 'remote-update', file: remote });
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  try {
    const changes = await api.pull(token, database.getCursor());
    for (const file of changes.files.upserted) {
      database.applyRemote(file, changes.syncedAt);
    }
    for (const id of changes.files.deleted) database.applyRemoteDelete(id);
    database.setCursor(changes.syncedAt);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return errors.length
    ? { status: 'partial', errors }
    : { status: 'synced', errors: [] };
}
