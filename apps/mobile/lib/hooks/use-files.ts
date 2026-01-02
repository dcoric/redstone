import { useState, useEffect, useCallback } from 'react';
import { dbFiles, initDb, LocalFile } from '../db';
import { syncFiles } from '../sync';
import { FileWithRelations } from '../types';

export function useFiles() {
    const [files, setFiles] = useState<LocalFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFiles = useCallback(async () => {
        try {
            // 1. Load from local DB
            const localFiles = await dbFiles.getAll();
            setFiles(localFiles);
        } catch (error) {
            console.error('Failed to load local files', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // 1. Sync with server
            await syncFiles();
            // 2. Reload local
            await loadFiles();
        } catch (error) {
            console.error('Refresh failed', error);
        } finally {
            setRefreshing(false);
        }
    }, [loadFiles]);

    useEffect(() => {
        // Initial load
        initDb().then(() => {
            loadFiles();
            // Try initial sync in background
            syncFiles().then(loadFiles);
        });
    }, [loadFiles]);

    return {
        files,
        loading,
        refreshing,
        refresh,
        reload: loadFiles // exposed to force reload after mutations
    };
}
