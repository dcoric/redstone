'use client';

import useSWR from 'swr';
import { tagsApi } from '@/lib/api-client';
import type { Tag } from '@/lib/types';

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR('tags', () => tagsApi.list(), {
    revalidateOnFocus: false,
  });

  return {
    tags: data?.tags || [],
    isLoading,
    isError: error,
    mutate,
  };
}

