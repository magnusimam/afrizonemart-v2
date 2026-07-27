'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getSupplierMe, getSupplierPIQs } from './supplier';

/**
 * React-query hooks for the supplier portal. Keyed so the gate
 * (RequireSupplier) and the pages share one cached `/me` fetch instead of
 * each hitting the API. Only run while a user is present.
 */
export const supplierKeys = {
  me: ['supplier', 'me'] as const,
  piqs: ['supplier', 'piqs'] as const,
};

export function useSupplierMe() {
  const isAuthed = useAuthStore((s) => Boolean(s.user));
  return useQuery({
    queryKey: supplierKeys.me,
    queryFn: getSupplierMe,
    enabled: isAuthed,
    retry: false, // a 404 (not a supplier) must surface immediately
    staleTime: 60_000,
  });
}

export function useSupplierPIQs() {
  const isAuthed = useAuthStore((s) => Boolean(s.user));
  return useQuery({
    queryKey: supplierKeys.piqs,
    queryFn: getSupplierPIQs,
    enabled: isAuthed,
    staleTime: 30_000,
  });
}
