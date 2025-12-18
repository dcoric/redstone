'use client';

import useSWR from 'swr';
import { foldersApi } from '@/lib/api-client';
import type { Folder } from '@/lib/types';

export function useFolders() {
  const { data, error, isLoading, mutate } = useSWR(
    'folders',
    () => foldersApi.list(),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    folders: data?.folders || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFolder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['folder', id] : null,
    () => foldersApi.get(id!),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    folder: data?.folder as Folder | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

