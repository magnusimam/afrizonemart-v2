'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Star, X } from 'lucide-react';
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from '@/lib/countries';

const categories = [
  'For Her', 'For Him', 'Beer, Wines & Spirit', 'Interior Decor',
  'Groceries, Food & Beverages', 'Art & Collectibles', 'Beauty & Personal Care',
  'Automobile', 'Electronics', 'Books', 'Phone Accessories', 'Home Essentials',
];

interface FiltersSidebarProps {
  onClose?: () => void;
  /**
   * Whether to render the "Made In (Country of Origin)" filter group.
   * Defaults true on /shop. Country pages (/shop/country/<slug>) pass
   * false — the URL already pins the country and showing the picker
   * there would let visitors uncheck themselves into an empty grid.
   */
  showCountryFilter?: boolean;
}

export function FiltersSidebar({ onClose, showCountryFilter = true }: FiltersSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active country selection comes from the URL — single source of
  // truth, survives reloads + share-this-page links. `?origin=NG,KE`.
  const selectedCountries = useMemo<Set<CountryCode>>(() => {
    const raw = searchParams.get('origin');
    if (!raw) return new Set();
    const codes = raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is CountryCode => s.length === 2 && s in COUNTRIES);
    return new Set(codes);
  }, [searchParams]);

  const toggleCountry = useCallback(
    (code: CountryCode) => {
      const next = new Set(selectedCountries);
      if (next.has(code)) next.delete(code);
      else next.add(code);

      const params = new URLSearchParams(searchParams.toString());
      if (next.size === 0) params.delete('origin');
      else params.set('origin', Array.from(next).join(','));
      // Reset pagination — a narrower filter shouldn't drop the
      // visitor onto an empty page 7.
      params.delete('page');

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [selectedCountries, searchParams, router, pathname],
  );

  const clearCountries = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('origin');
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  return (
    <aside className="flex flex-col gap-4 rounded-card border border-border bg-white p-4 shadow-card md:p-5">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="font-raleway text-base font-bold text-navy md:text-lg">
          Filters
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCountries}
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

      <FilterGroup title="Category">
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li key={c}>
              <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                <input type="checkbox" className="h-4 w-4 cursor-pointer accent-navy" />
                {c}
              </label>
            </li>
          ))}
        </ul>
      </FilterGroup>

      {showCountryFilter && (
        <FilterGroup title="Made In (Country of Origin)">
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
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

      <FilterGroup title="Price Range">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-full rounded-input border border-border px-2 py-1.5 font-sans text-sm focus:border-navy focus:outline-none"
            />
            <input
              type="number"
              placeholder="Max"
              className="w-full rounded-input border border-border px-2 py-1.5 font-sans text-sm focus:border-navy focus:outline-none"
            />
          </div>
          <input
            type="range"
            min={0}
            max={500000}
            defaultValue={50000}
            className="w-full accent-navy"
          />
          <ul className="flex flex-col gap-1.5">
            {['Under NGN1,000', 'NGN1,000 - NGN5,000', 'NGN5,000 - NGN20,000', 'NGN20,000 - NGN100,000', 'Over NGN100,000'].map((r) => (
              <li key={r}>
                <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                  <input type="radio" name="price" className="h-4 w-4 cursor-pointer accent-navy" />
                  {r}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </FilterGroup>

      <FilterGroup title="Customer Rating">
        <ul className="flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <li key={n}>
              <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                <input type="checkbox" className="h-4 w-4 cursor-pointer accent-navy" />
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
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Availability">
        <ul className="flex flex-col gap-2">
          <li>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
              <input type="checkbox" defaultChecked className="h-4 w-4 cursor-pointer accent-navy" />
              In Stock Only
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
              <input type="checkbox" className="h-4 w-4 cursor-pointer accent-navy" />
              On Sale
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
              <input type="checkbox" className="h-4 w-4 cursor-pointer accent-navy" />
              Free Shipping
            </label>
          </li>
        </ul>
      </FilterGroup>

      <button
        type="button"
        className="mt-2 rounded-btn bg-navy py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
      >
        Apply Filters
      </button>
    </aside>
  );
}

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
