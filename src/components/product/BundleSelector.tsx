'use client';

import { Star, Truck } from 'lucide-react';
import { DisplayPrice } from '@/components/product/DisplayPrice';
import type { ProductBundle } from '@/lib/products';

interface BundleSelectorProps {
  bundles: ProductBundle[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /// Origin country code, threaded through to DisplayPrice so the
  /// per-bundle price line uses the same origin-currency as the rest
  /// of the product detail page.
  originCountry?: string | null;
}

export function BundleSelector({ bundles, selectedIndex, onSelect, originCountry }: BundleSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          Bundle &amp; Save
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <div className="flex flex-col gap-2.5">
        {bundles.map((b, i) => {
          const selected = i === selectedIndex;
          return (
            <button
              key={b.label}
              type="button"
              onClick={() => onSelect(i)}
              aria-pressed={selected}
              className={`relative flex items-center gap-3 rounded-card border-2 p-3 text-left transition-all ${
                selected
                  ? 'border-navy bg-navy/5 shadow-card'
                  : 'border-border bg-white hover:border-navy/40'
              }`}
            >
              {b.popular && (
                <span className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-amber px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy shadow-sm">
                  <Star size={10} fill="currentColor" aria-hidden />
                  Most Popular
                </span>
              )}

              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-navy bg-navy' : 'border-border bg-white'
                }`}
                aria-hidden
              >
                {selected && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>

              <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-raleway text-base font-bold text-navy">
                    {b.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-input bg-success/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-success">
                    <Truck size={10} aria-hidden />
                    Free Shipping
                  </span>
                </div>
                {b.savings ? (
                  <span className="font-sans text-xs text-muted">
                    You save {b.savings}%
                  </span>
                ) : (
                  <span className="font-sans text-xs text-muted">Standard price</span>
                )}
              </div>

              <div className="flex flex-col items-end">
                <DisplayPrice
                  amountNgn={b.price}
                  originCountry={originCountry}
                  compact
                  className="font-raleway text-lg font-bold text-navy"
                />
                {b.comparePrice > b.price && (
                  <DisplayPrice
                    amountNgn={b.comparePrice}
                    originCountry={originCountry}
                    compact
                    className="font-sans text-xs text-muted line-through"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
