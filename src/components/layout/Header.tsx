'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { CartBadge } from '@/components/cart/CartBadge';
import { HeaderUserMenu } from '@/components/layout/HeaderUserMenu';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/common/CurrencySwitcher';
import { CategoriesDropdown } from '@/components/layout/CategoriesDropdown';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { SafeBoundary } from '@/components/common/SafeBoundary';

// Static nav items rendered AFTER the All Categories dropdown
// (desktop only — mobile shows everything in the drawer instead).
const navItems = [
  { label: 'Shop By Country', href: '/shop/countries' },
  { label: 'Special Discounts', href: '/special-discount' },
  { label: '$1 Store', href: '/shop/1k-store' },
  { label: "Today's Deals", href: '/deals' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Become A Supplier', href: '/suppliers' },
];

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="w-full bg-white">
      {/* MOBILE CHROME — top strip + search row are sticky as one
          block so the customer can re-search at any scroll depth
          (the homepage is long; without this they have to scroll
          back to the top). `pt-safe` honours the iOS notch in
          landscape; the shadow-sm appears on scroll via the
          sticky's offset background. Hidden on md+. */}
      <div className="sticky top-0 z-40 w-full bg-white pt-safe shadow-[0_1px_0_0_rgba(0,0,0,0.06)] md:static md:shadow-none md:pt-0">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 md:hidden">
          <Link
            href="/"
            className="-m-1 inline-flex shrink-0 items-center p-1"
            aria-label="Afrizonemart home"
          >
            <Image
              src="/images/logo.png"
              alt="AfriZoneMart.com"
              width={260}
              height={80}
              priority
              className="h-9 w-auto"
            />
          </Link>

          <SafeBoundary name="header:currency-mobile" fallback={null}>
            <CurrencySwitcher />
          </SafeBoundary>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-navy text-white shadow-card transition-colors hover:bg-navy/90 active:bg-navy/80"
          >
            <Menu size={22} aria-hidden />
          </button>
        </div>

        {/* MOBILE SEARCH ROW. Input is text-base (16px) — anything
            smaller triggers iOS Safari's zoom-on-focus behaviour. */}
        <form
          role="search"
          action="/search"
          method="GET"
          className="flex items-stretch gap-0 px-3 pb-2.5 md:hidden"
        >
          <input
            type="search"
            name="q"
            placeholder="Search products, brands & categories"
            aria-label="Search products"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-l-input border border-r-0 border-border bg-white px-3 py-2.5 font-sans text-base text-charcoal placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-r-input bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy/90 active:bg-navy/80"
          >
            <Search size={14} aria-hidden />
            Search
          </button>
        </form>
      </div>

      {/* DESKTOP TOP STRIP — logo + search + currency/lang + cart + user. */}
      <div className="mx-auto hidden max-w-site items-center gap-6 px-3 py-4 md:flex md:gap-8 md:px-6 lg:px-10 xl:pl-14 xl:pr-12">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="AfriZoneMart.com — Made in Africa, delivered worldwide"
            width={260}
            height={80}
            priority
            className="h-16 w-auto lg:h-[72px]"
          />
        </Link>

        <form
          role="search"
          action="/search"
          method="GET"
          className="flex max-w-[720px] flex-1 items-stretch overflow-hidden rounded-input border border-border bg-white"
        >
          <input
            type="search"
            name="q"
            placeholder="Search for products, brands & categories..."
            aria-label="Search products"
            className="min-w-0 flex-1 px-4 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark md:px-7 md:text-sm"
          >
            <Search size={16} aria-hidden />
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <CurrencySwitcher />
          <LanguageSwitcher />
        </div>

        <CartBadge />

        <HeaderUserMenu />
      </div>

      {/* CATEGORY NAV STRIP — desktop only. Mobile uses the drawer. */}
      <nav className="hidden w-full bg-navy md:block">
        <ul className="mx-auto flex max-w-site items-center divide-x divide-white/30 overflow-x-auto py-2.5 pl-20 pr-4">
          <li className="shrink-0">
            <SafeBoundary
              name="header:categories-dropdown"
              fallback={
                <Link
                  href="/shop"
                  className="flex items-center gap-1 px-4 font-raleway text-xs font-semibold text-white hover:text-amber md:px-6 md:text-sm"
                >
                  All Categories
                </Link>
              }
            >
              <CategoriesDropdown />
            </SafeBoundary>
          </li>
          {navItems.map((item) => (
            <li key={item.label} className="shrink-0">
              <Link
                href={item.href}
                className="flex items-center gap-1 whitespace-nowrap px-4 font-raleway text-xs font-semibold text-white hover:text-amber md:px-6 md:text-sm"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile drawer — opens from hamburger button. */}
      <SafeBoundary name="header:mobile-menu" fallback={null}>
        <MobileMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </SafeBoundary>
    </header>
  );
}
