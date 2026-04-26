'use client';

import { Globe2, Package, Store, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DELIVERY_METHODS, type DeliveryMethodId } from '@/lib/checkout-data';
import { formatPriceNGN } from '@/lib/format';

const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  package: Package,
  store: Store,
  globe: Globe2,
};

interface DeliveryMethodSelectorProps {
  value: DeliveryMethodId;
  onChange: (id: DeliveryMethodId) => void;
}

export function DeliveryMethodSelector({ value, onChange }: DeliveryMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {DELIVERY_METHODS.map((m) => {
        const Icon = iconMap[m.icon];
        const selected = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            aria-pressed={selected}
            className={`flex items-start gap-3 rounded-card border-2 p-4 text-left transition-all ${
              selected
                ? 'border-navy bg-navy/5 shadow-card'
                : 'border-border bg-white hover:border-navy/40'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selected ? 'border-navy bg-navy' : 'border-border bg-white'
              }`}
              aria-hidden
            >
              {selected && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>

            <Icon
              size={28}
              strokeWidth={1.5}
              className={`shrink-0 ${selected ? 'text-amber' : 'text-navy'}`}
              aria-hidden
            />

            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-raleway text-sm font-bold text-navy md:text-base">
                  {m.label}
                </span>
                <span className="font-raleway text-base font-bold text-navy">
                  {m.price === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    formatPriceNGN(m.price)
                  )}
                </span>
              </div>
              <p className="font-sans text-xs text-muted">{m.eta}</p>
              <p className="font-sans text-xs leading-snug text-charcoal">
                {m.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
