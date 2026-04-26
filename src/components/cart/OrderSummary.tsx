'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Lock, MapPin, Store, Wallet } from 'lucide-react';
import { formatPriceNGN } from '@/lib/format';
import type { AppliedCoupon } from './CartCouponForm';

const STORE_CREDIT = 2000;
const DELIVERY_FEE = 1500;

interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  appliedCoupon?: AppliedCoupon;
}

export function OrderSummary({ itemCount, subtotal, appliedCoupon }: OrderSummaryProps) {
  const [shippingMode, setShippingMode] = useState<'delivery' | 'pickup'>('delivery');
  const [useCredits, setUseCredits] = useState(false);

  const shipping = shippingMode === 'delivery' ? DELIVERY_FEE : 0;
  const couponDiscount = appliedCoupon
    ? Math.round(subtotal * (appliedCoupon.percent / 100))
    : 0;
  const creditsApplied = useCredits ? Math.min(STORE_CREDIT, subtotal - couponDiscount) : 0;
  const tax = 0;
  const total = Math.max(0, subtotal + shipping - couponDiscount - creditsApplied + tax);

  const empty = itemCount === 0;

  return (
    <aside className="lg:sticky lg:top-4">
      <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-5 shadow-card md:p-6">
        <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
          Order Summary
        </h2>

        <div className="flex flex-col gap-3 border-b border-border pb-4">
          <SummaryRow label={`Items (${itemCount})`} value={formatPriceNGN(subtotal)} />

          <div className="flex flex-col gap-2 pt-1">
            <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
              Delivery
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShippingMode('delivery')}
                aria-pressed={shippingMode === 'delivery'}
                className={`flex flex-col items-start gap-1 rounded-card border-2 p-3 text-left transition-all ${
                  shippingMode === 'delivery'
                    ? 'border-navy bg-navy/5'
                    : 'border-border bg-white hover:border-navy/40'
                }`}
              >
                <span className="flex items-center gap-1.5 font-raleway text-xs font-bold text-navy">
                  <MapPin size={14} aria-hidden />
                  Delivery
                </span>
                <span className="font-sans text-[11px] text-muted">
                  {formatPriceNGN(DELIVERY_FEE)} · 1-3 hrs
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShippingMode('pickup')}
                aria-pressed={shippingMode === 'pickup'}
                className={`flex flex-col items-start gap-1 rounded-card border-2 p-3 text-left transition-all ${
                  shippingMode === 'pickup'
                    ? 'border-navy bg-navy/5'
                    : 'border-border bg-white hover:border-navy/40'
                }`}
              >
                <span className="flex items-center gap-1.5 font-raleway text-xs font-bold text-navy">
                  <Store size={14} aria-hidden />
                  Pickup
                </span>
                <span className="font-sans text-[11px] text-muted">
                  Free · From any store
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SummaryRow label="Subtotal" value={formatPriceNGN(subtotal)} />
          <SummaryRow
            label={shippingMode === 'pickup' ? 'Pickup' : 'Shipping'}
            value={shipping === 0 ? 'Free' : formatPriceNGN(shipping)}
            valueClass={shipping === 0 ? 'text-success' : ''}
          />
          <SummaryRow label="Tax" value={formatPriceNGN(tax)} />
          {appliedCoupon ? (
            <SummaryRow
              label={`Coupon (${appliedCoupon.code})`}
              value={`−${formatPriceNGN(couponDiscount)}`}
              valueClass="text-success"
            />
          ) : null}
          {useCredits ? (
            <SummaryRow
              label="Afrizonemart Credits"
              value={`−${formatPriceNGN(creditsApplied)}`}
              valueClass="text-success"
            />
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-card border border-border bg-page p-3 transition-colors hover:border-navy/40">
          <input
            type="checkbox"
            checked={useCredits}
            onChange={(e) => setUseCredits(e.target.checked)}
            className="h-4 w-4 shrink-0 cursor-pointer accent-navy"
          />
          <Wallet size={18} className="shrink-0 text-navy" aria-hidden />
          <div className="flex flex-1 flex-col">
            <span className="font-raleway text-sm font-semibold text-navy">
              Use Afrizonemart Credits
            </span>
            <span className="font-sans text-xs text-muted">
              You have {formatPriceNGN(STORE_CREDIT)} available
            </span>
          </div>
        </label>

        <div className="flex items-baseline justify-between gap-3 border-t-2 border-border pt-4">
          <span className="font-raleway text-base font-bold text-navy md:text-lg">
            Total Payable
          </span>
          <span className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            {formatPriceNGN(total)}
          </span>
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
