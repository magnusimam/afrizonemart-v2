'use client';

import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Gift,
  Lock,
  Mountain,
  ShieldCheck,
  Shirt,
  Sparkles,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { LoyaltyTier } from '@/lib/api/admin';
import type { PublicLoyaltyConfigDto } from '@/lib/api/loyalty';
import { formatPriceNGN } from '@/lib/format';

/**
 * 2026-05-16 Phase 2 — full 5-tier perks ladder shown below the
 * tier card on /account/rewards. Each tier renders as a collapsible
 * card listing the perks unlocked at that level. Earned tiers show
 * green checks, current tier glows + expands by default, locked
 * tiers show 🔒 silhouettes with dimmed copy so the customer can
 * still see what's coming.
 *
 * Magnus' explicit rule: locked perks are shown DIMMED, not hidden,
 * so the customer can see the journey ahead. The protection-from-
 * downgrade note ("Tier protected — never auto-downgraded") sits
 * at the bottom of VIP+ cards.
 */

interface PerksLadderProps {
  currentTier: LoyaltyTier;
  config: PublicLoyaltyConfigDto;
}

interface Perk {
  Icon: LucideIcon;
  text: (cfg: PublicLoyaltyConfigDto) => string;
}

interface TierDef {
  tier: LoyaltyTier;
  label: string;
  threshold: number;
  newPerks: Perk[];
  /// True for tiers Magnus protects from auto-downgrade (VIP, Ambassador, Dorime).
  protected: boolean;
}

const TIER_RANK: Record<LoyaltyTier, number> = {
  BLUE: 0,
  GOLD: 1,
  VIP: 2,
  AMBASSADOR: 3,
  DORIME: 4,
};

function tierDefinitions(cfg: PublicLoyaltyConfigDto): TierDef[] {
  return [
    {
      tier: 'BLUE',
      label: 'Continental Blue',
      threshold: 0,
      protected: false,
      newPerks: [
        {
          Icon: Coins,
          text: () => 'Earn 5 coins per paid order',
        },
        {
          Icon: Gift,
          text: (c) => `Welcome bonus: ${c.welcomeBonusCoins} coins (₦${(c.welcomeBonusCoins * c.coinValueNgn).toLocaleString()} value)`,
        },
        {
          Icon: Truck,
          text: () => 'Free shipping above ₦10,000',
        },
        {
          Icon: Users,
          text: (c) =>
            `Refer-a-friend: up to ${c.referralCapBlue ?? 50} coins per friend`,
        },
      ],
    },
    {
      tier: 'GOLD',
      label: 'Continental Gold',
      threshold: cfg.tier2GoldThreshold,
      protected: false,
      newPerks: [
        { Icon: Coins, text: () => 'Earn 10 coins per paid order' },
        {
          Icon: Sparkles,
          text: (c) => `Birthday-month bonus: ${c.birthdayBonusGold ?? 50} coins`,
        },
        {
          Icon: Users,
          text: (c) =>
            `Refer-a-friend: up to ${c.referralCapGold ?? 100} coins per friend`,
        },
      ],
    },
    {
      tier: 'VIP',
      label: 'Continental VIP',
      threshold: cfg.tier3VipThreshold,
      protected: true,
      newPerks: [
        { Icon: Coins, text: () => 'Earn 20 coins per paid order' },
        { Icon: Truck, text: () => 'Free shipping — no minimum' },
        {
          Icon: Zap,
          text: () => '2× coin Saturdays (every weekend doubles earn)',
        },
        {
          Icon: Sparkles,
          text: () => 'Early access to new arrivals (24h before everyone)',
        },
        {
          Icon: Gift,
          text: (c) => `Birthday-month bonus: ${c.birthdayBonusVip ?? 100} coins`,
        },
        {
          Icon: Users,
          text: (c) =>
            `Refer-a-friend: up to ${c.referralCapVip ?? 200} coins per friend`,
        },
      ],
    },
    {
      tier: 'AMBASSADOR',
      label: 'Continental Ambassador',
      threshold: cfg.tier4AmbassadorThreshold,
      protected: true,
      newPerks: [
        { Icon: Coins, text: () => 'Earn 40 coins per paid order' },
        { Icon: Shirt, text: () => 'Exclusive Ambassador product collection' },
        { Icon: ShieldCheck, text: () => 'Priority customer support' },
        { Icon: Truck, text: () => 'Custom delivery time slot' },
        {
          Icon: Gift,
          text: (c) =>
            `Birthday-month bonus: ${c.birthdayBonusAmbassador ?? 200} coins`,
        },
        {
          Icon: Users,
          text: (c) =>
            `Refer-a-friend: up to ${c.referralCapAmbassador ?? 300} coins per friend`,
        },
      ],
    },
    {
      tier: 'DORIME',
      label: 'Continental Dorime',
      threshold: cfg.tier5DorimeThreshold,
      protected: true,
      newPerks: [
        { Icon: Coins, text: () => 'Earn 80 coins per paid order' },
        { Icon: Gift, text: () => 'Annual curated African gift box' },
        {
          Icon: Mountain,
          text: () => 'Quarterly virtual event with the founders',
        },
        {
          Icon: Sparkles,
          text: (c) => `Birthday-month bonus: ${c.birthdayBonusDorime ?? 500} coins`,
        },
        {
          Icon: Users,
          text: (c) =>
            `Refer-a-friend: up to ${c.referralCapDorime ?? 500} coins per friend`,
        },
      ],
    },
  ];
}

