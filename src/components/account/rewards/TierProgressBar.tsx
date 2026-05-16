'use client';

import type { LoyaltyTier } from '@/lib/api/admin';
import type { PublicLoyaltyConfigDto } from '@/lib/api/loyalty';
import { formatPriceNGN } from '@/lib/format';

/**
 * 2026-05-16 — single horizontal track showing every tier threshold
 * on one axis, with the customer's rolling-window spend marked. The
 * "you are here" dot sits at the customer's exact position; vertical
 * tick marks delineate each tier boundary.
 *
 * Replaces the old progress-relative-to-next-tier bar that gave no
 * sense of the full mountain.
 *
 * Logarithmic projection on the X axis because the tiers are
 * geometric (₦0 → ₦80k → ₦500k → ₦1M → ₦10M). A linear bar would
 * smush the first four tiers into the left 10% of the bar; log keeps
 * the spacing visually balanced.
 */

const TIER_LABELS: Record<LoyaltyTier, string> = {
  BLUE: 'Blue',
  GOLD: 'Gold',
  VIP: 'VIP',
  AMBASSADOR: 'Ambassador',
  DORIME: 'Dorime',
};

interface Props {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  rollingSpend: number;
  ngnUntilNextTier: number;
  config: PublicLoyaltyConfigDto;
}

export function TierProgressBar({
  nextTier,
  rollingSpend,
  ngnUntilNextTier,
  config,
}: Props) {
  const thresholds = [
    0,
    config.tier2GoldThreshold,
    config.tier3VipThreshold,
    config.tier4AmbassadorThreshold,
    config.tier5DorimeThreshold,
  ];
  const max = thresholds[thresholds.length - 1];
  // Logarithmic scale — `Math.log1p` so 0 stays 0.
  const logMax = Math.log1p(max);
  const toPercent = (n: number): number => {
    if (n <= 0) return 0;
    if (n >= max) return 100;
    return (Math.log1p(n) / logMax) * 100;
  };

  const dotPercent = toPercent(rollingSpend);
  const fillPercent = dotPercent;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-3 w-full rounded-full bg-white/15">
        {/* Filled portion */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-amber transition-all duration-500"
          style={{ width: `${fillPercent}%` }}
        />
        {/* Tier tick marks */}
        {thresholds.slice(1).map((t) => (
          <span
            key={t}
            className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-white/40"
            style={{ left: `${toPercent(t)}%` }}
            aria-hidden
          />
        ))}
        {/* "You are here" dot */}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-navy shadow-md transition-all duration-500"
          style={{ left: `${dotPercent}%` }}
          aria-label={`Your spend: ${formatPriceNGN(rollingSpend)}`}
        />
      </div>
      {/* 2026-05-16 mobile-first — labels wrap vertically below ~480px
          so the "₦80,000 spent" + "₦40,000 to Gold" copy doesn't
          collide and either gets ellipsised or shoves the layout
          wider than the viewport. */}
      <div className="flex flex-col gap-0.5 font-sans text-xs sm:flex-row sm:items-baseline sm:justify-between">
        <span className="opacity-90">
          <strong>{formatPriceNGN(rollingSpend)}</strong> spent in the last{' '}
          {config.spendWindowMonths} months
        </span>
        {nextTier ? (
          <span className="opacity-80">
            {formatPriceNGN(ngnUntilNextTier)} to {TIER_LABELS[nextTier]}
          </span>
        ) : (
          <span className="opacity-80">Top tier reached 🎉</span>
        )}
      </div>
    </div>
  );
}
