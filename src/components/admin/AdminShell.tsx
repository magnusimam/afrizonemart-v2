'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SafeBoundary } from '@/components/common/SafeBoundary';

/**
 * Layout wrapper that owns the mobile-drawer state. Kept separate from
 * (admin)/layout.tsx so that file can stay a server component and still
 * export `metadata` while the interactive shell lives in a client island.
 *
 * Layout pattern:
 *   - md+: sidebar is static + always visible, no topbar.
 *   - <md: sidebar is hidden by default; a sticky navy topbar with a
 *     hamburger button + brand reveals it as a drawer.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-page md:flex-row">
      {/* Mobile-only topbar — sticky so the hamburger is always reachable
          even after scrolling deep into a long page. Hidden on md+. */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-navy px-3 py-2.5 text-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="-ml-1 rounded-md p-2 text-white hover:bg-white/10"
        >
          <Menu size={20} aria-hidden />
        </button>
        <Link
          href="/admin"
          className="font-raleway text-sm font-bold tracking-wide"
        >
          Admin Console
        </Link>
        {/* Spacer to balance the hamburger so the title stays centred. */}
        <span aria-hidden className="w-9" />
      </header>

      <SafeBoundary name="admin:sidebar">
        <AdminSidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </SafeBoundary>

      <div className="flex-1 overflow-x-auto">
        <SafeBoundary name="admin:page">{children}</SafeBoundary>
      </div>
    </div>
  );
}
