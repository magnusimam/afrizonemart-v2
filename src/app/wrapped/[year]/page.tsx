'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Loader2,
  Lock,
  LogIn,
  Share2,
  Sparkles,
} from 'lucide-react';
import { WrapDeck } from '@/components/admin/wrap/WrapDeck';
import { getWrapMe, type WrapMeResult } from '@/lib/api/wrap';
import { HttpApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * /wrapped/[year] — the customer-facing Afrizonemart Wrap.
 *
 * Full-screen (top-level route → no shop header/footer). Fetches the
 * viewer's own wrap via GET /api/wrap/me and branches on `status`:
 *   ready    → the swipeable card deck (+ background music + share)
 *   pending  → "drops Dec 1" anticipation screen with a countdown
 *   locked   → "unlock at 3 orders" teaser with their live count
 *   optedOut → re-enable hint
 *   (401)    → sign-in prompt
 *
 * The deck component is shared with the admin preview; PR 3 adds the
 * per-card Satori share PNGs (this page shares the URL for now).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const WRAP_MUSIC_KEY = 'content.wrap.backgroundMusic';

type Phase =
  | { kind: 'loading' }
  | { kind: 'signin' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; result: WrapMeResult };

export default function WrappedYearPage({
  params,
}: {
  params: { year: string };
}) {
  const parsed = Number.parseInt(params.year, 10);
  const year = Number.isFinite(parsed) ? parsed : new Date().getUTCFullYear();
  const user = useAuthStore((s) => s.user);

  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: 'loading' });

    void getWrapMe(year)
      .then((result) => {
        if (!cancelled) setPhase({ kind: 'done', result });
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof HttpApiError && e.status === 401) {
          setPhase({ kind: 'signin' });
        } else {
          setPhase({
            kind: 'error',
            message:
              e instanceof Error ? e.message : 'Could not load your wrap.',
          });
        }
      });

    // Background-music URL (admin-managed; public content endpoint).
    void fetch(`${API_BASE}/api/content`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { overrides?: Record<string, unknown> } | null) => {
        if (cancelled || !data?.overrides) return;
        const v = data.overrides[WRAP_MUSIC_KEY];
        setMusicUrl(typeof v === 'string' && v.length > 0 ? v : null);
      })
      .catch(() => {
        /* music is optional */
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  return (
    <main
      className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-10"
      style={{
        background:
          'radial-gradient(120% 120% at 50% 0%, #131388 0%, #000066 55%, #00003D 100%)',
      }}
    >
      {phase.kind === 'loading' && (
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="animate-spin text-amber" size={28} aria-hidden />
          <p className="font-sans text-sm opacity-80">Loading your {year} wrap…</p>
        </div>
      )}

      {phase.kind === 'signin' && <SignInScreen year={year} />}

      {phase.kind === 'error' && <ErrorScreen message={phase.message} />}

      {phase.kind === 'done' && phase.result.status === 'locked' && (
        <LockedScreen
          ordersCount={phase.result.ordersCount}
          minOrders={phase.result.minOrders}
          year={year}
        />
      )}

      {phase.kind === 'done' && phase.result.status === 'pending' && (
        <PendingScreen dropAt={phase.result.dropAt} year={year} />
      )}

      {phase.kind === 'done' && phase.result.status === 'optedOut' && (
        <OptedOutScreen year={year} />
      )}

      {phase.kind === 'done' && phase.result.status === 'ready' && (
        <ReadyScreen
          result={phase.result}
          musicUrl={musicUrl}
          firstName={user?.name?.split(' ')[0] ?? null}
        />
      )}
    </main>
  );
}

// ── Ready: the deck + share ─────────────────────────────────────────
function ReadyScreen({
  result,
  musicUrl,
  firstName,
}: {
  result: Extract<WrapMeResult, { status: 'ready' }>;
  musicUrl: string | null;
  firstName: string | null;
}) {
  const [shareNote, setShareNote] = useState<string | null>(null);

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: `My Afrizonemart Wrap ${result.year}`,
      text: `Here's my ${result.year} on Afrizonemart 🌍`,
      url,
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNote('Link copied');
    } catch {
      /* user cancelled share — ignore */
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-center font-raleway text-lg font-bold uppercase tracking-[0.3em] text-amber">
        Your {result.year} Wrap
      </h1>
      <WrapDeck stats={result.stats} customerName={firstName} musicUrl={musicUrl} />
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-transform hover:scale-105"
      >
        <Share2 size={16} aria-hidden /> Share my wrap
      </button>
      {shareNote && (
        <p className="font-sans text-xs text-white/70">{shareNote}</p>
      )}
    </div>
  );
}

