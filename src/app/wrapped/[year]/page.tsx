'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Share2 } from 'lucide-react';
import { WrapDeck } from '@/components/admin/wrap/WrapDeck';
import { getWrapMe, type WrapMeResult } from '@/lib/api/wrap';
import { useAuthStore } from '@/stores/authStore';

/**
 * /wrapped/[year] — the customer-facing Afrizonemart Wrap.
 *
 * Hidden until it's live. The feature is revealed on Dec 1 (when the
 * publish cron flips snapshots to published) via the header pill /
 * home banner / login popup / dashboard card — all of which only
 * appear for a `ready` wrap. So this page only ever renders the deck
 * for a `ready` viewer; ANY other state (pending, locked, opted-out,
 * not-logged-in, error) silently redirects home so a direct/guessed
 * URL never reveals the feature before its time.
 *
 * Full-screen top-level route (no shop header/footer): navy canvas.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const WRAP_MUSIC_KEY = 'content.wrap.backgroundMusic';

export default function WrappedYearPage({
  params,
}: {
  params: { year: string };
}) {
  const router = useRouter();
  const parsed = Number.parseInt(params.year, 10);
  const year = Number.isFinite(parsed) ? parsed : new Date().getUTCFullYear();
  const user = useAuthStore((s) => s.user);

  const [ready, setReady] = useState<Extract<
    WrapMeResult,
    { status: 'ready' }
  > | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getWrapMe(year)
      .then((result) => {
        if (cancelled) return;
        if (result.status === 'ready') setReady(result);
        else router.replace('/'); // not live for this viewer → stay hidden
      })
      .catch(() => {
        if (!cancelled) router.replace('/');
      });

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
  }, [year, router]);

  return (
    <main
      className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-10"
      style={{
        background:
          'radial-gradient(120% 120% at 50% 0%, #131388 0%, #000066 55%, #00003D 100%)',
      }}
    >
      {ready ? (
        <ReadyScreen
          result={ready}
          musicUrl={musicUrl}
          firstName={user?.name?.split(' ')[0] ?? null}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="animate-spin text-amber" size={28} aria-hidden />
          <p className="font-sans text-sm opacity-80">Loading your wrap…</p>
        </div>
      )}
    </main>
  );
}

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
      {shareNote && <p className="font-sans text-xs text-white/70">{shareNote}</p>}
    </div>
  );
}
