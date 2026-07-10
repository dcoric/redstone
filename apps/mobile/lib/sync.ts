import * as Network from 'expo-network';
import { dbFiles, dbFolders, syncState } from './db';
import { filesApi, syncApi } from './api-client';

const FILE_SYNC_CURSOR = 'files_and_folders_cursor';
const INITIAL_SYNC_CURSOR = '1970-01-01T00:00:00.000Z';

export type SyncResult =
    | { status: 'offline'; errors: [] }
    | { status: 'synced'; errors: [] }
    | { status: 'partial'; errors: string[] };

export const syncFiles = async (): Promise<SyncResult> => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || networkState.isInternetReachable === false) {
        return { status: 'offline', errors: [] };
    }

    const errors: string[] = [];
    const dirtyFiles = await dbFiles.getDirty();

    for (const file of dirtyFiles) {
        try {
            if (file.deleted_at) {
                if (file.last_synced) {
                    await filesApi.delete(file.id);
                }
                await dbFiles.deletePermanently(file.id);
            } else if (!file.last_synced) {
                const response = await filesApi.create({
                    title: file.title,
                    content: file.content,
                    folderId: file.folder_id,
                });
                await dbFiles.markSynced(
                    file.id,
                    response.file,
                    new Date().toISOString()
                );
            } else {
                const response = await filesApi.update(file.id, {
                    title: file.title,
                    content: file.content,
                    folderId: file.folder_id,
                });
                await dbFiles.markSynced(
                    file.id,
                    response.file,
                    new Date().toISOString()
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`Failed to push file ${file.id}: ${message}`);
        }
    }

    try {
        const cursor = (await syncState.get(FILE_SYNC_CURSOR)) ?? INITIAL_SYNC_CURSOR;
        const changes = await syncApi.pull(cursor);
        let appliedAllChanges = true;

        for (const folder of changes.folders.upserted) {
            appliedAllChanges =
                (await dbFolders.upsertRemote(folder, changes.syncedAt)) &&
                appliedAllChanges;
        }
        for (const file of changes.files.upserted) {
            appliedAllChanges =
                (await dbFiles.upsertRemote(file, changes.syncedAt)) &&
                appliedAllChanges;
        }
        for (const id of changes.files.deleted) {
            appliedAllChanges =
                (await dbFiles.applyRemoteDelete(id)) && appliedAllChanges;
        }
        for (const id of changes.folders.deleted) {
            appliedAllChanges =
                (await dbFolders.applyRemoteDelete(id)) && appliedAllChanges;
        }

        if (appliedAllChanges) {
            await syncState.set(FILE_SYNC_CURSOR, changes.syncedAt);
        } else {
            errors.push('Remote changes conflict with unsynced local changes');
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to pull remote changes: ${message}`);
    }

    return errors.length > 0
        ? { status: 'partial', errors }
        : { status: 'synced', errors: [] };
};