// ── Locked: below the order threshold ───────────────────────────────
function LockedScreen({
  ordersCount,
  minOrders,
  year,
}: {
  ordersCount: number;
  minOrders: number;
  year: number;
}) {
  const remaining = Math.max(0, minOrders - ordersCount);
  return (
    <Card>
      <Lock className="text-amber" size={36} aria-hidden />
      <h1 className="font-raleway text-2xl font-extrabold text-white">
        Your {year} Wrap unlocks at {minOrders} orders
      </h1>
      <p className="max-w-sm font-sans text-sm text-white/80">
        You&apos;re at <strong className="text-amber">{ordersCount}</strong>.{' '}
        {remaining === 1
          ? '1 more order'
          : `${remaining} more orders`}{' '}
        this year and your full {year} wrap goes live on Dec 1.
      </p>
      <Link
        href="/shop"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-transform hover:scale-105"
      >
        Continue shopping
      </Link>
    </Card>
  );
}

// ── Pending: eligible, awaiting the Dec 1 drop ──────────────────────
function PendingScreen({ dropAt, year }: { dropAt: string; year: number }) {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    const target = new Date(dropAt).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown('Any moment now…');
        return;
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setCountdown(`${days}d ${hours}h ${mins}m`);
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [dropAt]);

  const dropLabel = new Date(dropAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card>
      <Clock className="text-amber" size={36} aria-hidden />
      <h1 className="font-raleway text-2xl font-extrabold text-white">
        Your {year} Wrap is on its way
      </h1>
      <p className="max-w-sm font-sans text-sm text-white/80">
        It drops <strong className="text-amber">{dropLabel}</strong>. We&apos;re
        wrapping up a year of African makers, care packages and cultural
        moments — just for you.
      </p>
      {countdown && (
        <p className="mt-1 font-raleway text-3xl font-extrabold tracking-tight text-amber">
          {countdown}
        </p>
      )}
      <Link
        href="/shop"
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white transition-colors hover:bg-white/10"
      >
        Keep shopping
      </Link>
    </Card>
  );
}

// ── Opted out ───────────────────────────────────────────────────────
function OptedOutScreen({ year }: { year: number }) {
  return (
    <Card>
      <Sparkles className="text-amber" size={36} aria-hidden />
      <h1 className="font-raleway text-2xl font-extrabold text-white">
        Your Wrap is turned off
      </h1>
      <p className="max-w-sm font-sans text-sm text-white/80">
        You&apos;ve opted out of the Afrizonemart Wrap. Turn it back on in your
        account settings to see your {year} retrospective.
      </p>
      <Link
        href="/account/profile"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-transform hover:scale-105"
      >
        Account settings
      </Link>
    </Card>
  );
}

// ── Sign-in prompt ──────────────────────────────────────────────────
function SignInScreen({ year }: { year: number }) {
  const next = encodeURIComponent(`/wrapped/${year}`);
  return (
    <Card>
      <LogIn className="text-amber" size={36} aria-hidden />
      <h1 className="font-raleway text-2xl font-extrabold text-white">
        Sign in to see your Wrap
      </h1>
      <p className="max-w-sm font-sans text-sm text-white/80">
        Your Afrizonemart Wrap is personal. Log in to unwrap your {year}.
      </p>
      <Link
        href={`/login?redirect=${next}`}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-transform hover:scale-105"
      >
        Log in
      </Link>
    </Card>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <Card>
      <h1 className="font-raleway text-xl font-extrabold text-white">
        Something went wrong
      </h1>
      <p className="max-w-sm font-sans text-sm text-white/80">{message}</p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white hover:bg-white/10"
      >
        Back to home
      </Link>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-md flex-col items-center gap-4 text-center">
      {children}
    </div>
  );
}
