'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  children: React.ReactNode;
}

/**
 * Client-side gate for the supplier portal. Like RequireAdmin but for
 * the SUPPLIER role. ADMIN is also admitted so admin staff can preview
 * what suppliers see — useful for support and QA.
 *
 * Non-suppliers (customers / sellers / staff) get bounced to /supplier/login
 * with a returnUrl so they can sign in as a supplier and come back.
 */
export function RequireSupplier({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthed = Boolean(user && accessToken);
  const isSupplier = user?.role === 'SUPPLIER' || user?.role === 'ADMIN';

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
      router.replace(`/supplier/login?returnUrl=${encodeURIComponent(pathname)}`);
    } else if (!isSupplier) {
      // Authed but wrong role — kick them to their account home rather
      // than the supplier sign-in. Don't trap a customer on /supplier.
      router.replace('/account');
    }
  }, [hydrated, isAuthed, isSupplier, pathname, router]);

  if (!hydrated || !isAuthed || !isSupplier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans text-sm text-muted">
        Loading supplier portal…
      </div>
    );
  }

  return <>{children}</>;
}
