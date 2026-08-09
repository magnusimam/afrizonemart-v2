'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSupplierMe } from '@/lib/api/supplier-hooks';
import { HttpApiError } from '@/lib/api/client';

/**
 * Client-side gate for the supplier portal (the supplier mirror of
 * RequireAdmin). A supplier = any AZM account that has a SupplierProfile.
 *   1. wait for authStore hydration + any in-flight refresh,
 *   2. unauthenticated → /supplier/login?returnUrl=…,
 *   3. `useSupplierMe()` (shared react-query) → success renders; a 404
 *      (authed but not a supplier) sends them to /suppliers to Apply.
 */
export function RequireSupplier({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const user = useAuthStore((s) => s.user);
  const refreshing = useAuthStore((s) => s.refreshing);
  const isAuthed = Boolean(user);

  const { isSuccess, error, isLoading } = useSupplierMe();

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated || refreshing) return;
    if (!isAuthed) {
      router.replace(`/supplier/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, refreshing, isAuthed, pathname, router]);

  useEffect(() => {
    if (!error) return;
    if (error instanceof HttpApiError && error.status === 401) {
      router.replace(`/supplier/login?returnUrl=${encodeURIComponent(pathname)}`);
    } else {
      // 404 (not a supplier) or other → the public landing's Apply flow.
      router.replace('/suppliers');
    }
  }, [error, pathname, router]);

  if (!hydrated || refreshing || !isAuthed || isLoading || !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans text-sm text-muted">
        Loading your portal…
      </div>
    );
  }

  return <>{children}</>;
}
