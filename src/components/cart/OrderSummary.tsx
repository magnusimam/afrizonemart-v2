'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { DisplayPrice } from '@/components/product/DisplayPrice';

interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  /** Discount applied by an active coupon. */
  couponCode?: string | null;
  couponDiscount?: number;
  couponFreeShipping?: boolean;
}

export function OrderSummary({
  itemCount,
  subtotal,
  couponCode,
  couponDiscount = 0,
  couponFreeShipping = false,
}: OrderSummaryProps) {
  const empty = itemCount === 0;
  // Shipping is finalised on the checkout page (zone+rate picker). Cart
  // page just shows "calculated at checkout" + the discount + total
  // BEFORE shipping so the customer sees what they're saving.
  const totalBeforeShipping = Math.max(0, subtotal - couponDiscount);

  return (
    <aside className="lg:sticky lg:top-4">
      <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-5 shadow-card md:p-6">
        <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
          Order Summary
        </h2>

        <div className="flex flex-col gap-2.5">
          <SummaryRow
            label={`Items (${itemCount})`}
            value={<DisplayPrice amountNgn={subtotal} compact />}
          />
          {couponCode && couponDiscount > 0 ? (
            <SummaryRow
              label={`Coupon (${couponCode})`}
              value={
                <span>
                  −<DisplayPrice amountNgn={couponDiscount} compact />
                </span>
              }
              valueClass="text-success"
            />
          ) : null}
          {couponCode && couponFreeShipping ? (
            <SummaryRow
              label={`Coupon (${couponCode})`}
              value="Free shipping"
              valueClass="text-success"
            />
          ) : null}
          <SummaryRow
            label="Shipping"
            value={couponFreeShipping ? 'Free' : 'Calculated at checkout'}
            valueClass={couponFreeShipping ? 'text-success' : 'text-muted'}
          />
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t-2 border-border pt-4">
          <span className="font-raleway text-base font-bold text-navy md:text-lg">
            {couponDiscount > 0 ? 'Subtotal after discount' : 'Subtotal'}
          </span>
          <DisplayPrice
            amountNgn={totalBeforeShipping}
            className="font-raleway text-2xl font-bold text-navy md:text-3xl"
          />
        </div>

        {empty ? (
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-navy py-3.5 font-raleway text-sm font-bold uppercase tracking-btn text-white opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Checkout
          </button>
        ) : (
          <Link
            href="/checkout/shipping"
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-navy py-3.5 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy"
          >
            Proceed to Checkout
          </Link>
        )}

        <p className="flex items-center justify-center gap-1.5 font-sans text-xs text-muted">
          <Lock size={12} aria-hidden />
          Secure checkout — your details are encrypted
        </p>
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: React.ReactNode;
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
