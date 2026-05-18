'use client';

import { Truck } from 'lucide-react';
import type { PublicGateway } from '@/lib/api/admin';

/// Gateway-first checkout picker (Tracker #50.1, 2026-05-19).
/// Customer chooses a gateway by brand (Squad, Paystack…) — the small
/// caption underneath lists the methods that gateway processes. Pay
/// on Delivery stays as a separate non-gateway card beneath the list
/// because it isn't routed through a third-party processor.
///
/// Bank Transfer used to render as its own non-gateway card too; we
/// dropped it 2026-05-19 (Magnus' call). Customers route to a gateway
/// for online payment OR pick Pay on Delivery. Bank transfer is
/// available inside the Squad-hosted flow as a payment channel, so
/// dropping the dedicated card doesn't take the capability away.
///
/// Backward-compat with the existing selection model: each gateway
/// card maps to PaymentMethodId 'card' (which PAYMENT_METHOD_MAP
/// already routes to GTSQUAD). Multi-gateway customer-choice
/// plumbing (telling the server which gateway to use) is a follow-up
/// — today the server picks the highest-priority active gateway
/// regardless, so visually consolidating the methods doesn't change
/// behaviour.

export type GatewaySelectorChoice =
  | { kind: 'gateway'; gatewayId: string }
  | { kind: 'pay-on-delivery' };

interface Props {
  gateways: PublicGateway[];
  /// Pass true to render the Pay on Delivery card.
  showPayOnDelivery: boolean;
  value?: GatewaySelectorChoice;
  onChange: (choice: GatewaySelectorChoice) => void;
}

export function PaymentGatewaySelector({
  gateways,
  showPayOnDelivery,
  value,
  onChange,
}: Props) {
  if (gateways.length === 0 && !showPayOnDelivery) {
    return (
      <p className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
        No payment options are active right now. Please check back shortly or
        contact support.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {gateways.map((g) => {
        const selected =
          value?.kind === 'gateway' && value.gatewayId === g.id;
        const logoUrl =
          typeof g.metadata?.logoUrl === 'string' ? g.metadata.logoUrl : null;
        const methods = Array.isArray(g.metadata?.supportedMethods)
          ? (g.metadata.supportedMethods as string[])
          : [];
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange({ kind: 'gateway', gatewayId: g.id })}
            aria-pressed={selected}
            className={`relative flex items-start gap-3 rounded-card border-2 p-4 text-left transition-all ${
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

            <div className="flex flex-1 flex-col gap-1.5">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={`${g.label} logo`}
                  className="h-8 max-w-[160px] object-contain"
                />
              ) : (
                <span className="font-raleway text-sm font-bold text-navy md:text-base">
                  Pay with {g.label}
                </span>
              )}
              {methods.length > 0 && (
                <span className="font-sans text-xs leading-snug text-muted">
                  {methods.join(' · ')}
                </span>
              )}
            </div>
          </button>
        );
      })}

      {showPayOnDelivery && (
        <ManualOptionCard
          icon={<Truck size={28} strokeWidth={1.5} aria-hidden />}
          title="Pay on Delivery"
          caption="Cash to the courier when your order arrives."
          selected={value?.kind === 'pay-on-delivery'}
          onClick={() => onChange({ kind: 'pay-on-delivery' })}
        />
      )}
    </div>
  );
}

function ManualOptionCard({
  icon,
  title,
  caption,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex items-start gap-3 rounded-card border-2 p-4 text-left transition-all ${
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
      <span className={`shrink-0 ${selected ? 'text-amber' : 'text-navy'}`}>
        {icon}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span className="font-raleway text-sm font-bold text-navy md:text-base">
          {title}
        </span>
        <span className="font-sans text-xs leading-snug text-muted">
          {caption}
        </span>
      </div>
    </button>
  );
}
