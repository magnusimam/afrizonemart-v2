'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { fetchShippingRates, type ShippingRate } from '@/lib/api/shipping';
import { formatPriceNGN } from '@/lib/format';

interface Props {
  country: string | null | undefined;
  subtotal: number;
  value: string | undefined;
  onChange: (rateId: string) => void;
}

export function ShippingRatePicker({ country, subtotal, value, onChange }: Props) {
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country || country.length !== 2) {
      setRates(null);
      return;
    }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const r = await fetchShippingRates(country);
        if (cancelled) return;
        setRates(r.rates);
        setZoneName(r.zoneName);
        // Default to the rate flagged as default (or first) if nothing
        // is currently picked, OR if the previous pick isn't in the new
        // list (e.g. country changed).
        const stillValid = r.rates.some((rate) => rate.id === value);
        if (!stillValid) {
          const def = r.rates.find((rate) => rate.isDefault) ?? r.rates[0];
          if (def) onChange(def.id);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load rates');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  if (!country || country.length !== 2) {
    return (
      <p className="rounded-input border border-border bg-page px-3 py-2 font-sans text-xs text-muted">
        Pick a country in the address form to see shipping options.
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">
        {error}
      </p>
    );
  }

  if (rates === null) {
    return <p className="font-sans text-sm text-muted">Loading shipping rates…</p>;
  }

  if (rates.length === 0) {
    return (
      <p className="rounded-input border border-amber/40 bg-amber/10 px-3 py-2 font-sans text-sm text-charcoal">
        No shipping rates configured for this destination yet. We&rsquo;ll reach
        out after you place the order to confirm.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {zoneName && (
        <p className="font-sans text-[11px] text-muted">
          Rates for <span className="font-bold text-charcoal">{zoneName}</span>
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {rates.map((r) => {
          const free =
            r.freeAboveAmount != null && subtotal >= r.freeAboveAmount;
          const effective = free ? 0 : r.priceAmount;
          const selected = value === r.id;
          return (
            <li key={r.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-card border-2 p-3 transition-colors ${
                  selected
                    ? 'border-navy bg-navy/5'
                    : 'border-border bg-white hover:border-navy/40'
                }`}
              >
                <input
                  type="radio"
                  name="shippingRate"
                  value={r.id}
                  checked={selected}
                  onChange={() => onChange(r.id)}
                  className="h-4 w-4 cursor-pointer accent-navy"
                />
                <Truck size={16} className="text-navy" aria-hidden />
                <div className="flex flex-1 flex-col leading-tight">
                  <span className="font-raleway text-sm font-bold text-navy">{r.name}</span>
                  {r.freeAboveAmount != null && !free && (
                    <span className="font-sans text-[11px] text-muted">
                      Free above {formatPriceNGN(r.freeAboveAmount)}
                    </span>
                  )}
                  {free && (
                    <span className="font-sans text-[11px] text-success">
                      Free shipping unlocked at this subtotal
                    </span>
                  )}
                </div>
                <span className="font-raleway text-base font-bold text-navy">
                  {effective === 0 ? 'Free' : formatPriceNGN(effective)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
