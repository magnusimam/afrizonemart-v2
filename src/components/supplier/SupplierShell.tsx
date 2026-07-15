'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { SupplierSidebar } from '@/components/supplier/SupplierSidebar';
import { SafeBoundary } from '@/components/common/SafeBoundary';

/**
 * Layout wrapper for the supplier portal. Mirrors the AdminShell pattern:
 * sticky mobile topbar with a hamburger that reveals the sidebar drawer,
 * sidebar fixed and always-visible on md+. Owns the mobile-open state so
 * (supplier)/layout.tsx can stay a server component.
 */
export function SupplierShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-page md:flex-row">
      {/* Mobile-only topbar */}
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
          href="/supplier/dashboard"
          className="font-raleway text-sm font-bold tracking-wide"
        >
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

      <div className="flex-1 overflow-x-auto">
        <SafeBoundary name="supplier:page">{children}</SafeBoundary>
      </div>
    </div>
  );
}
