'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Coins, Gift, Hourglass, Sparkles } from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { AccountMobileNav } from '@/components/account/AccountMobileNav';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { getMyLoyalty, type LoyaltyMeResponse } from '@/lib/api/loyalty';
import { useAuthStore } from '@/stores/authStore';
import { formatPriceNGN } from '@/lib/format';
import type { LoyaltyTier, LoyaltyTransactionType } from '@/lib/api/admin';
import { TierLadder } from '@/components/account/rewards/TierLadder';
import { TierProgressBar } from '@/components/account/rewards/TierProgressBar';
import { OrdersToNextTier } from '@/components/account/rewards/OrdersToNextTier';
import { ExpiringCoinsBanner } from '@/components/account/rewards/ExpiringCoinsBanner';
import { AnimatedCoinCounter } from '@/components/account/rewards/AnimatedCoinCounter';
import { PerksLadder } from '@/components/account/rewards/PerksLadder';

const TIER_LABELS: Record<LoyaltyTier, string> = {
  BLUE: 'Continental Blue',
  GOLD: 'Continental Gold',
  VIP: 'Continental VIP',
  AMBASSADOR: 'Continental Ambassador',
  DORIME: 'Continental Dorime',
};

const TIER_TONES: Record<LoyaltyTier, string> = {
  BLUE: 'bg-[#000066] text-white',
  GOLD: 'bg-amber text-navy',
  VIP: 'bg-pink text-white',
  AMBASSADOR: 'bg-success text-white',
  DORIME: 'bg-charcoal text-amber',
};

const TX_LABELS: Record<LoyaltyTransactionType, string> = {
  WELCOME_BONUS: 'Welcome bonus',
  EARN: 'Coins earned',
  REDEEM: 'Coins redeemed',
  REFUND_REVERSAL: 'Refund reversal',
  REDEEM_REFUND: 'Coins returned',
  EXPIRY: 'Coins expired',
  ADMIN_ADJUSTMENT: 'Adjustment',
};

