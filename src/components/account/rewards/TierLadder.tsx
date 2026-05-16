'use client';

import { Check, Lock } from 'lucide-react';
import type { LoyaltyTier } from '@/lib/api/admin';
import type { PublicLoyaltyConfigDto } from '@/lib/api/loyalty';
import { formatPriceNGN } from '@/lib/format';

/**
 * 2026-05-16 — full 5-tier ladder shown above the progress bar on
 * /account/rewards. Past tiers render with a check + amber accent,
 * the current tier glows, future tiers are locked silhouettes.
 *
 * The whole ladder is read-only — clicking a tier doesn't navigate;
 * we surface the next-tier-threshold copy in the progress bar
 * component instead.
 */

interface TierStep {
  tier: LoyaltyTier;
  label: string;
  threshold: number;
}

interface TierLadderProps {
  currentTier: LoyaltyTier;
  config: PublicLoyaltyConfigDto;
}

const TIER_LABELS: Record<LoyaltyTier, string> = {
  BLUE: 'Blue',
  GOLD: 'Gold',
  VIP: 'VIP',
  AMBASSADOR: 'Ambassador',
  DORIME: 'Dorime',
};

export function TierLadder({ currentTier, config }: TierLadderProps) {
  const steps: TierStep[] = [
    { tier: 'BLUE', label: TIER_LABELS.BLUE, threshold: 0 },
    { tier: 'GOLD', label: TIER_LABELS.GOLD, threshold: config.tier2GoldThreshold },
    { tier: 'VIP', label: TIER_LABELS.VIP, threshold: config.tier3VipThreshold },
    {
      tier: 'AMBASSADOR',
      label: TIER_LABELS.AMBASSADOR,
      threshold: config.tier4AmbassadorThreshold,
    },
    { tier: 'DORIME', label: TIER_LABELS.DORIME, threshold: config.tier5DorimeThreshold },
  ];
  const currentIdx = steps.findIndex((s) => s.tier === currentTier);
  /// 2026-05-16 mobile-first — compact NGN ("80k" / "1M") so 5
  /// thresholds across a 320px viewport don't overflow.
  const compactNgn = (n: number): string => {
    if (n === 0) return 'Start';
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
    return `₦${n}`;
  };

  return (
    <div className="relative">
      {/* Connecting rail */}
      <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-white/20 md:top-5" aria-hidden />
      <ol className="relative grid grid-cols-5 gap-1">
        {steps.map((s, i) => {
          const earned = i < currentIdx;
          const current = i === currentIdx;
          const isTopForCurrent = current && i === steps.length - 1;
          return (
            <li key={s.tier} className="flex min-w-0 flex-col items-center text-center">
              <span
                className={[
                  'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all md:h-10 md:w-10',
                  earned ? 'border-amber bg-amber text-navy' : '',
                  current ? 'border-white bg-white text-navy shadow-md ring-4 ring-amber/40' : '',
                  !earned && !current ? 'border-white/30 bg-white/5 text-white/60' : '',
                ].join(' ')}
              >
                {earned ? (
                  <Check size={12} aria-hidden className="md:hidden" />
                ) : current ? (
                  <span className="font-raleway text-[10px] font-bold md:text-xs">{i + 1}</span>
                ) : (
                  <Lock size={10} aria-hidden className="md:hidden" />
                )}
                {earned ? (
                  <Check size={14} aria-hidden className="hidden md:block" />
                ) : !current ? (
                  <Lock size={12} aria-hidden className="hidden md:block" />
                ) : null}
              </span>
              <span
                className={[
                  'mt-1.5 w-full truncate font-raleway text-[9px] font-bold uppercase tracking-btn md:mt-2 md:text-xs',
                  current ? 'text-white' : earned ? 'text-amber' : 'text-white/60',
                ].join(' ')}
              >
                {s.label}
              </span>
              <span
                className={[
                  'w-full truncate font-mono text-[9px] md:text-[10px]',
                  current || earned ? 'text-white/80' : 'text-white/40',
                ].join(' ')}
              >
                {/* Compact on mobile, full NGN on desktop. */}
                <span className="md:hidden">
                  {isTopForCurrent ? 'Top' : compactNgn(s.threshold)}
                </span>
                <span className="hidden md:inline">
                  {s.threshold === 0
                    ? 'Start'
                    : isTopForCurrent
                      ? 'Top'
                      : formatPriceNGN(s.threshold)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
