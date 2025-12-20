'use client';

import useSWR from 'swr';
import { filesApi } from '@/lib/api-client';
import type { File, FileWithRelations, FilesListParams } from '@/lib/types';

export function useFiles(params?: FilesListParams) {
  const key = params ? ['files', JSON.stringify(params)] : 'files';
  const { data, error, isLoading, mutate } = useSWR(key, () => filesApi.list(params), {
    revalidateOnFocus: false,
  });

  return {
    files: data?.files || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFile(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['file', id] : null,
    () => filesApi.get(id!),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    file: data?.file as FileWithRelations | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}
