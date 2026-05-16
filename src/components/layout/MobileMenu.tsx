'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { selectCartTotalQuantity, useCartStore } from '@/stores/cartStore';
import { CurrencySwitcher } from '@/components/common/CurrencySwitcher';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { listCategories, type ApiCategory } from '@/lib/api/categories';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Special Discounts', href: '/special-discount' },
  { label: "Today's Deals", href: '/deals' },
  { label: '₦1k Store', href: '/shop/1k-store' },
  { label: 'Shop By Country', href: '/shop/countries' },
  { label: 'Become A Supplier', href: '/suppliers' },
];

/**
 * Full-height mobile drawer that slides in from the right when the
 * hamburger button is tapped. Houses every nav link, the categories
 * tree, the cart, the account links, and the currency / language
 * switchers — everything desktop has scattered across the header.
 */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.clear);
  const totalQuantity = useCartStore(selectCartTotalQuantity);
  const [categories, setCategories] = useState<ApiCategory[] | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Load categories lazily when the drawer first opens.
  useEffect(() => {
    if (!open || categories !== null) return;
    let cancelled = false;
    listCategories().then((items) => {
      if (!cancelled) setCategories(items);
    });
    return () => {
      cancelled = true;
    };
  }, [open, categories]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col bg-white shadow-card transition-transform duration-300 md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-navy px-4 py-3 text-white">
          <p className="font-raleway text-sm font-bold uppercase tracking-btn">
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* Account block */}
          <div className="border-b border-border px-4 py-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber">
                    <User size={16} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-raleway text-sm font-bold text-navy">
                      Hi, {user.name?.split(' ')[0] ?? 'there'}
                    </p>
                    <Link
                      href="/account"
                      onClick={onClose}
                      className="font-sans text-xs text-amber"
                    >
                      View account →
                    </Link>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-input border border-border px-3 py-1.5 font-sans text-xs text-charcoal hover:bg-page"
                  aria-label="Sign out"
                >
                  <LogOut size={12} aria-hidden />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-navy py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white"
                >
                  <LogIn size={14} aria-hidden />
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center rounded-btn border-2 border-navy py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            onClick={onClose}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 hover:bg-page"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/10 text-navy">
                <ShoppingCart size={16} aria-hidden />
              </span>
              <span className="font-raleway text-sm font-bold text-navy">
                Cart
              </span>
            </span>
            <span className="flex items-center gap-2">
              {totalQuantity > 0 ? (
                <span className="rounded-full bg-amber px-2 py-0.5 font-raleway text-[11px] font-bold text-navy">
                  {totalQuantity}
                </span>
              ) : null}
              <ChevronRight size={16} className="text-muted" aria-hidden />
            </span>
          </Link>

          {/* Categories — collapsible */}
          <div className="border-b border-border">
            <button
              type="button"
              onClick={() => setCategoriesOpen((v) => !v)}
              aria-expanded={categoriesOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 hover:bg-page"
            >
              <span className="font-raleway text-sm font-bold text-navy">
                All Categories
              </span>
              <ChevronDown
                size={16}
                aria-hidden
                className={`text-muted transition-transform ${
                  categoriesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {categoriesOpen ? (
              <ul className="bg-page py-1">
                {categories === null ? (
                  <li className="px-6 py-3 font-sans text-xs text-muted">
                    Loading…
                  </li>
                ) : categories.length === 0 ? (
                  <li className="px-6 py-3 font-sans text-xs text-muted">
                    No categories yet.
                  </li>
                ) : (
                  categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/shop/${c.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between gap-3 px-6 py-2.5 font-sans text-sm text-charcoal hover:text-navy"
                      >
                        <span>{c.name}</span>
                        <span className="font-mono text-[10px] text-muted">
                          {c.productCount}
                        </span>
                      </Link>
                    </li>
                  ))
                )}
                <li>
                  <Link
                    href="/shop"
                    onClick={onClose}
                    className="block px-6 py-2.5 font-sans text-xs font-semibold text-amber"
                  >
                    View all products →
                  </Link>
                </li>
              </ul>
            ) : null}
          </div>

          {/* Other nav links */}
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.label} className="border-b border-border">
                <Link
                  href={l.href}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 px-4 py-4 font-raleway text-sm font-bold text-navy hover:bg-page"
                >
                  {l.label}
                  <ChevronRight size={16} className="text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          {/* Currency + language */}
          <div className="flex items-center gap-3 px-4 py-5">
            <CurrencySwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </aside>
    </>
  );
}
