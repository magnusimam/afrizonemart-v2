'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Grid3x3, LayoutList, SlidersHorizontal } from 'lucide-react';

interface ShopToolbarProps {
  total: number;
  /// Optional handler from the shop shell — when present we render
  /// the mobile-only "Filters" trigger that opens the drawer. Server
  /// components can't pass click handlers, so the page wraps the
  /// toolbar in a client shell that owns the drawer-open state.
  onOpenFilters?: () => void;
}

/// Storefront sort options. The first 5 mirror the backend `sort`
/// enum exactly (product.schema.ts). `best-selling` was previously
/// in the dropdown but the API doesn't accept it — dropped to stop
/// the toolbar lying about what it can do.
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'featured', label: 'Sort: Featured' },
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'price-asc', label: 'Sort: Price ↑' },
  { value: 'price-desc', label: 'Sort: Price ↓' },
  { value: 'rating', label: 'Sort: Top rated' },
];

export function ShopToolbar({ total, onOpenFilters }: ShopToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') ?? 'featured';

  const setSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'featured') params.delete('sort');
      else params.set('sort', value);
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white p-3 shadow-card md:p-4">
      <p className="font-sans text-sm text-charcoal">
        <span className="font-raleway font-bold text-navy">{total.toLocaleString()}</span> products
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onOpenFilters ? (
          <button
            type="button"
            onClick={onOpenFilters}
            className="flex items-center gap-1.5 rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy lg:hidden"
          >
            <SlidersHorizontal size={14} aria-hidden />
            Filters
          </button>
        ) : null}

        <select
          aria-label="Sort products"
          value={currentSort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-input border border-border bg-white px-3 py-1.5 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="hidden items-center overflow-hidden rounded-input border border-border md:flex">
          <button
            type="button"
            aria-label="Grid view"
            className="flex h-9 w-9 items-center justify-center bg-navy text-white"
          >
            <Grid3x3 size={16} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="List view"
            className="flex h-9 w-9 items-center justify-center text-navy hover:bg-page"
          >
            <LayoutList size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
