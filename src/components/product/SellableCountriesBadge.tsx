'use client';

import { useEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { Flag } from '@/components/common/Flag';
import { getCountry } from '@/lib/countries';

/**
 * Shared badge for the product's sellable-country restriction — used
 * on both the shop/shelf card and the PDP. Renders nothing when the
 * product is unrestricted (the default). The revealed list always
 * includes `origin` even if it isn't explicitly in `sellableCountries`,
 * since a product is always sellable at home.
 */

interface Props {
  sellableCountries: string[];
  origin?: string | null;
  /** `card` = compact pill for the product grid; `pdp` = inline row. */
  variant?: 'card' | 'pdp';
  className?: string;
}

function fullList(sellableCountries: string[], origin?: string | null): string[] {
  if (sellableCountries.length === 0) return [];
  const upperOrigin = origin?.toUpperCase();
  if (upperOrigin && !sellableCountries.includes(upperOrigin)) {
    return [...sellableCountries, upperOrigin];
  }
  return sellableCountries;
}

export function SellableCountriesBadge({
  sellableCountries,
  origin,
  variant = 'card',
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const countries = fullList(sellableCountries, origin);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (countries.length === 0) return null;

  const single = countries.length === 1;
  const label = single
    ? `Sold only in ${getCountry(countries[0])?.name ?? countries[0]}`
    : `Available in ${countries.length} regions`;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          variant === 'card'
            ? `absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-input bg-white/95 px-1.5 py-0.5 font-sans text-[11px] font-semibold leading-tight text-charcoal shadow-sm backdrop-blur md:text-[10px] ${className ?? ''}`
            : `inline-flex items-center gap-1.5 rounded-input border border-border bg-page px-3 py-2 font-raleway text-xs font-semibold text-charcoal hover:border-navy ${className ?? ''}`
        }
      >
        <Globe2 size={variant === 'card' ? 11 : 14} strokeWidth={2.5} aria-hidden />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sellable-countries-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-card bg-white p-6 shadow-card-hover"
          >
            <h2 id="sellable-countries-title" className="font-raleway text-lg font-bold text-navy">
              {single ? 'Sold only in' : `Available in ${countries.length} countries`}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {countries.map((code) => {
                const country = getCountry(code);
                return (
                  <li key={code}>
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-page px-3 py-1.5 font-raleway text-xs font-semibold text-navy">
                      <Flag code={code} size="sm" title={country?.name} />
                      {country?.name ?? code}
                    </span>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
