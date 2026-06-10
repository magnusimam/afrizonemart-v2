'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Gift,
  Globe2,
  Heart,
  PartyPopper,
  Sparkles,
  Sprout,
  Star,
  Trophy,
} from 'lucide-react';
import type { WrappedStatsV1 } from '@/lib/api/wrap';

/**
 * 9-card Stories-style deck visualisation. Shared between
 * /admin/wrap (single preview) and /admin/wrap/demo (live demo
 * with persona toggles). NOT the production customer-facing
 * renderer — that's PR 4/5 in WRAP_TRACKER.md with proper
 * Satori share images and animation. This is the data-shape
 * preview that lets ops + design confirm content + framing
 * before pixel polish.
 *
 * Card dimensions kept at 9:16 so what we see here matches the
 * Instagram-Story aspect of the real deck.
 */

interface Props {
  stats: WrappedStatsV1;
  /// Optional name to personalise card 1 ("You are a CONNECTOR")
  /// → ("Magnus, you are a CONNECTOR"). Demo defaults to blank.
  customerName?: string | null;
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const TIER_COLOR: Record<WrappedStatsV1['loyalty']['finalTier'], string> = {
  BLUE: '#3D72D6',
  SILVER: '#9DA3AE',
  GOLD: '#FBAC34',
  PLATINUM: '#E8E6E0',
};

const PERSONALITY_TAGLINE: Record<WrappedStatsV1['personality'], string> = {
  CONNECTOR: 'Bridge between borders.',
  PATRIOT: 'Loyal to your roots.',
  EXPLORER: 'Made the continent your catalog.',
  CURATOR: 'A small, specific catalog of love.',
};

export function WrapDeck({ stats, customerName }: Props) {
  const [index, setIndex] = useState(0);
  const cards = buildCards(stats, customerName);

  /// Reset to card 1 if the underlying stats blob changes — happens
  /// in the demo every time the persona toggle is flipped.
  useEffect(() => {
    setIndex(0);
  }, [stats]);

  const card = cards[index];
  const go = (dir: -1 | 1) =>
    setIndex((i) => Math.min(cards.length - 1, Math.max(0, i + dir)));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Card frame — 9:16 vertical to match Story format. */}
        <div
          className="relative flex w-[320px] flex-col overflow-hidden rounded-3xl shadow-2xl"
          style={{
            aspectRatio: '9 / 16',
            background: card.background,
            color: card.foreground,
          }}
        >
          {/* Top progress bar — one segment per card, fills up to index. */}
          <div className="flex gap-1 px-4 pt-3">
            {cards.map((_, i) => (
              <span
                key={i}
                className="h-0.5 flex-1 rounded-full"
                style={{
                  background:
                    i <= index ? card.foreground : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
            {card.body}
          </div>

          <div className="flex items-center justify-between px-4 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
            <span>AFRIZONEMART WRAP</span>
            <span>
              {index + 1} / {cards.length}
            </span>
          </div>
        </div>

        {/* Left / right tap zones */}
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous card"
          className="absolute -left-12 top-1/2 -translate-y-1/2 rounded-full border border-border bg-white p-2 shadow disabled:opacity-30"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === cards.length - 1}
          aria-label="Next card"
          className="absolute -right-12 top-1/2 -translate-y-1/2 rounded-full border border-border bg-white p-2 shadow disabled:opacity-30"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      <p className="font-sans text-xs text-muted">
        {card.title}
      </p>
    </div>
  );
}

interface CardDef {
  title: string;
  background: string;
  foreground: string;
  body: React.ReactNode;
}

function buildCards(
  stats: WrappedStatsV1,
  customerName?: string | null,
): CardDef[] {
  const cards: CardDef[] = [];
  const firstName = customerName?.split(' ')[0]?.trim() || null;

  // ── Card 1 — Personality ────────────────────────────────────────
  cards.push({
    title: '1 of 9 — Personality',
    background:
      'linear-gradient(160deg, #000066 0%, #1A1A8A 60%, #2D2DAA 100%)',
    foreground: '#FFFFFF',
    body: (
      <div className="flex flex-col items-center gap-4">
        <Sparkles size={28} className="text-amber" aria-hidden />
        <p className="font-raleway text-xs uppercase tracking-[0.3em] opacity-80">
          {firstName ? `${firstName}, you are a` : 'You are a'}
        </p>
        <p className="font-raleway text-4xl font-extrabold tracking-tight">
          {stats.personality}
        </p>
        <p className="max-w-[14rem] font-sans text-sm leading-snug opacity-90">
          {stats.personalityReason}
        </p>
        <p className="mt-2 font-sans text-xs italic opacity-70">
          {PERSONALITY_TAGLINE[stats.personality]}
        </p>
      </div>
    ),
  });

  // ── Card 2 — Continent on your doorstep ─────────────────────────
  cards.push({
    title: '2 of 9 — Where your orders came from',
    background:
      'linear-gradient(140deg, #033E5A 0%, #045E76 60%, #07A09D 100%)',
    foreground: '#FFFFFF',
    body: (
      <div className="flex flex-col items-center gap-4">
        <Globe2 size={28} className="text-amber" aria-hidden />
        <p className="font-sans text-sm opacity-85">
          You shopped from
        </p>
        <p className="font-raleway text-5xl font-extrabold tracking-tight">
          {stats.uniqueCountriesCount}
        </p>
        <p className="font-sans text-sm opacity-85">African countries</p>
        <div className="mt-2 flex w-full flex-col gap-1">
          {stats.topOriginCountries.slice(0, 3).map((c) => (
            <div
              key={c.code}
              className="flex items-center justify-between gap-3 font-sans text-xs"
            >
              <span className="font-semibold">{c.name}</span>
              <span className="flex flex-1 items-center gap-2">
                <span
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <span
                    className="block h-full rounded-full bg-amber"
                    style={{ width: `${c.sharePct}%` }}
                  />
                </span>
                <span className="opacity-80">{c.sharePct}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  // ── Card 3 — Cultural year ──────────────────────────────────────
  cards.push({
    title: '3 of 9 — Your cultural year',
    background:
      'linear-gradient(160deg, #4A0A4F 0%, #7A1075 50%, #B71D6C 100%)',
    foreground: '#FFFFFF',
    body: (
      <div className="flex flex-col items-center gap-4">
        <PartyPopper size={28} className="text-amber" aria-hidden />
        <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-80">
          Your busiest moments
        </p>
        <div className="flex w-full flex-col gap-1.5 font-sans text-xs">
          <CulturalRow
            label="Christmas week"
            count={stats.cultural.christmasWeekOrders}
          />
          <CulturalRow
            label="Independence Day"
            count={stats.cultural.independenceDayWeekOrders}
          />
          <CulturalRow
            label="Eid week"
            count={stats.cultural.eidWeekOrders}
          />
        </div>
        <MonthlyHistogram counts={stats.cultural.monthlyOrderCounts} />
        <p className="font-sans text-[11px] opacity-75">
          Busiest: <strong>{MONTH_LABELS[stats.cultural.busiestMonth.month - 1]}</strong>
          {' · '}
          Quietest: <strong>{MONTH_LABELS[stats.cultural.quietestMonth.month - 1]}</strong>
        </p>
      </div>
    ),
  });

  // ── Card 4 — You supported ──────────────────────────────────────
  cards.push({
    title: '4 of 9 — You supported',
    background:
      'linear-gradient(160deg, #11342B 0%, #1A6C42 60%, #2DB07A 100%)',
    foreground: '#FFFFFF',
    body: (
      <div className="flex flex-col items-center gap-3">
        <Sprout size={28} className="text-amber" aria-hidden />
        <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-80">
          Your orders supported
        </p>
        <p className="font-raleway text-5xl font-extrabold">
          {stats.smallBusinessesSupported}
        </p>
        <p className="font-sans text-sm opacity-90">
          small businesses across Africa
        </p>
        <div className="mt-2 flex w-full flex-col gap-1 font-sans text-xs opacity-90">
          {stats.topSellers.map((s) => (
            <div
              key={s.brand}
              className="flex items-center justify-between gap-2 border-t border-white/15 py-1"
            >
              <span className="font-semibold">{s.brand}</span>
              <span className="opacity-80">{s.country ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  // ── Card 5 — Top categories ─────────────────────────────────────
  const top = stats.topCategories[0];
  cards.push({
    title: '5 of 9 — Top category',
    background:
      'linear-gradient(160deg, #5B1B05 0%, #8C2F09 60%, #D34F0E 100%)',
    foreground: '#FFFFFF',
    body: (
      <div className="flex flex-col items-center gap-4">
        <Star size={28} className="text-amber" aria-hidden />
        <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-80">
          Your favourite category
        </p>
        <p className="font-raleway text-2xl font-extrabold">
          {top?.name ?? '—'}
        </p>
        <p className="font-sans text-xs opacity-80">
          {top?.sharePct ?? 0}% of your orders
        </p>
        <div className="mt-3 flex w-full flex-col gap-1 font-sans text-xs">
          {stats.topCategories.slice(1, 5).map((c, i) => (
            <div
              key={c.slug}
              className="flex items-center justify-between border-t border-white/15 py-1"
            >
              <span className="opacity-80">
                {i + 2}. {c.name}
              </span>
              <span className="opacity-80">{c.sharePct}%</span>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  // ── Card 6 — Continental Rewards ────────────────────────────────
  const tier = stats.loyalty.finalTier;
  cards.push({
    title: '6 of 9 — Continental Rewards',
    background:
      'linear-gradient(160deg, #000066 0%, #131388 60%, #1F1FB4 100%)',
    foreground: '#FFFFFF',
    body: (
      <div className="flex flex-col items-center gap-3">
        <Coins size={28} className="text-amber" aria-hidden />
        <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-80">
          You earned
        </p>
        <p className="font-raleway text-5xl font-extrabold">
          {stats.loyalty.coinsEarned.toLocaleString()}
        </p>
        <p className="font-sans text-xs opacity-80">Afrizone Coins</p>
        <p className="font-sans text-[11px] opacity-70">
          Top {100 - stats.loyalty.percentileRank}% of shoppers
        </p>
        <div
          className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-raleway text-xs font-extrabold uppercase tracking-[0.2em]"
          style={{
            background: TIER_COLOR[tier],
            color: tier === 'GOLD' || tier === 'PLATINUM' ? '#000066' : '#FFFFFF',
          }}
        >
          <Trophy size={12} aria-hidden /> {tier}
        </div>
        {stats.loyalty.coinsRedeemedNgn > 0 && (
          <p className="font-sans text-[11px] opacity-80">
            Redeemed ₦{stats.loyalty.coinsRedeemedNgn.toLocaleString()} off your orders
          </p>
        )}
      </div>
    ),
  });

  // ── Card 7 — Care packages (CONNECTOR-flavoured) ────────────────
  if (stats.carePackagesCount > 0) {
    cards.push({
      title: '7 of 9 — Care packages',
      background:
        'linear-gradient(160deg, #6B0E0A 0%, #9F1B12 60%, #D9382B 100%)',
      foreground: '#FFFFFF',
      body: (
        <div className="flex flex-col items-center gap-3">
          <Heart size={28} className="text-amber" aria-hidden />
          <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-80">
            You sent
          </p>
          <p className="font-raleway text-5xl font-extrabold">
            {stats.carePackagesCount}
          </p>
          <p className="font-sans text-sm opacity-90">
            care package{stats.carePackagesCount === 1 ? '' : 's'} home
          </p>
          {stats.carePackageDestinations.length > 0 && (
            <p className="mt-2 font-sans text-[11px] opacity-80">
              to: {unique(stats.carePackageDestinations).join(' · ')}
            </p>
          )}
          <p className="mt-3 font-sans text-xs italic opacity-80">
            Distance is nothing for the ones we love.
          </p>
        </div>
      ),
    });
  } else {
    cards.push({
      title: '7 of 9 — Discoveries',
      background:
        'linear-gradient(160deg, #1F0E40 0%, #3B1F7A 60%, #5733AE 100%)',
      foreground: '#FFFFFF',
      body: (
        <div className="flex flex-col items-center gap-3">
          <Sparkles size={28} className="text-amber" aria-hidden />
          <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-80">
            You were early to
          </p>
          {stats.discoveries.length > 0 ? (
            <ul className="flex w-full flex-col gap-2 font-sans text-xs">
              {stats.discoveries.map((d) => (
                <li
                  key={d.productSlug}
                  className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-left"
                >
                  <p className="font-raleway text-sm font-bold">
                    {d.productName}
                  </p>
                  <p className="opacity-75">{d.why}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-sm opacity-80">
              No big discoveries this year — but next year&apos;s coming.
            </p>
          )}
        </div>
      ),
    });
  }

  // ── Card 8 — Discoveries (only if not already shown) ────────────
  if (stats.carePackagesCount > 0 && stats.discoveries.length > 0) {
    cards.push({
      title: '8 of 9 — Discoveries',
      background:
        'linear-gradient(160deg, #1F0E40 0%, #3B1F7A 60%, #5733AE 100%)',
      foreground: '#FFFFFF',
      body: (
        <div className="flex flex-col items-center gap-3">
          <Sparkles size={28} className="text-amber" aria-hidden />
          <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-80">
            You were early to
          </p>
          <ul className="flex w-full flex-col gap-2 font-sans text-xs">
            {stats.discoveries.map((d) => (
              <li
                key={d.productSlug}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-left"
              >
                <p className="font-raleway text-sm font-bold">{d.productName}</p>
                <p className="opacity-75">{d.why}</p>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  // ── Final — Share ───────────────────────────────────────────────
  cards.push({
    title: `${cards.length + 1} of ${cards.length + 1} — Share`,
    background:
      'linear-gradient(160deg, #000066 0%, #281580 60%, #FBAC34 110%)',
    foreground: '#FFFFFF',
    body: (
      <div className="flex flex-col items-center gap-3">
        <Gift size={28} className="text-amber" aria-hidden />
        <p className="font-raleway text-3xl font-extrabold">
          Thanks for an amazing year
        </p>
        <p className="max-w-[14rem] font-sans text-xs opacity-85">
          {stats.totalOrders} orders · {stats.totalProducts} products ·{' '}
          {stats.uniqueCountriesCount} countries
        </p>
        <div className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-[0.2em] text-navy">
          Tap to share
        </div>
        <p className="mt-3 font-sans text-[10px] opacity-75">
          AFRIZONEMART WRAP {new Date().getUTCFullYear()}
        </p>
      </div>
    ),
  });

  /// Re-stamp titles so they reflect the final card count
  /// (the conditional 7-or-7 swap above changes the ordinal positions).
  return cards.map((c, i) => ({
    ...c,
    title: `${i + 1} of ${cards.length} — ${c.title.split(' — ').slice(1).join(' — ')}`,
  }));
}

function CulturalRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between border-t border-white/15 py-1">
      <span className="opacity-90">{label}</span>
      <span className="font-bold">
        {count} order{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function MonthlyHistogram({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  return (
    <div className="mt-1 flex h-14 w-full items-end gap-1">
      {counts.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-amber"
            style={{ height: `${(c / max) * 100}%` }}
          />
          <span className="font-sans text-[8px] opacity-70">
            {MONTH_LABELS[i][0]}
          </span>
        </div>
      ))}
    </div>
  );
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
