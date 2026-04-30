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

/** Currency code → ISO-2 country code for the flag pip. EUR / XAF /
 *  XOF are multi-country — pick a representative member. */
const CURRENCY_FLAG: Record<string, string> = {
  NGN: 'ng', USD: 'us', EUR: 'eu', GBP: 'gb',
  KES: 'ke', GHS: 'gh', ZAR: 'za', EGP: 'eg',
  XAF: 'cm', XOF: 'sn', UGX: 'ug', TZS: 'tz',
  CAD: 'ca', AUD: 'au',
};

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
        className="flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1.5 font-sans text-xs text-charcoal hover:bg-page"
        aria-label="Change currency"
      >
        <CurrencyFlag code={currency} />
        <span className="font-semibold">{currency}</span>
        <ChevronDown size={12} aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-72 w-36 overflow-y-auto rounded-card border border-border bg-white shadow-card">
          {available.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCurrency(c);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-xs hover:bg-page ${
                c === currency ? 'font-bold text-navy' : 'text-charcoal'
              }`}
            >
              <CurrencyFlag code={c} />
              {c}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CurrencyFlag({ code }: { code: string }) {
  const iso = CURRENCY_FLAG[code];
  if (!iso) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt=""
      className="h-3.5 w-5 rounded-sm object-cover"
      aria-hidden
    />
  );
}
