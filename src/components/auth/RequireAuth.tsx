'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  children: React.ReactNode;
}

/**
 * Client-side gate for authenticated routes. Waits for the persisted
 * auth store to rehydrate from localStorage before deciding — otherwise
 * we'd briefly redirect a logged-in user on every page reload.
 */
export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const user = useAuthStore((s) => s.user);
  const refreshing = useAuthStore((s) => s.refreshing);
  // Phase 11.3 (audit C2): the access token lives in memory only and
  // is minted from the refresh cookie on rehydrate. We trust the
  // persisted `user` flag, then wait for any in-flight refresh to
  // settle — `clear()` inside `refresh()` drops the user if refresh
  // fails, which then triggers the redirect below.
  const isAuthed = Boolean(user);

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !refreshing && !isAuthed) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, refreshing, isAuthed, pathname, router]);

  if (!hydrated || refreshing || !isAuthed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-sans text-sm text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
