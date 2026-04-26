'use client';

import {
  Bitcoin,
  Building2,
  CreditCard,
  Hash,
  Smartphone,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PAYMENT_METHODS, type PaymentMethodId } from '@/lib/checkout-data';

const iconMap: Record<string, LucideIcon> = {
  'credit-card': CreditCard,
  smartphone: Smartphone,
  'building-2': Building2,
  hash: Hash,
  bitcoin: Bitcoin,
  truck: Truck,
};

interface PaymentMethodSelectorProps {
  value?: PaymentMethodId;
  onChange: (id: PaymentMethodId) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PAYMENT_METHODS.map((m) => {
        const Icon = iconMap[m.icon];
        const selected = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            aria-pressed={selected}
            className={`relative flex items-start gap-3 rounded-card border-2 p-4 text-left transition-all ${
              selected
                ? 'border-navy bg-navy/5 shadow-card'
                : 'border-border bg-white hover:border-navy/40'
            }`}
          >
            {m.popular && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-amber px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy shadow-sm">
                Popular
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

            <Icon
              size={28}
              strokeWidth={1.5}
              className={`shrink-0 ${selected ? 'text-amber' : 'text-navy'}`}
              aria-hidden
            />

            <div className="flex flex-1 flex-col gap-1">
              <span className="font-raleway text-sm font-bold text-navy md:text-base">
                {m.label}
              </span>
              <span className="font-sans text-xs leading-snug text-muted">
                {m.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
