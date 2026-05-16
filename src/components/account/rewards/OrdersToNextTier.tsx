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
    <div className="grid grid-cols-2 gap-3 rounded-card bg-white/10 p-3 backdrop-blur md:p-4">
      <div className="flex items-center gap-2.5">
        <Receipt size={18} className="text-amber" aria-hidden />
        <div className="flex flex-col leading-tight">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn opacity-80">
            {leftLabel}
          </span>
          <span className="font-raleway text-sm font-bold md:text-base">
            {leftValue}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <TrendingUp size={18} className="text-amber" aria-hidden />
        <div className="flex flex-col leading-tight">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn opacity-80">
            {rightLabel}
          </span>
          <span className="font-raleway text-sm font-bold md:text-base">
            {rightValue}
          </span>
        </div>
      </div>
    </div>
  );
}
