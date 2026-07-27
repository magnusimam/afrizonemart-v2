'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { SupplierSidebar } from '@/components/supplier/SupplierSidebar';
import { SafeBoundary } from '@/components/common/SafeBoundary';

/**
 * Owns the mobile-drawer state for the supplier portal, so
 * `(supplier)/layout.tsx` can stay a server component that exports
 * metadata. Mirrors AdminShell:
 *   - md+: slim icon rail that expands on hover/focus (overlay — keeps the
 *          page wide). Managed inside SupplierSidebar.
 *   - <md: hidden sidebar + sticky navy topbar with a hamburger drawer.
 */
export function SupplierShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-page md:flex-row">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-navy px-3 py-2.5 text-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="-ml-1 rounded-md p-2 text-white hover:bg-white/10"
        >
          <Menu size={20} aria-hidden />
        </button>
        <Link href="/supplier/dashboard" className="font-raleway text-sm font-bold tracking-wide">
          Supplier Portal
        </Link>
        <span aria-hidden className="w-9" />
      </header>

      <SafeBoundary name="supplier:sidebar">
        <SupplierSidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </SafeBoundary>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <SafeBoundary name="supplier:page">{children}</SafeBoundary>
      </div>
    </div>
  );
}
