import { useState, useEffect, useCallback } from 'react';
import {
    dbFiles,
    dbFolders,
    dbTags,
    initDb,
    type LocalFile,
    type LocalFolder,
    type LocalTag,
    type LocalFileTag,
} from '../db';
import { syncFiles, type SyncResult } from '../sync';

type SyncStatus = SyncResult['status'] | 'idle' | 'syncing';

export function useFiles() {
    const [files, setFiles] = useState<LocalFile[]>([]);
    const [folders, setFolders] = useState<LocalFolder[]>([]);
    const [tags, setTags] = useState<LocalTag[]>([]);
    const [fileTags, setFileTags] = useState<LocalFileTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [syncErrors, setSyncErrors] = useState<string[]>([]);

    const loadFiles = useCallback(async () => {
        try {
            const [localFiles, localFolders, localTags, localFileTags] = await Promise.all([
                dbFiles.getAll(),
                dbFolders.getAll(),
                dbTags.getAll(),
                dbTags.getFileTags(),
            ]);
            setFiles(localFiles);
            setFolders(localFolders);
            setTags(localTags);
            setFileTags(localFileTags);
        } catch (error) {
            console.error('Failed to load local files', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const runSync = useCallback(async () => {
        setSyncStatus('syncing');
        const result = await syncFiles();
        setSyncStatus(result.status);
        setSyncErrors(result.errors);
        await loadFiles();
        return result;
    }, [loadFiles]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await runSync();
        } catch (error) {
            console.error('Refresh failed', error);
            setSyncStatus('partial');
            setSyncErrors(['Unexpected synchronization failure']);
        } finally {
            setRefreshing(false);
        }
    }, [runSync]);

    useEffect(() => {
        let active = true;
        initDb().then(async () => {
            if (!active) return;
            await loadFiles();
            if (active) await runSync();
        });
        return () => {
            active = false;
        };
    }, [loadFiles, runSync]);

    return {
        files,
        folders,
        tags,
        fileTags,
        loading,
        refreshing,
        refresh,
        reload: loadFiles,
        syncStatus,
        syncErrors,
    };
}
