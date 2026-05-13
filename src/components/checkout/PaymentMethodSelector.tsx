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
import type { PaymentMethodConfig } from '@/lib/api/payment-methods';
import type { PaymentMethodId } from '@/lib/checkout-data';

/// Tracker #46 — selector now reads from the API-supplied method
/// list (PaymentMethodConfig[]) instead of the local hardcoded
/// PAYMENT_METHODS constant. Caller passes `methods` already
/// filtered to `isActive: true`.

const iconMap: Record<string, LucideIcon> = {
  'credit-card': CreditCard,
  smartphone: Smartphone,
  'building-2': Building2,
  hash: Hash,
  bitcoin: Bitcoin,
  truck: Truck,
};

const codeToId: Record<PaymentMethodConfig['code'], PaymentMethodId> = {
  CARD: 'card',
  MOBILE_MONEY: 'mobile-money',
  BANK_TRANSFER: 'bank-transfer',
  USSD: 'ussd',
  CRYPTO: 'crypto',
  PAY_ON_DELIVERY: 'pay-on-delivery',
};

interface PaymentMethodSelectorProps {
  methods: PaymentMethodConfig[];
  value?: PaymentMethodId;
  onChange: (id: PaymentMethodId) => void;
}

export function PaymentMethodSelector({
  methods,
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  if (methods.length === 0) {
    return (
      <p className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
        No payment methods are active right now. Please check back shortly or
        contact support.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {methods.map((m) => {
        const Icon = iconMap[m.icon] ?? CreditCard;
        const id = codeToId[m.code];
        const selected = id === value;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={selected}
            className={`relative flex items-start gap-3 rounded-card border-2 p-4 text-left transition-all ${
              selected
                ? 'border-navy bg-navy/5 shadow-card'
                : 'border-border bg-white hover:border-navy/40'
            }`}
          >
            {m.isPopular && (
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
