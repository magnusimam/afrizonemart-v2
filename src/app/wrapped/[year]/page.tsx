'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Share2 } from 'lucide-react';
import { WrapDeck } from '@/components/admin/wrap/WrapDeck';
import {
  getWrapMe,
  getWrapShareToken,
  type WrapMeResult,
} from '@/lib/api/wrap';
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
  const [token, setToken] = useState<string | null>(null);
  const [sharingCard, setSharingCard] = useState(false);

  // Mint a share token so each card can be rendered as a PNG.
  useEffect(() => {
    let cancelled = false;
    void getWrapShareToken(result.year)
      .then((r) => {
        if (!cancelled) setToken(r.token);
      })
      .catch(() => {
        /* sharing just stays unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, [result.year]);

  // Per-card share — fetch the rendered PNG and share it as a FILE
  // (bytes embedded, so the recipient sees the image regardless of
  // token expiry). Falls back to opening the image if file-share
  // isn't supported (most desktops).
  const shareCard = async (cardKey: string) => {
    if (!token) {
      setShareNote('Sharing not ready yet — try again in a moment.');
      return;
    }
    setSharingCard(true);
    setShareNote(null);
    try {
      const url = `/api/wrap/card/${result.year}/${cardKey}?token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('render failed');
      const blob = await res.blob();
      const file = new File(
        [blob],
        `afrizonemart-wrap-${result.year}-${cardKey}.png`,
        { type: 'image/png' },
      );
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `My ${result.year} Afrizonemart Wrap`,
        });
      } else {
        // Desktop / unsupported: open the PNG so they can save it.
        window.open(URL.createObjectURL(blob), '_blank');
      }
    } catch {
      setShareNote('Could not generate the image — please try again.');
    } finally {
      setSharingCard(false);
    }
  };

  const shareWholeWrap = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `My Afrizonemart Wrap ${result.year}`,
          text: `Here's my ${result.year} on Afrizonemart 🌍`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNote('Link copied');
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-center font-raleway text-lg font-bold uppercase tracking-[0.3em] text-amber">
        Your {result.year} Wrap
      </h1>
      <WrapDeck
        stats={result.stats}
        customerName={firstName}
        musicUrl={musicUrl}
        onShareCard={(cardKey) => void shareCard(cardKey)}
        sharingCard={sharingCard}
      />
      <button
        type="button"
        onClick={shareWholeWrap}
        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white transition-colors hover:bg-white/10"
      >
        <Share2 size={16} aria-hidden /> Share my wrap (link)
      </button>
      {shareNote && <p className="font-sans text-xs text-white/70">{shareNote}</p>}
    </div>
  );
}
