import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { CartBadge } from '@/components/cart/CartBadge';
import { HeaderUserMenu } from '@/components/layout/HeaderUserMenu';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/common/CurrencySwitcher';
import { CategoriesDropdown } from '@/components/layout/CategoriesDropdown';
import { SafeBoundary } from '@/components/common/SafeBoundary';

// Static nav items rendered AFTER the All Categories dropdown.
const navItems = [
  { label: 'Shop By Country', href: '/shop/country/nigeria' },
  { label: 'Special Discounts', href: '/special-discount' },
  { label: '₦1k Store', href: '/shop/1k-store' },
  { label: "Today's Deals", href: '/deals' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Become A Supplier', href: '/suppliers' },
];

export function Header() {
  return (
    <header className="w-full bg-white">
      {/* TOP STRIP — logo on the left, action icons (cart + user) on
          the right. Search drops to its own row on mobile so it
          actually has space; on desktop it sits between logo + actions. */}
      <div className="mx-auto flex max-w-site flex-wrap items-center gap-3 px-3 py-3 md:flex-nowrap md:gap-6 md:px-6 md:py-4 lg:gap-8 lg:px-10 xl:pl-14 xl:pr-12">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="AfriZoneMart.com — Made in Africa, delivered worldwide"
            width={260}
            height={80}
            priority
            className="h-10 w-auto md:h-16 lg:h-[72px]"
          />
        </Link>

        <form
          role="search"
          action="/search"
          method="GET"
          className="order-3 flex w-full max-w-[720px] flex-1 items-stretch overflow-hidden rounded-input border border-border bg-white md:order-2 md:w-auto"
        >
          <input
            type="search"
            name="q"
            placeholder="Search products…"
            aria-label="Search products"
            className="min-w-0 flex-1 px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:outline-none md:px-4 md:py-2.5"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-navy px-3 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark md:px-7 md:text-sm"
            aria-label="Search"
          >
            <Search size={16} aria-hidden />
            <span className="hidden md:inline">Search</span>
          </button>
        </form>

        {/* Currency / language only on desktop — they go in the mobile
            drawer on small screens (drawer pending, see tracker #30). */}
        <div className="order-2 ml-auto hidden items-center gap-2 md:order-3 md:ml-0 md:flex">
          <CurrencySwitcher />
          <LanguageSwitcher />
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3 md:ml-0">
          <CartBadge />
          <HeaderUserMenu />
        </div>
      </div>

      {/* CATEGORY NAV STRIP — horizontally scrollable on mobile.
          Reduced left padding (was 80px, now 12px) so the first item
          isn't buried off-screen on narrow viewports. */}
      <nav className="w-full bg-navy">
        <ul className="mx-auto flex max-w-site items-center divide-x divide-white/30 overflow-x-auto px-3 py-2 md:py-2.5 md:pl-20 md:pr-4">
          <li className="shrink-0">
            <SafeBoundary
              name="header:categories-dropdown"
              fallback={
                <Link
                  href="/shop"
                  className="flex items-center gap-1 px-3 font-raleway text-xs font-semibold text-white hover:text-amber md:px-6 md:text-sm"
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
                className="flex items-center gap-1 whitespace-nowrap px-3 font-raleway text-xs font-semibold text-white hover:text-amber md:px-6 md:text-sm"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
