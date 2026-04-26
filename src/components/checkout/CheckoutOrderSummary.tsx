'use client';

import Link from 'next/link';
import { Edit2, Lock, MapPin, Package } from 'lucide-react';
import { formatPriceNGN } from '@/lib/format';
import { DELIVERY_METHODS } from '@/lib/checkout-data';
import { getCountry } from '@/lib/countries';
import { useCheckoutStore } from '@/stores/checkoutStore';
import type { CartItem } from '@/types';

interface Props {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  showShippingRecap?: boolean;
}

export function CheckoutOrderSummary({
  items,
  subtotal,
  itemCount,
  showShippingRecap = false,
}: Props) {
  const shipping = useCheckoutStore((s) => s.shipping);
  const deliveryMethodId = useCheckoutStore((s) => s.deliveryMethod);
  const method = DELIVERY_METHODS.find((m) => m.id === deliveryMethodId);
  const shippingFee = method?.price ?? 0;
  const total = subtotal + shippingFee;

  return (
    <aside className="lg:sticky lg:top-4">
      <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-5 shadow-card md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
            Order Summary
          </h2>
          <Link
            href="/cart"
            className="flex items-center gap-1 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:underline"
          >
            <Edit2 size={12} aria-hidden />
            Edit
          </Link>
        </div>

        {showShippingRecap && shipping ? (
          <div className="flex flex-col gap-3 border-b border-border pb-4">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-navy" aria-hidden />
              <div className="flex-1">
                <p className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
                  Shipping to
                </p>
                <p className="font-sans text-sm leading-snug text-charcoal">
                  {shipping.firstName} {shipping.lastName}
                  <br />
                  {shipping.street}
                  {shipping.apartment ? `, ${shipping.apartment}` : ''}
                  <br />
                  {shipping.city}, {shipping.region}
                  <br />
                  {getCountry(shipping.country)?.flag}{' '}
                  {getCountry(shipping.country)?.name ?? shipping.country}
                </p>
                <Link
                  href="/checkout/shipping"
                  className="mt-1 inline-block font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:underline"
                >
                  Change
                </Link>
              </div>
            </div>
            {method ? (
              <div className="flex items-start gap-2">
                <Package size={16} className="mt-0.5 shrink-0 text-navy" aria-hidden />
                <div>
                  <p className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
                    Delivery
                  </p>
                  <p className="font-sans text-sm leading-snug text-charcoal">
                    {method.label} · {method.eta.split('·')[0]}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between font-raleway text-sm font-bold text-navy">
              <span>{itemCount} item{itemCount === 1 ? '' : 's'}</span>
              <span className="font-raleway text-xs font-semibold text-amber group-open:hidden">
                Show items
              </span>
              <span className="hidden font-raleway text-xs font-semibold text-amber group-open:inline">
                Hide
              </span>
            </summary>
            <ul className="mt-3 flex flex-col gap-2.5">
              {items.map((it) => (
                <li
                  key={it.productId}
                  className="flex items-start justify-between gap-3 font-sans text-xs"
                >
                  <span className="flex-1 leading-snug text-charcoal">
                    <span className="font-medium">{it.name}</span>
                    {it.variant ? (
                      <span className="block text-muted">{it.variant}</span>
                    ) : null}
                    <span className="block text-muted">× {it.quantity}</span>
                  </span>
                  <span className="font-raleway font-bold text-navy">
                    {formatPriceNGN(it.price * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="flex flex-col gap-2.5">
          <Row label="Subtotal" value={formatPriceNGN(subtotal)} />
          <Row
            label={method ? method.label : 'Shipping'}
            value={shippingFee === 0 ? 'Free' : formatPriceNGN(shippingFee)}
            valueClass={shippingFee === 0 ? 'text-success' : ''}
          />
          <Row label="Tax" value={formatPriceNGN(0)} />
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t-2 border-border pt-4">
          <span className="font-raleway text-base font-bold text-navy md:text-lg">
            Total Payable
          </span>
          <span className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            {formatPriceNGN(total)}
          </span>
        </div>

        <p className="flex items-center justify-center gap-1.5 font-sans text-xs text-muted">
          <Lock size={12} aria-hidden />
          Secured by Afrizonemart · 256-bit encryption
        </p>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-sans text-sm text-charcoal">{label}</span>
      <span className={`font-raleway text-sm font-semibold text-navy ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
