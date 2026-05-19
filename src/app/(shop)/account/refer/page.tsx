'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Coins,
  Copy,
  Hourglass,
  Share2,
  Users,
} from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { AccountMobileNav } from '@/components/account/AccountMobileNav';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import {
  getReferralSummary,
  type ReferralSummaryDto,
} from '@/lib/api/loyalty';
import { useAuthStore } from '@/stores/authStore';

/**
 * 2026-05-16 Phase 2 — refer-a-friend page.
 *
 * Shows the customer their stable referral code + a one-click share
 * link + counts of pending/scheduled/paid referrals. Copy stays
 * accurate because the cap + percent + hold come from the live
 * config response.
 *
 * Anti-gaming terms are summarised at the bottom in plain English so
 * customers don't feel surprised when:
 *  - the bonus credits 14 days after their friend's first order
 *  - a refunded order voids the referral
 *  - more than 5 successful referrals/month don't pay out until
 *    next month
 */

export default function ReferAFriendPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [data, setData] = useState<ReferralSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getReferralSummary()
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const [first, ...rest] = (user?.name ?? user?.email ?? '').split(' ');
  const lastName = rest.join(' ');

  const shareUrl = data
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${data.code}`
    : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not available */
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Afrizonemart',
          text: 'Shop everything made in Africa — get ₦500 off your first order with my link.',
          url: shareUrl,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    handleCopy();
  };

  return (
    <main className="bg-page pb-12">
      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-col gap-1 md:mb-8">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            My Account
          </p>
          <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            Refer a friend, earn coins
          </h1>
          <p className="font-sans text-sm text-muted md:text-base">
            Share your link. Your friend gets ₦500 off their first order; you
            get coins on their first paid order.
          </p>
        </div>

        <SafeBoundary name="account:mobile-nav" fallback={null}>
          <AccountMobileNav active="/account/refer" />
        </SafeBoundary>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="hidden lg:col-span-3 lg:block">
            <SafeBoundary name="account:sidebar" fallback={null}>
              <AccountSidebar
                active="/account/refer"
                userFirstName={first || 'You'}
                userLastName={lastName}
              />
            </SafeBoundary>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-9">
            {error ? (
              <section className="rounded-card border border-danger bg-danger/5 p-5 font-sans text-sm text-danger">
                {error}
              </section>
            ) : !data ? (
              <section className="rounded-card border border-border bg-white p-6 font-sans text-sm text-muted">
                Loading your referral link…
              </section>
            ) : (
              <>
                {/* Hero — share link card */}
                <section className="overflow-hidden rounded-card bg-gradient-to-br from-navy to-[#1A1A8C] p-6 text-white shadow-card md:p-8">
                  <p className="font-raleway text-xs font-bold uppercase tracking-btn opacity-80">
                    Your share link
                  </p>
                  <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-stretch">
                    <code className="block flex-1 overflow-x-auto rounded-card bg-white/10 px-4 py-3 font-mono text-sm">
                      {shareUrl}
                    </code>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white"
                      >
                        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 rounded-btn border-2 border-amber bg-transparent px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-amber hover:bg-amber hover:text-navy"
                      >
                        <Share2 size={14} aria-hidden />
                        Share
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Stat
                      Icon={Users}
                      label="Total referred"
                      value={data.totalReferred.toString()}
                    />
                    <Stat
                      Icon={Hourglass}
                      label="Pending"
                      value={(data.pending + data.scheduled).toString()}
                    />
                    <Stat
                      Icon={Check}
                      label="Paid out"
                      value={data.paidOut.toString()}
                    />
                    <Stat
                      Icon={Coins}
                      label="Coins earned"
                      value={data.totalCoinsEarned.toString()}
                    />
                  </div>
                </section>

                {/* How it works */}
                <section className="rounded-card border border-border bg-white p-5 md:p-6">
                  <h2 className="mb-3 font-raleway text-lg font-bold text-navy">
                    How it works
                  </h2>
                  <ol className="flex flex-col gap-3 font-sans text-sm text-charcoal">
                    <Step n={1} title="Share your link">
                      Send it via WhatsApp, X, Instagram DM, or email. Anyone
                      who signs up through it is attributed to you.
                    </Step>
                    <Step n={2} title="Your friend gets ₦500 off">
                      Their welcome coupon applies automatically at their
                      first checkout.
                    </Step>
                    <Step n={3} title="They place their first paid order">
                      Coins are only earned when real money moves. Signups
                      alone don&apos;t count.
                    </Step>
                    <Step n={4} title={`You get coins ${data.holdDays} days later`}>
                      We hold the payout for the refund window so refunded
                      orders don&apos;t leak coins. Once it clears, the coins
                      land in your wallet automatically.
                    </Step>
                  </ol>
                </section>

                {/* Terms — anti-gaming */}
                <section className="rounded-card border border-border bg-page p-5 font-sans text-sm text-muted">
                  <p className="font-raleway font-bold text-navy">
                    Fine print
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>
                      · Payout = {data.percentOfFirstOrder}% of your
                      friend&apos;s first paid order, capped at{' '}
                      {data.capPerReferral} coins (cap scales with your tier).
                    </li>
                    <li>
                      · Refunded first orders inside the {data.holdDays}-day
                      hold window void the referral. No payout.
                    </li>
                    <li>
                      · Max 5 paid-out referrals per calendar month. Extras
                      roll over to next month.
                    </li>
                    <li>
                      · One referral per signup; signups with your own email
                      or phone don&apos;t count.
                    </li>
                    <li>
                      · Coins expire {data.holdDays === 14 ? '2 months' : '2 months'} after they land in your wallet — use
                      them at checkout before they vanish.
                    </li>
                  </ul>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({
  Icon,
  label,
  value,
}: {
  Icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card bg-white/10 p-3">
      <Icon size={16} className="text-amber" aria-hidden />
      <p className="mt-2 font-raleway text-[10px] font-bold uppercase tracking-btn opacity-80">
        {label}
      </p>
      <p className="font-raleway text-xl font-bold">{value}</p>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber/20 font-raleway text-xs font-bold text-navy">
        {n}
      </span>
      <span className="flex flex-col leading-snug">
        <span className="font-raleway font-bold text-navy">{title}</span>
        <span className="text-xs text-muted">{children}</span>
      </span>
    </li>
  );
}
