'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Star, X } from 'lucide-react';
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from '@/lib/countries';
import type { ApiCategory } from '@/lib/api/categories';

/**
 * Storefront filter sidebar — every group writes back to the URL
 * (`?category=&origin=&minPrice=&maxPrice=&minRating=&inStock=&onSale=`)
 * so a) shareable links work, b) reloads preserve state, c) the
 * server component on the page can read the params and forward them
 * straight to `fetchProducts`.
 *
 * The previous version had hardcoded category strings, an inert
 * price range, a decorative rating block, and a "Free Shipping"
 * checkbox with no backend support — all of which were silently
 * lying to the customer. Audited 2026-05-19.
 */

interface FiltersSidebarProps {
  /// Pre-fetched category tree (rendered server-side so there's no
  /// loading flash). Top-level nodes only — subcategory drill-down
  /// lives on the per-category route. Omit (or pass []) when the
  /// route already pins the category and the group should be hidden.
  categories?: ApiCategory[];
  onClose?: () => void;
  /**
   * Whether to render the "Made In (Country of Origin)" filter group.
   * Defaults true on /shop. Country pages (/shop/country/<slug>) pass
   * false — the URL already pins the country and showing the picker
   * there would let visitors uncheck themselves into an empty grid.
   */
  showCountryFilter?: boolean;
  /**
   * Whether to render the Category filter group. Defaults true on
   * /shop. Category pages pass false — the route already pins the
   * category and a second selector would just be confusing.
   */
  showCategoryFilter?: boolean;
}

/// Every filter param the sidebar can write. Used by Clear All to
/// reset only filter-related keys (and leave e.g. `q` from search
/// alone if it's ever combined). `page` is also cleared on every
/// narrowing change so the visitor isn't dropped onto an empty
/// page 7.
const FILTER_PARAM_KEYS = [
  'category',
  'origin',
  'minPrice',
  'maxPrice',
  'minRating',
  'inStock',
  'onSale',
] as const;

const RATING_BUCKETS = [5, 4, 3, 2, 1] as const;

