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
  { label: 'Shop By Country', href: '/shop/country/nigeria' },
  { label: 'Special Discounts', href: '/special-discount' },
  { label: '₦1k Store', href: '/shop/1k-store' },
  { label: "Today's Deals", href: '/deals' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Become A Supplier', href: '/suppliers' },
];

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="w-full bg-white">
      {/* MOBILE TOP STRIP — logo + currency pill + hamburger square.
          Hidden on md and up. */}
      <div className="flex items-center justify-between gap-3 px-3 py-3 md:hidden">
        <Link href="/" className="shrink-0">
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
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-navy text-white shadow-card hover:bg-navy/90"
        >
          <Menu size={22} aria-hidden />
        </button>
      </div>

      {/* MOBILE SEARCH ROW — full-width, prominent navy SEARCH button. */}
      <form
        role="search"
        action="/search"
        method="GET"
        className="flex items-stretch gap-0 px-3 pb-3 md:hidden"
      >
        <input
          type="search"
          name="q"
          placeholder="Search for products, brands & categories…"
          aria-label="Search products"
          className="min-w-0 flex-1 rounded-l-input border border-r-0 border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-r-input bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-navy/90"
        >
          <Search size={14} aria-hidden />
          Search
        </button>
      </form>

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