export default function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [data, setData] = useState<LoyaltyMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getMyLoyalty()
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const [first, ...rest] = (user?.name ?? user?.email ?? '').split(' ');
  const lastName = rest.join(' ');

  return (
    <main className="bg-page pb-12">
      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-col gap-1 md:mb-8">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            My Account
          </p>
          <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            Continental Rewards
          </h1>
          <p className="font-sans text-sm text-muted md:text-base">
            Earn Afrizone Coins on every order and redeem them at checkout.
          </p>
        </div>

        <SafeBoundary name="account:mobile-nav" fallback={null}>
          <AccountMobileNav active="/account/rewards" />
        </SafeBoundary>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <SafeBoundary name="account:sidebar" fallback={null}>
              <AccountSidebar
                active="/account/rewards"
                userFirstName={first || 'You'}
                userLastName={lastName}
              />
            </SafeBoundary>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-9 lg:gap-6">
            {loading ? (
              <section className="rounded-card border border-border bg-white p-6 font-sans text-sm text-muted">
                Loading your rewards…
              </section>
            ) : error ? (
              <section className="rounded-card border border-danger bg-danger/5 p-5 font-sans text-sm text-danger">
                {error}
              </section>
            ) : data?.enrolled === false ? (
              <NotEnrolledTeaser config={data.config} />
            ) : data?.enrolled ? (
              <EnrolledView data={data} />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function NotEnrolledTeaser({
  config,
}: {
  config: NonNullable<Extract<LoyaltyMeResponse, { enrolled: false }>['config']>;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-amber bg-gradient-to-br from-amber/10 to-white p-6 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber text-navy">
          <Sparkles size={24} aria-hidden />
        </div>
        <div>
          <h2 className="font-raleway text-xl font-bold text-navy">
            Place your first order to start earning
          </h2>
          <p className="font-sans text-sm text-muted">
            Continental Rewards auto-activates on your first paid order.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Teaser
          Icon={Gift}
          title={`Welcome bonus: ${config.welcomeBonusCoins} coins`}
          body={`Land in your account the moment your first order is paid. That's ${formatPriceNGN(
            config.welcomeBonusCoins * config.coinValueNgn,
          )} of free redeem value.`}
        />
        <Teaser
          Icon={Coins}
          title="Earn on every order"
          body={`Higher tiers earn more — up to 80 coins per order at Continental Dorime. 1 coin = ${formatPriceNGN(
            config.coinValueNgn,
          )} at checkout.`}
        />
        <Teaser
          Icon={Hourglass}
          title={`Use within ${config.coinExpiryMonths} months`}
          body={`Coins are use-it-or-lose-it. Redeem up to ${config.maxOrderRedeemPercent}% of your order with coins.`}
        />
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy md:text-sm"
      >
        Start shopping <ArrowRight size={14} aria-hidden />
      </Link>
    </section>
  );
}

function Teaser({
  Icon,
  title,
  body,
}: {
  Icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card border border-border bg-white p-4">
      <Icon size={20} className="text-amber" aria-hidden />
      <h3 className="mt-2 font-raleway text-sm font-bold text-navy">{title}</h3>
      <p className="mt-1 font-sans text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function EnrolledView({
  data,
}: {
  data: Extract<LoyaltyMeResponse, { enrolled: true }>;
}) {
  const {
    account,
    transactions,
    tierProgress,
    rollingSpend,
    rollingPaidOrders,
    expiring,
    config,
  } = data;
  const tone = TIER_TONES[account.currentTier];
  const coinValueNgn = formatPriceNGN(account.coinBalance * config.coinValueNgn);

  return (
    <>
      {/* 2026-05-16 Phase 1 gamification — expiring coins banner sits
          above the tier card so the urgency catches the eye before
          the celebratory tier copy. Renders nothing when no batch
          is expiring soon. */}
      <SafeBoundary name="rewards:expiring-banner" fallback={null}>
        <ExpiringCoinsBanner expiring={expiring ?? null} coinValueNgn={config.coinValueNgn} />
      </SafeBoundary>

      {/* 2026-05-16 mobile-first — tighter padding on phone (p-5)
          and the value font drops to text-3xl from text-2xl-vs-3xl
          on the headline, so even a 6-digit coin balance fits a
          360px viewport without wrapping. */}
      <section
        className={`overflow-hidden rounded-card p-5 shadow-card md:p-8 ${tone}`}
      >
        <p className="font-raleway text-xs font-bold uppercase tracking-btn opacity-90">
          Current tier
        </p>
        <h2 className="mt-1 font-raleway text-xl font-bold leading-tight md:text-3xl">
          {TIER_LABELS[account.currentTier]}
        </h2>

        <div className="mt-4 grid grid-cols-3 gap-3 md:mt-5 md:gap-4">
          <div>
            <p className="font-raleway text-[9px] font-bold uppercase tracking-btn opacity-80 md:text-xs">
              Coin balance
            </p>
            <p className="mt-0.5 font-raleway text-xl font-bold leading-none md:text-3xl">
              <AnimatedCoinCounter value={account.coinBalance} />
            </p>
          </div>
          <Stat label="Worth" value={coinValueNgn} small />
          <Stat
            label="Lifetime"
            value={account.lifetimeCoinsEarned.toLocaleString()}
            small
          />
        </div>

        {/* 2026-05-16 — full 5-step tier ladder. Replaces nothing —
            adds the journey context the previous bar lacked. */}
        <div className="mt-6">
          <SafeBoundary name="rewards:tier-ladder" fallback={null}>
            <TierLadder currentTier={account.currentTier} config={config} />
          </SafeBoundary>
        </div>

        {/* 2026-05-16 — progress bar with all tier tick marks +
            "you are here" dot. Logarithmic axis so the geometric
            thresholds (₦0 / ₦80k / ₦500k / ₦1M / ₦10M) are
            evenly spaced. */}
        <div className="mt-5">
          <SafeBoundary name="rewards:tier-progress" fallback={null}>
            <TierProgressBar
              currentTier={account.currentTier}
              nextTier={tierProgress.nextTier}
              rollingSpend={rollingSpend}
              ngnUntilNextTier={tierProgress.ngnUntilNextTier}
              config={config}
            />
          </SafeBoundary>
        </div>

        {/* 2026-05-16 — "how many more orders" projection from the
            customer's actual rolling-window AOV. Magnus' specific ask. */}
        <div className="mt-5">
          <SafeBoundary name="rewards:orders-to-next" fallback={null}>
            <OrdersToNextTier
              rollingSpend={rollingSpend}
              rollingPaidOrders={rollingPaidOrders ?? 0}
              ngnUntilNextTier={tierProgress.ngnUntilNextTier}
              nextTierLabel={
                tierProgress.nextTier ? TIER_LABELS[tierProgress.nextTier] : null
              }
            />
          </SafeBoundary>
        </div>
      </section>

      {/* 2026-05-16 Phase 2 — perks ladder. Locked perks rendered
          dimmed (not hidden) so the customer sees what's coming. */}
      <SafeBoundary name="rewards:perks-ladder" fallback={null}>
        <PerksLadder currentTier={account.currentTier} config={config} />
      </SafeBoundary>

      <section className="rounded-card border border-border bg-white p-5 md:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="font-raleway text-lg font-bold text-navy">
            Coin activity
          </h3>
          <span className="font-sans text-xs text-muted">
            Showing last {transactions.length} entries
          </span>
        </header>
        {transactions.length === 0 ? (
          <p className="font-sans text-sm text-muted">
            No coin activity yet. Place an order to start earning.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between py-3 font-sans text-sm"
              >
                <div>
                  <p className="font-medium text-charcoal">
                    {TX_LABELS[tx.type]}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {tx.causeOrderId ? ` · Order ${tx.causeOrderId.slice(-6)}` : ''}
                    {tx.reason ? ` · ${tx.reason}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-raleway font-bold ${
                      tx.delta >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {tx.delta > 0 ? `+${tx.delta}` : tx.delta}
                  </p>
                  <p className="text-xs text-muted">{tx.balanceAfter} after</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-border bg-page p-5 font-sans text-sm text-muted">
        <p className="font-raleway font-bold text-navy">How it works</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>· Earn coins on every paid order. Higher tiers earn more.</li>
          <li>
            · 1 coin = {formatPriceNGN(config.coinValueNgn)} at checkout. Redeem
            up to {config.maxOrderRedeemPercent}% of your order.
          </li>
          <li>· Coins expire {config.coinExpiryMonths} months after earned.</li>
          <li>
            · Tier is based on your spend in the last{' '}
            {config.spendWindowMonths} months.
          </li>
        </ul>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    /* 2026-05-16 mobile-first — min-w-0 + truncate so currency
       strings ("NGN 50,000") don't overflow the narrow grid cell
       on phones. */
    <div className="min-w-0">
      <p className="font-raleway text-[9px] font-bold uppercase tracking-btn opacity-80 md:text-xs">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate font-raleway font-bold ${
          small ? 'text-sm md:text-lg' : 'text-xl md:text-3xl'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
