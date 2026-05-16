'use client';

import { Receipt, TrendingUp } from 'lucide-react';
import { formatPriceNGN } from '@/lib/format';

/**
 * 2026-05-16 — "how many more orders to reach next tier" projection.
 * The single highest-ROI gamification add per Magnus' specific ask.
 *
 * Math: average order value over the rolling window
 *   = rollingSpend / rollingPaidOrders
 * Then: ceil(ngnUntilNextTier / averageOrderValue) more orders.
 *
 * Edge cases:
 *  - 0 orders → fall back to a flat tip ("Place your first order to
 *    start the journey") because we can't project an AOV
 *  - Already at top tier → render a maxed-out variant
 *  - AOV is suspiciously small (≤ ₦100, e.g. a coin-redeemed test
 *    order) → falls back to "any few more orders" copy
 *
 * Visual: two-stat tile in the tier-card. Average order on the
 * left, projection on the right.
 */

interface Props {
  rollingSpend: number;
  rollingPaidOrders: number;
  ngnUntilNextTier: number;
  nextTierLabel: string | null;
}

export function OrdersToNextTier({
  rollingSpend,
  rollingPaidOrders,
  ngnUntilNextTier,
  nextTierLabel,
}: Props) {
  if (rollingPaidOrders === 0) {
    return (
      <Tile
        leftLabel="Avg order"
        leftValue="—"
        rightLabel="Projection"
        rightValue="Place your first order"
      />
    );
  }
  if (!nextTierLabel || ngnUntilNextTier <= 0) {
    return (
      <Tile
        leftLabel="Avg order"
        leftValue={formatPriceNGN(
          Math.round(rollingSpend / rollingPaidOrders),
        )}
        rightLabel="Top tier"
        rightValue="You're maxed 🎉"
      />
    );
  }

  const aov = Math.round(rollingSpend / rollingPaidOrders);
  /// Defensive — if AOV looks too small (coupon-heavy, coin-funded
  /// test orders), don't render a misleading number. The customer
  /// is better served by "a few more orders" copy than a giant
  /// "you need 42 more orders" warning that depresses motivation.
  const aovIsTrustworthy = aov >= 100;
  const ordersToGo = aovIsTrustworthy
    ? Math.max(1, Math.ceil(ngnUntilNextTier / aov))
    : null;

  return (
    <Tile
      leftLabel="Avg order"
      leftValue={formatPriceNGN(aov)}
      rightLabel={`To ${nextTierLabel}`}
      rightValue={
        ordersToGo
          ? `~${ordersToGo} more ${ordersToGo === 1 ? 'order' : 'orders'}`
          : 'A few more orders'
      }
    />
  );
}

function Tile({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    /* 2026-05-16 mobile-first — min-w-0 + truncate on every flex
       child so the value cells don't push the tile wider than the
       container on narrow phones (e.g. "Place your first order"
       label + "~12 more orders" value). */
    <div className="grid grid-cols-2 gap-2 rounded-card bg-white/10 p-3 backdrop-blur md:gap-3 md:p-4">
      <div className="flex min-w-0 items-center gap-2 md:gap-2.5">
        <Receipt size={16} className="shrink-0 text-amber md:hidden" aria-hidden />
        <Receipt size={18} className="hidden shrink-0 text-amber md:block" aria-hidden />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="font-raleway text-[9px] font-bold uppercase tracking-btn opacity-80 md:text-[10px]">
            {leftLabel}
          </span>
          <span className="truncate font-raleway text-xs font-bold md:text-base">
            {leftValue}
          </span>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 md:gap-2.5">
        <TrendingUp size={16} className="shrink-0 text-amber md:hidden" aria-hidden />
        <TrendingUp size={18} className="hidden shrink-0 text-amber md:block" aria-hidden />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="font-raleway text-[9px] font-bold uppercase tracking-btn opacity-80 md:text-[10px]">
            {rightLabel}
          </span>
          <span className="truncate font-raleway text-xs font-bold md:text-base">
            {rightValue}
          </span>
        </div>
      </div>
    </div>
  );
}