export function FiltersSidebar({
  categories = [],
  onClose,
  showCountryFilter = true,
  showCategoryFilter = true,
}: FiltersSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /// URL-bound state for every group below. useMemo so the
  /// derivations don't recompute on every keystroke of an unrelated
  /// component re-render.
  const selectedCountries = useMemo<Set<CountryCode>>(() => {
    const raw = searchParams.get('origin');
    if (!raw) return new Set();
    const codes = raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is CountryCode => s.length === 2 && s in COUNTRIES);
    return new Set(codes);
  }, [searchParams]);

  const selectedCategory = searchParams.get('category') ?? '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const onSaleOnly = searchParams.get('onSale') === 'true';
  const minRating = (() => {
    const raw = searchParams.get('minRating');
    if (!raw) return 0;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  })();
  const urlMinPrice = searchParams.get('minPrice') ?? '';
  const urlMaxPrice = searchParams.get('maxPrice') ?? '';

  /// Price inputs are debounced — typing "5000" shouldn't fire 4
  /// router replaces. Local state mirrors the URL on mount + when
  /// the URL changes externally (Clear All, browser back).
  const [minPrice, setMinPrice] = useState(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
  useEffect(() => {
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
  }, [urlMinPrice, urlMaxPrice]);

  const writeParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setOrUnset = useCallback(
    (key: string, value: string | null | undefined) => {
      writeParams((p) => {
        if (value === null || value === undefined || value === '') p.delete(key);
        else p.set(key, value);
      });
    },
    [writeParams],
  );

  const toggleCountry = useCallback(
    (code: CountryCode) => {
      const next = new Set(selectedCountries);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setOrUnset('origin', next.size === 0 ? null : Array.from(next).join(','));
    },
    [selectedCountries, setOrUnset],
  );

  const clearAll = useCallback(() => {
    writeParams((p) => {
      for (const key of FILTER_PARAM_KEYS) p.delete(key);
    });
  }, [writeParams]);

  /// Apply the typed min/max bounds. Coerce to int (Naira whole
  /// units, matching the DB column) and swap them if the customer
  /// typed them backwards so we never send `gte=200 lte=100`.
  const applyPriceBounds = useCallback(() => {
    let lo = minPrice.trim() ? Math.max(0, Math.floor(Number(minPrice))) : null;
    let hi = maxPrice.trim() ? Math.max(0, Math.floor(Number(maxPrice))) : null;
    if (lo !== null && !Number.isFinite(lo)) lo = null;
    if (hi !== null && !Number.isFinite(hi)) hi = null;
    if (lo !== null && hi !== null && lo > hi) [lo, hi] = [hi, lo];
    writeParams((p) => {
      if (lo === null) p.delete('minPrice');
      else p.set('minPrice', String(lo));
      if (hi === null) p.delete('maxPrice');
      else p.set('maxPrice', String(hi));
    });
  }, [minPrice, maxPrice, writeParams]);

  /// Rating UI shows checkboxes 5..1 but only one is selected at a
  /// time (it's a "minimum" filter — picking 4 implies 5 is also
  /// allowed). Clicking the active one clears it.
  const setMinRating = useCallback(
    (n: number) => {
      setOrUnset('minRating', n === minRating ? null : String(n));
    },
    [minRating, setOrUnset],
  );

  return (
    <aside className="flex flex-col gap-4 rounded-card border border-border bg-white p-4 shadow-card md:p-5">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="font-raleway text-base font-bold text-navy md:text-lg">
          Filters
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber hover:underline md:text-xs"
          >
            Clear all
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="text-muted lg:hidden"
            >
              <X size={18} aria-hidden />
            </button>
          ) : null}
        </div>
      </header>

      {showCategoryFilter && categories.length > 0 && (
        <FilterGroup title="Category">
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {categories.map((c) => {
              const isOn = selectedCategory === c.slug;
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                    <input
                      type="radio"
                      name="category"
                      checked={isOn}
                      onChange={() => setOrUnset('category', c.slug)}
                      className="h-4 w-4 cursor-pointer accent-navy"
                    />
                    <span className="flex-1">{c.name}</span>
                    <span className="font-raleway text-[10px] font-semibold text-muted">
                      {c.productCount}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {selectedCategory ? (
            <button
              type="button"
              onClick={() => setOrUnset('category', null)}
              className="mt-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber hover:underline"
            >
              Clear category
            </button>
          ) : null}
        </FilterGroup>
      )}

      {showCountryFilter && (
        <FilterGroup title="Made In (Country of Origin)">
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {COUNTRY_CODES.map((c) => {
              const isOn = selectedCountries.has(c);
              return (
                <li key={c}>
                  <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-navy"
                      checked={isOn}
                      onChange={() => toggleCountry(c)}
                    />
                    <span aria-hidden>{COUNTRIES[c].flag}</span>
                    {COUNTRIES[c].name}
                  </label>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}

      <FilterGroup title="Price Range (₦)">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={applyPriceBounds}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyPriceBounds();
                }
              }}
              className="w-full rounded-input border border-border px-2 py-1.5 font-sans text-sm focus:border-navy focus:outline-none"
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={applyPriceBounds}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyPriceBounds();
                }
              }}
              className="w-full rounded-input border border-border px-2 py-1.5 font-sans text-sm focus:border-navy focus:outline-none"
            />
          </div>
          {/* Quick-set shortcut buckets. Each clicks the inputs to a
              preset range and applies immediately. Picking the active
              bucket clears it. */}
          <ul className="flex flex-col gap-1.5">
            {PRICE_BUCKETS.map((b) => {
              const isActive =
                String(b.min ?? '') === urlMinPrice &&
                String(b.max ?? '') === urlMaxPrice;
              return (
                <li key={b.label}>
                  <button
                    type="button"
                    onClick={() => {
                      writeParams((p) => {
                        if (isActive) {
                          p.delete('minPrice');
                          p.delete('maxPrice');
                        } else {
                          if (b.min === null) p.delete('minPrice');
                          else p.set('minPrice', String(b.min));
                          if (b.max === null) p.delete('maxPrice');
                          else p.set('maxPrice', String(b.max));
                        }
                      });
                    }}
                    className={`flex w-full items-center gap-2 rounded-input px-2 py-1 text-left font-sans text-sm ${
                      isActive
                        ? 'bg-navy/5 font-semibold text-navy'
                        : 'text-charcoal hover:bg-page'
                    }`}
                  >
                    <span
                      className={`inline-flex h-3 w-3 items-center justify-center rounded-full border ${
                        isActive ? 'border-navy bg-navy' : 'border-border bg-white'
                      }`}
                      aria-hidden
                    />
                    {b.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </FilterGroup>

      <FilterGroup title="Customer Rating">
        <ul className="flex flex-col gap-2">
          {RATING_BUCKETS.map((n) => {
            const isOn = minRating === n;
            return (
              <li key={n}>
                <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-navy"
                    checked={isOn}
                    onChange={() => setMinRating(n)}
                  />
                  <span className="flex items-center gap-0.5 text-amber">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < n ? 'currentColor' : 'none'}
                        aria-hidden
                      />
                    ))}
                  </span>
                  <span className="text-muted">& up</span>
                </label>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Availability">
        <ul className="flex flex-col gap-2">
          <li>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-navy"
                checked={inStockOnly}
                onChange={(e) => setOrUnset('inStock', e.target.checked ? 'true' : null)}
              />
              In Stock Only
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-navy"
                checked={onSaleOnly}
                onChange={(e) => setOrUnset('onSale', e.target.checked ? 'true' : null)}
              />
              On Sale
            </label>
          </li>
        </ul>
      </FilterGroup>
    </aside>
  );
}

/// Naira-denominated buckets that match the product catalog price
/// distribution. Bounds are inclusive on both ends and align with
/// what the repository will SQL via `gte`/`lte`.
const PRICE_BUCKETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Under ₦1,000', min: null, max: 1000 },
  { label: '₦1,000 – ₦5,000', min: 1000, max: 5000 },
  { label: '₦5,000 – ₦20,000', min: 5000, max: 20000 },
  { label: '₦20,000 – ₦100,000', min: 20000, max: 100000 },
  { label: 'Over ₦100,000', min: 100000, max: null },
];

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer items-center justify-between gap-2 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {title}
      </summary>
      <div className="pb-2 pt-1">{children}</div>
    </details>
  );
}
