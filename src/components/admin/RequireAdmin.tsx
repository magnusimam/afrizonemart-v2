'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  children: React.ReactNode;
}

/**
 * Client-side gate for admin routes. Like RequireAuth, but also checks
 * that the user has the ADMIN role. Non-admins get bounced to /account
 * instead of /login (they're authed, just not authorized).
 */
export function RequireAdmin({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthed = Boolean(user && accessToken);
  // ADMIN gets full access; STAFF gets in too — their effective
  // permissions filter the sidebar to only what they were granted.
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthed) {
      // Send unauthenticated visitors to the dedicated admin sign-in
      // (not /login, which is customer-facing). This avoids leaking
      // admin URLs to the public marketing flow and makes the
      // "you need to log in to admin" intent obvious.
      router.replace(`/admin/login?returnUrl=${encodeURIComponent(pathname)}`);
    } else if (!isAdmin) {
      router.replace('/account');
    }
  }, [hydrated, isAuthed, isAdmin, pathname, router]);

  if (!hydrated || !isAuthed || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans text-sm text-muted">
        Loading admin…
      </div>
    );
  }

  return <>{children}</>;
}
