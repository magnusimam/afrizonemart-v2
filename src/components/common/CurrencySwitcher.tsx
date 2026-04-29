'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useGeo } from '@/components/providers/GeoProvider';

const CURRENCIES = [
  'NGN', 'USD', 'EUR', 'GBP',
  'KES', 'GHS', 'ZAR', 'EGP',
  'XAF', 'XOF', 'UGX', 'TZS',
  'CAD', 'AUD',
];

export function CurrencySwitcher() {
  const { currency, setCurrency, fx } = useGeo();
  const [open, setOpen] = useState(false);

  // Only offer currencies we have rates for, but always include the
  // active one so the dropdown never appears empty/wrong.
  const available = CURRENCIES.filter(
    (c) => c === currency || c === 'NGN' || (fx?.rates?.[c] != null),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-input border border-border px-2 py-1.5 font-sans text-xs text-charcoal hover:bg-page"
        aria-label="Change currency"
      >
        <span className="font-semibold">{currency}</span>
        <ChevronDown size={12} aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-72 w-32 overflow-y-auto rounded-card border border-border bg-white shadow-card">
          {available.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCurrency(c);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left font-sans text-xs hover:bg-page ${
                c === currency ? 'font-bold text-navy' : 'text-charcoal'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
