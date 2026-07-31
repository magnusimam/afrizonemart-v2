'use client';

import { COUNTRIES, COUNTRY_CODES } from '@/lib/countries';

/**
 * Shared admin toggle-pill country picker over the full canonical
 * 54-country list. Extracted so `sellableCountries` (product form) and
 * `PlacementsEditor`'s per-placement country scope both read from the
 * same source of truth instead of each hand-rolling their own list.
 */

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hint?: string;
}

export function CountryMultiSelect({ value, onChange, label, hint }: Props) {
  const toggle = (code: string) => {
    const next = value.includes(code)
      ? value.filter((c) => c !== code)
      : [...value, code];
    onChange(next);
  };

  return (
    <div>
      {label && (
        <span className="block font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          {label}
        </span>
      )}
      {hint && <p className="mt-0.5 font-sans text-[11px] text-muted">{hint}</p>}
      <div className="mt-1.5 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto rounded-input border border-border bg-page p-2">
        {COUNTRY_CODES.map((code) => {
          const country = COUNTRIES[code];
          const enabled = value.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              title={country.name}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-raleway text-[11px] font-semibold ${
                enabled
                  ? 'border-navy bg-navy text-white'
                  : 'border-border bg-white text-charcoal hover:border-navy'
              }`}
            >
              <span aria-hidden>{country.flag}</span>
              {country.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
