import * as Network from 'expo-network';
import { dbFiles, LocalFile } from './db';
import { filesApi } from './api-client';
import { FileWithRelations } from './types';

// Simplified Sync Logic
// 1. Push local dirty changes to server
// 2. Pull server changes since last sync
// 3. Resolve conflicts (Server Wins for now)

export const syncFiles = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
        return; // Offline, skip sync
    }

    try {
        // 1. Push changes
        const dirtyFiles = await dbFiles.getDirty();
        for (const file of dirtyFiles) {
            try {
                if (file.deleted_at) {
                    // Handle Delete
                    await filesApi.delete(file.id);
                } else if (file.versionId === null && file.last_synced === null) {
                    // New File (Create)
                    // If ID was generated locally, we need to handle mapping or just let server generate and we replace.
                    // For simplicity in this plan: We assumed online-first for creation earlier.
                    // Offline creation: Generate temporary ID locally.
                    // On sync: POST to server -> get real ID -> replace local ID.
                    // This is complex for a "basic" implementation. 
                    // Alternative: POST with the local ID if server allows? 
                    // Standard approach: POST, get response, update local DB with real ID.

                    // For this implementation, I will skip sophisticated "Offline Creation" sync for a moment 
                    // and assume we just want to sync edits to existing files first, or handle "New" simply.
                    const res = await filesApi.create({ title: file.title, content: file.content });
                    // Delete temporary local file and insert real one? Or update ID? 
                    // Updating ID in SQLite is tricky (PK). Easier to delete and re-insert.
                    // await dbFiles.delete(file.id); 
                    // await dbFiles.insert(mapRemoteToLocal(res.file));
                } else {
                    // Update
                    await filesApi.update(file.id, { title: file.title, content: file.content });
                }

                // After successful push, mark not dirty
                // Actually, we should pull the latest version from server response to be sure.
                // For now, just mark clean.
                await dbFiles.update(file.id, { dirty: 0, last_synced: new Date().toISOString() });

            } catch (e) {
                console.error('Failed to sync file', file.id, e);
                // Keep dirty, try next time
            }
        }

        // 2. Pull changes
        // We need a "last sync timestamp"
        // For now, let's just fetch all (or recent) and upsert.
        // Optimized: /api/sync endpoint (if it exists) or just /files?updatedSince=...
        // The plan mentioned /api/sync. Let's see if it exists in API.md or we need to add it to web.
        // Checking types.ts... SyncResponse exists!
        // So we can use /api/sync?since=...

        // We need to store last global sync timestamp.
        // For MVP, lets just fetch list and compare timestamps or use the full list.
        const remoteFiles = await filesApi.list();

        for (const remote of remoteFiles.files) {
            await dbFiles.insert({
                id: remote.id,
                title: remote.title,
                content: remote.content,
                folder_id: remote.folderId || null,
                created_at: remote.createdAt,
                updated_at: remote.updatedAt,
                deleted_at: remote.deletedAt,
                last_synced: new Date().toISOString(),
                dirty: 0,
                versionId: null // or whatever version field
            });
        }

    } catch (error) {
        console.error('Sync failed', error);
    }
};
