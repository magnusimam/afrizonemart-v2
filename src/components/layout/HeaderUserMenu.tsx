'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { logoutUser } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

export function HeaderUserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return unsub;
  }, []);

  const handleLogout = async () => {
    if (accessToken) {
      try {
        await logoutUser(accessToken);
      } catch {
        // Even if the server call fails, clear local state — the user
        // expects to be signed out from this device.
      }
    }
    clear();
    router.push('/');
  };

  // During hydration, render a static placeholder matching the
  // signed-out width so the header doesn't visibly shift.
  if (!hydrated) {
    return (
      <span className="hidden shrink-0 items-center gap-2 font-raleway text-sm font-semibold text-navy md:flex">
        <User size={20} aria-hidden />
        My Account
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden shrink-0 items-center gap-2 font-raleway text-sm font-semibold text-navy hover:text-amber md:flex"
      >
        <User size={20} aria-hidden />
        Sign In
      </Link>
    );
  }

  const firstName = user.name?.trim().split(/\s+/)[0] ?? user.email;

  return (
    <div className="hidden shrink-0 items-center gap-3 md:flex">
      <Link
        href="/account"
        className="flex items-center gap-2 font-raleway text-sm font-semibold text-navy hover:text-amber"
      >
        <User size={20} aria-hidden />
        Hi, {firstName}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        title="Sign out"
        aria-label="Sign out"
        className="flex items-center gap-1 font-raleway text-xs font-semibold uppercase tracking-btn text-muted hover:text-danger"
      >
        <LogOut size={16} aria-hidden />
      </button>
    </div>
  );
}
