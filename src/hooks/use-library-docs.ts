'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLibraryDoc, fetchLibraryDocs } from '@/lib/api/documents';
import type { ListLibraryDocsParams } from '@/lib/api/documents';

export function useLibraryDocs(params: ListLibraryDocsParams = {}) {
  return useQuery({
    queryKey: ['library-docs', params],
    queryFn: () => fetchLibraryDocs(params),
  });
}

export function useLibraryDoc(slug: string) {
  return useQuery({
    queryKey: ['library-doc', slug],
    queryFn: () => fetchLibraryDoc(slug),
    enabled: Boolean(slug),
  });
}
