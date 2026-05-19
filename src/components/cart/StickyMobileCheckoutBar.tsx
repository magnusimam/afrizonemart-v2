'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DisplayPrice } from '@/components/product/DisplayPrice';

/**
 * Mobile-only sticky checkout bar for /cart.
 *
 * On desktop the OrderSummary lives in a sticky right column so
 * "Proceed to Checkout" is always visible. On mobile that column
 * stacks below the line items, so a customer reviewing a long cart
 * has to scroll to the bottom every time to checkout. This bar
 * fills that gap with the same pattern used industry-wide
 * (Amazon, Shopify, ASOS).
 *
 * Always visible while items are present — there's no progressive
 * reveal threshold like the PDP bar because cart is already a
 * decision-stage page; you want the CTA in view immediately.
 */
interface StickyMobileCheckoutBarProps {
  itemCount: number;
  totalNgn: number;
  /// True when there's at least one cart item AND we're past
  /// hydration. Empty/un-hydrated states render nothing — no point
  /// reserving 64px at the bottom of an empty cart page.
  show: boolean;
}

export function StickyMobileCheckoutBar({
  itemCount,
  totalNgn,
  show,
}: StickyMobileCheckoutBarProps) {
  if (!show) return null;

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
      role="region"
      aria-label="Checkout summary"
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="flex min-w-0 flex-col">
          <span className="font-raleway text-[10px] font-semibold uppercase tracking-btn text-muted">
            {itemCount} item{itemCount === 1 ? '' : 's'} · subtotal
          </span>
          <DisplayPrice
            amountNgn={totalNgn}
            compact
            className="font-raleway text-lg font-bold leading-tight text-navy"
          />
        </div>

        <Link
          href="/checkout/shipping"
          className="ml-auto inline-flex h-12 items-center justify-center gap-1.5 rounded-btn bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy active:bg-amber/90 active:text-navy"
        >
          Checkout
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