export function PerksLadder({ currentTier, config }: PerksLadderProps) {
  const tiers = tierDefinitions(config);
  const currentIdx = TIER_RANK[currentTier];
  return (
    <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
      <header className="mb-4">
        <h3 className="font-raleway text-lg font-bold text-navy">
          Perks Ladder
        </h3>
        <p className="font-sans text-xs text-muted">
          Every tier unlocks more. Once you reach VIP, your tier sticks — no
          auto-downgrades, ever.
        </p>
      </header>
      <ol className="flex flex-col gap-3">
        {tiers.map((t) => {
          const rank = TIER_RANK[t.tier];
          const earned = rank < currentIdx;
          const current = rank === currentIdx;
          const locked = rank > currentIdx;
          return (
            <TierCard
              key={t.tier}
              t={t}
              cfg={config}
              state={current ? 'current' : earned ? 'earned' : 'locked'}
              initiallyOpen={current}
              locked={locked}
            />
          );
        })}
      </ol>
    </section>
  );
}

function TierCard({
  t,
  cfg,
  state,
  initiallyOpen,
  locked,
}: {
  t: TierDef;
  cfg: PublicLoyaltyConfigDto;
  state: 'earned' | 'current' | 'locked';
  initiallyOpen: boolean;
  locked: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  const badgeChip = (() => {
    if (state === 'current')
      return {
        text: "You're here",
        classes: 'border-amber bg-amber/20 text-navy',
      };
    if (state === 'earned')
      return {
        text: 'Earned',
        classes: 'border-success/30 bg-success/10 text-success',
      };
    return {
      text: t.threshold > 0 ? `${formatPriceNGN(t.threshold)} spent` : '',
      classes: 'border-border bg-page text-muted',
    };
  })();

  return (
    <li
      className={[
        'overflow-hidden rounded-card border-2 transition-all',
        state === 'current'
          ? 'border-amber bg-amber/5 shadow-md'
          : state === 'earned'
            ? 'border-success/30 bg-success/5'
            : 'border-border bg-page',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span
            className={[
              'flex h-9 w-9 items-center justify-center rounded-full border-2',
              state === 'earned' && 'border-success bg-success text-white',
              state === 'current' && 'border-amber bg-amber text-navy',
              state === 'locked' && 'border-border bg-white text-muted',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {state === 'earned' ? (
              <Check size={16} aria-hidden />
            ) : state === 'locked' ? (
              <Lock size={14} aria-hidden />
            ) : (
              <Sparkles size={14} aria-hidden />
            )}
          </span>
          <span className="flex flex-col leading-tight">
            <span
              className={[
                'font-raleway text-sm font-bold',
                locked ? 'text-muted' : 'text-navy',
              ].join(' ')}
            >
              {t.label}
            </span>
            {badgeChip.text ? (
              <span
                className={`mt-1 w-fit rounded-full border px-2 py-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn ${badgeChip.classes}`}
              >
                {badgeChip.text}
              </span>
            ) : null}
          </span>
        </span>
        {open ? (
          <ChevronUp size={18} className="text-muted" aria-hidden />
        ) : (
          <ChevronDown size={18} className="text-muted" aria-hidden />
        )}
      </button>
      {open ? (
        <ul
          className={[
            'flex flex-col gap-2 border-t px-4 pb-4 pt-3',
            state === 'current' && 'border-amber/30',
            state === 'earned' && 'border-success/20',
            state === 'locked' && 'border-border',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {t.newPerks.map((p, i) => {
            const I = p.Icon;
            return (
              <li
                key={i}
                className={[
                  'flex items-start gap-2.5 font-sans text-sm',
                  locked ? 'text-muted/80' : 'text-charcoal',
                ].join(' ')}
              >
                <span
                  className={[
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    locked ? 'bg-muted/15 text-muted' : 'bg-amber/15 text-navy',
                  ].join(' ')}
                >
                  {locked ? (
                    <Lock size={11} aria-hidden />
                  ) : (
                    <I size={12} aria-hidden />
                  )}
                </span>
                <span>{p.text(cfg)}</span>
              </li>
            );
          })}
          {t.tier !== 'BLUE' ? (
            <li className="mt-1 font-sans text-[11px] italic text-muted">
              + everything from {label_below(t.tier)}
            </li>
          ) : null}
          {t.protected ? (
            <li className="mt-1 flex items-center gap-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              <ShieldCheck size={12} aria-hidden />
              Tier protected — never auto-downgraded
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

function label_below(tier: LoyaltyTier): string {
  switch (tier) {
    case 'GOLD': return 'Blue';
    case 'VIP': return 'Gold';
    case 'AMBASSADOR': return 'VIP';
    case 'DORIME': return 'Ambassador';
    default: return '';
  }
}
