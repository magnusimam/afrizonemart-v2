'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Supplier-specific sub-nav for the `/suppliers` marketing page.
 * Sits below the global Header and gives the page its own "portal" feel
 * (like Amazon Seller Central's seller sub-nav) — anchor links to the
 * sections plus the two primary CTAs. Sticky, with a shadow that fades
 * in once the user scrolls past the hero.
 */

const LINKS: { href: string; label: string }[] = [
  { href: '#why', label: 'Why supply to us' },
  { href: '#how', label: 'How it works' },
  { href: '#journey', label: 'The journey' },
  { href: '#tools', label: 'Your dashboard' },
  { href: '#help', label: 'Help & services' },
  { href: '#faq', label: 'FAQ' },
];

export function SupplierLandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 border-b bg-navy/95 text-white backdrop-blur transition-all ${
        scrolled ? 'border-white/10 shadow-lg' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-site items-center gap-4 px-4">
        {/* Brand */}
        <Link href="/suppliers" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-amber-dark font-raleway text-base font-extrabold text-navy">
            A
          </span>
          <span className="hidden leading-none sm:block">
            <span className="font-raleway text-base font-extrabold text-white">
              Afrizonemart
            </span>
            <span className="ml-1.5 rounded bg-amber/90 px-1.5 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              Suppliers
            </span>
          </span>
        </Link>

        {/* Center anchor links */}
        <div className="mx-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-btn px-3 py-2 font-sans text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-btn px-3 py-2 font-raleway text-sm font-semibold text-white/70 transition-colors hover:text-amber sm:inline-flex"
          >
            <ArrowLeft size={15} aria-hidden /> Back to shopping
          </Link>
          <span aria-hidden className="hidden h-5 w-px bg-white/15 sm:block" />
          <Link
            href="/supplier/login"
            className="hidden rounded-btn px-3 py-2 font-raleway text-sm font-semibold text-white/90 transition-colors hover:text-amber sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/supplier/register"
            className="rounded-btn bg-amber px-4 py-2 font-raleway text-sm font-bold tracking-btn text-navy shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-white"
          >
            Apply to supply
          </Link>
        </div>
      </div>
    </nav>
  );
}
