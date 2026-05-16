'use client';

import Link from 'next/link';
import { Hourglass } from 'lucide-react';
import type { ExpiringCoinsDto } from '@/lib/api/loyalty';

/**
 * 2026-05-16 — urgency banner shown when the customer's soonest-
 * expiring coin batch lands inside the next 30 days. Surfaces the
 * exact coin count + date so they can choose to redeem before
 * the daily-expiry-cron sweeps the batch.
 *
 * Renders nothing when `expiring` is null (nothing expiring soon, or
 * the API doesn't carry the field — older build).
 */
interface Props {
  expiring: ExpiringCoinsDto | null | undefined;
  coinValueNgn: number;
}

const RELATIVE_FORMATTER =
  typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    : null;

export function ExpiringCoinsBanner({ expiring, coinValueNgn }: Props) {
  if (!expiring) return null;
  const expiresAt = new Date(expiring.expiresAt);
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const relativeLabel =
    RELATIVE_FORMATTER && daysLeft > 0
      ? RELATIVE_FORMATTER.format(daysLeft, 'day')
      : daysLeft === 0
        ? 'today'
        : `${daysLeft} days`;
  const absoluteLabel = expiresAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const worth = expiring.coins * coinValueNgn;

  return (
    <div className="flex items-start gap-3 rounded-card border-l-4 border-amber bg-amber/10 p-4 text-charcoal">
      <Hourglass size={20} className="mt-0.5 shrink-0 text-amber" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-raleway text-sm font-bold text-navy">
          {expiring.coins} coin{expiring.coins === 1 ? '' : 's'} expire {relativeLabel}
          {' '}({absoluteLabel})
        </p>
        <p className="font-sans text-xs leading-snug">
          That&rsquo;s about{' '}
          <strong>
            ₦{worth.toLocaleString()}
          </strong>{' '}
          of free redeem value. Use them at checkout before they vanish.
        </p>
        <Link
          href="/cart"
          className="mt-1 inline-flex w-fit items-center rounded-btn bg-navy px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
        >
          Use them now
        </Link>
      </div>
    </div>
  );
}
