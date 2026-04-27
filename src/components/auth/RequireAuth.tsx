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
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthed = Boolean(user && accessToken);

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthed) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, isAuthed, pathname, router]);

  if (!hydrated || !isAuthed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-sans text-sm text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
