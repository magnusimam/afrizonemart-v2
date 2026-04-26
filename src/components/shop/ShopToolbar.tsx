'use client';

import { Grid3x3, LayoutList, SlidersHorizontal } from 'lucide-react';

interface ShopToolbarProps {
  total: number;
  onOpenFilters?: () => void;
}

export function ShopToolbar({ total, onOpenFilters }: ShopToolbarProps) {
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
          className="rounded-input border border-border bg-white px-3 py-1.5 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
          defaultValue="featured"
        >
          <option value="featured">Sort: Featured</option>
          <option value="newest">Sort: Newest</option>
          <option value="price-asc">Sort: Price ↑</option>
          <option value="price-desc">Sort: Price ↓</option>
          <option value="rating">Sort: Top rated</option>
          <option value="best-selling">Sort: Best selling</option>
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
