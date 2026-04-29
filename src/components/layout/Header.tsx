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
      <div className="mx-auto flex max-w-site items-center gap-6 px-3 py-4 md:gap-8 md:px-6 lg:px-10 xl:pl-14 xl:pr-12">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="AfriZoneMart.com — Made in Africa, delivered worldwide"
            width={260}
            height={80}
            priority
            className="h-14 w-auto md:h-16 lg:h-[72px]"
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

        <div className="hidden items-center gap-2 md:flex">
          <CurrencySwitcher />
          <LanguageSwitcher />
        </div>

        <CartBadge />

        <HeaderUserMenu />
      </div>

      <nav className="w-full bg-navy">
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
                className="flex items-center gap-1 px-4 font-raleway text-xs font-semibold text-white hover:text-amber md:px-6 md:text-sm"
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
