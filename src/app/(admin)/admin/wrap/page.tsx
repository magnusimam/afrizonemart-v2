'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Coins,
  Eye,
  Gift,
  Globe2,
  Heart,
  Music,
  PartyPopper,
  Save,
  Search,
  Sparkles,
  Sprout,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { WrapDeck } from '@/components/admin/wrap/WrapDeck';
import { toast } from '@/components/admin/Toast';
import {
  adminWrapPreview,
  adminWrapStats,
  type WrappedStatsV1,
  type WrapYearStats,
} from '@/lib/api/wrap';
import { adminGetContentOverrides, adminUpdateContent } from '@/lib/api/admin';
import { uploadAudio, UploadApiError } from '@/lib/api/uploads';

const WRAP_MUSIC_KEY = 'content.wrap.backgroundMusic';

/**
 * /admin/wrap — the Wrap operations console.
 *
 * Three things live here:
 *  1. **What it captures** — a visual index of the 9 cards the
 *     deck renders + the fields each one uses. New ops staff can
 *     get oriented without reading WRAP_TRACKER.md.
 *  2. **What we have** — per-year snapshot counts (total / visible
 *     / published) sourced from `WrappedSnapshot` aggregates.
 *  3. **Preview** — paste a userId, see their wrap deck rendered
 *     live against `computeUserWrap()`. Below-threshold users
 *     surface a clear "below_min_orders" badge instead of a stack
 *     trace.
 *
 * The "Open Live Demo" CTA at the top links to /admin/wrap/demo
 * which lets you flip persona archetypes without needing a real
 * customer row in the DB.
 */
export default function AdminWrapIndexPage() {
  const [stats, setStats] = useState<WrapYearStats[] | null>(null);
  const [userId, setUserId] = useState('');
  const [year, setYear] = useState<number>(new Date().getUTCFullYear());
  const [previewStats, setPreviewStats] = useState<WrappedStatsV1 | null>(null);
  const [previewReason, setPreviewReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ── Background music ──────────────────────────────────────────────
  const [savedMusicUrl, setSavedMusicUrl] = useState<string | null>(null);
  const [stagedMusicUrl, setStagedMusicUrl] = useState<string | null>(null);
  const [musicUploading, setMusicUploading] = useState(false);
  const [musicSaving, setMusicSaving] = useState(false);
  const musicInputRef = useRef<HTMLInputElement | null>(null);
  const musicDirty = stagedMusicUrl !== savedMusicUrl;

  useEffect(() => {
    void adminWrapStats()
      .then((r) => setStats(r.years))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load stats', 'error'));
    void adminGetContentOverrides()
      .then((r) => {
        const v = r.overrides[WRAP_MUSIC_KEY];
        const url = typeof v === 'string' && v.length > 0 ? v : null;
        setSavedMusicUrl(url);
        setStagedMusicUrl(url);
      })
      .catch(() => {
        /* non-fatal — music panel just starts empty */
      });
  }, []);

  const onPickMusic = async (file: File | undefined) => {
    if (!file) return;
    setMusicUploading(true);
    try {
      const asset = await uploadAudio(file);
      setStagedMusicUrl(asset.url);
      toast('Track uploaded — press Save to make it live', 'success');
    } catch (e) {
      const msg =
        e instanceof UploadApiError || e instanceof Error
          ? e.message
          : 'Audio upload failed';
      toast(msg, 'error');
    } finally {
      setMusicUploading(false);
      if (musicInputRef.current) musicInputRef.current.value = '';
    }
  };

  const saveMusic = async () => {
    setMusicSaving(true);
    try {
      await adminUpdateContent([{ key: WRAP_MUSIC_KEY, value: stagedMusicUrl }]);
      setSavedMusicUrl(stagedMusicUrl);
      toast(stagedMusicUrl ? 'Background music saved' : 'Background music cleared', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setMusicSaving(false);
    }
  };

  const yearOptions = useMemo(() => {
    const now = new Date().getUTCFullYear();
    return [now, now - 1, now - 2];
  }, []);

  const runPreview = async () => {
    if (!userId.trim()) return;
    setBusy(true);
    setPreviewStats(null);
    setPreviewReason(null);
    try {
      const r = await adminWrapPreview(userId.trim(), year);
      setPreviewStats(r.stats);
      setPreviewReason(r.reason);
      if (!r.stats && r.reason) {
        toast(`No wrap: ${r.reason}`, 'error');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Preview failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Afrizonemart Wrap"
        subtitle="The annual personalised retrospective. Cron rolls daily; publishes Dec 1 09:00 GMT."
        action={
          <Link
            href="/admin/wrap/demo"
            className="inline-flex items-center gap-2 rounded-md bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-amber/90"
          >
            <Sparkles size={14} aria-hidden /> Open Live Demo
          </Link>
        }
      />

      {/* ── Snapshot counts ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-muted">
          Snapshots in database
        </h2>
        {stats === null && (
          <p className="font-sans text-sm text-muted">Loading…</p>
        )}
        {stats !== null && stats.length === 0 && (
          <p className="rounded-md border border-dashed border-border bg-page/60 px-4 py-6 font-sans text-sm text-muted">
            No wraps yet. The daily cron rolls qualifying users into
            <code className="mx-1 rounded bg-page px-1.5 font-mono text-xs">WrappedSnapshot</code>
            once they have 3+ qualifying orders.
          </p>
        )}
        {stats !== null && stats.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.year}
                className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm"
              >
                <p className="font-raleway text-xs font-bold uppercase tracking-btn text-muted">
                  {s.year}
                </p>
                <p className="mt-1 font-raleway text-2xl font-bold text-navy">
                  {s.snapshots.toLocaleString()}
                </p>
                <p className="font-sans text-xs text-muted">
                  {s.visible.toLocaleString()} visible ·{' '}
                  {s.published.toLocaleString()} published
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Background music ────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 font-raleway text-sm font-bold uppercase tracking-btn text-muted">
          <Music size={14} aria-hidden /> Background music
        </h2>
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="mb-3 font-sans text-xs text-muted">
            Upload a track to play behind the wrap slides. Saved to the
            database — takes effect for the deck on Save. Use a
            royalty-free / licensed file (mp3, m4a, ogg or wav, max 8MB).
          </p>

          {stagedMusicUrl ? (
            <div className="mb-3 flex flex-col gap-2 rounded-md border border-border bg-page/50 px-3 py-2">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                src={stagedMusicUrl}
                controls
                preload="none"
                className="w-full"
              />
              <p className="truncate font-mono text-[10px] text-muted">
                {stagedMusicUrl}
              </p>
            </div>
          ) : (
            <p className="mb-3 rounded-md border border-dashed border-border bg-page/40 px-3 py-4 text-center font-sans text-xs text-muted">
              No track set — the wrap plays silently.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={musicInputRef}
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => void onPickMusic(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => musicInputRef.current?.click()}
              disabled={musicUploading}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-page disabled:opacity-40"
            >
              <Upload size={13} aria-hidden />{' '}
              {musicUploading ? 'Uploading…' : stagedMusicUrl ? 'Replace track' : 'Upload track'}
            </button>

            {stagedMusicUrl && (
              <button
                type="button"
                onClick={() => setStagedMusicUrl(null)}
                disabled={musicUploading || musicSaving}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={13} aria-hidden /> Remove
              </button>
            )}

            <button
              type="button"
              onClick={saveMusic}
              disabled={!musicDirty || musicSaving || musicUploading}
              className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-navy/90 disabled:opacity-40"
            >
              <Save size={13} aria-hidden /> {musicSaving ? 'Saving…' : 'Save'}
            </button>

            {musicDirty && (
              <span className="font-sans text-[11px] italic text-amber">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── What's captured ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-muted">
          What the wrap captures (9 cards)
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CARD_DICT.map((c) => (
            <article
              key={c.key}
              className="rounded-lg border border-border bg-white p-4"
            >
              <header className="flex items-center gap-2">
                <c.icon size={16} className="text-amber" aria-hidden />
                <p className="font-raleway text-sm font-bold text-navy">
                  {c.title}
                </p>
              </header>
              <p className="mt-1 font-sans text-xs text-muted">{c.framing}</p>
              <ul className="mt-3 flex flex-col gap-0.5 font-sans text-[11px] text-charcoal">
                {c.fields.map((f) => (
                  <li key={f}>
                    <code className="rounded bg-page px-1 py-0.5 font-mono text-[10px] text-navy">
                      {f}
                    </code>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ── Live preview by userId ──────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-muted">
          Preview a real user&apos;s wrap
        </h2>
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="flex-1 min-w-[220px]">
            <label
              htmlFor="wrap-user-id"
              className="mb-1 block font-raleway text-[11px] font-bold uppercase tracking-btn text-muted"
            >
              User ID
            </label>
            <input
              id="wrap-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="cuid…"
              className="w-full rounded-input border border-border bg-white px-3 py-2 font-mono text-xs text-charcoal focus:border-navy focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="wrap-year"
              className="mb-1 block font-raleway text-[11px] font-bold uppercase tracking-btn text-muted"
            >
              Year
            </label>
            <select
              id="wrap-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={runPreview}
            disabled={busy || !userId.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-navy/90 disabled:opacity-40"
          >
            <Search size={13} aria-hidden /> {busy ? 'Computing…' : 'Compute Wrap'}
          </button>
        </div>

        {previewReason && !previewStats && (
          <div className="mt-4 rounded-md border border-dashed border-border bg-page/60 px-4 py-3 font-sans text-sm text-muted">
            No wrap available — <strong>{previewReason}</strong>. Users need at
            least 3 qualifying orders to be eligible.
          </div>
        )}

        {previewStats && (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-border bg-page/40 p-6">
            <WrapDeck stats={previewStats} musicUrl={stagedMusicUrl} />
            <details className="w-full max-w-2xl">
              <summary className="cursor-pointer font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                Raw stats JSON
              </summary>
              <pre className="mt-2 overflow-auto rounded-md bg-charcoal p-3 font-mono text-[10px] text-white">
                {JSON.stringify(previewStats, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </section>

      <footer className="mt-12 flex items-center gap-2 border-t border-border pt-4 font-sans text-xs text-muted">
        <Eye size={13} aria-hidden /> Hidden wraps return 404 to the customer
        endpoint. Toggle visibility on any snapshot via{' '}
        <code className="rounded bg-page px-1 font-mono text-[10px]">
          PATCH /api/admin/wrap/:id
        </code>{' '}
        — full UI in PR 4.
      </footer>
    </div>
  );
}

interface CardSpec {
  key: string;
  title: string;
  framing: string;
  fields: string[];
  icon: typeof Sparkles;
}

const CARD_DICT: CardSpec[] = [
  {
    key: 'personality',
    title: '1. Personality',
    framing:
      'Slots the user as Connector / Patriot / Explorer / Curator from their shopping pattern.',
    fields: ['personality', 'personalityReason'],
    icon: Sparkles,
  },
  {
    key: 'geography',
    title: '2. Continent on your doorstep',
    framing: 'Top countries they bought from + share of orders.',
    fields: [
      'uniqueCountriesCount',
      'topOriginCountries[]',
      'homeCountry',
    ],
    icon: Globe2,
  },
  {
    key: 'cultural',
    title: '3. Cultural year',
    framing:
      'Eid / Independence / Christmas week counts + monthly histogram + busy/quiet months.',
    fields: [
      'cultural.eidWeekOrders',
      'cultural.independenceDayWeekOrders',
      'cultural.christmasWeekOrders',
      'cultural.monthlyOrderCounts[12]',
      'cultural.busiestMonth',
      'cultural.quietestMonth',
    ],
    icon: PartyPopper,
  },
  {
    key: 'supported',
    title: '4. You supported',
    framing:
      'How many distinct small businesses they bought from + top 3 sellers.',
    fields: ['smallBusinessesSupported', 'topSellers[]'],
    icon: Sprout,
  },
  {
    key: 'categories',
    title: '5. Top categories',
    framing: 'Their #1 category by order share, runners-up listed.',
    fields: ['uniqueCategoriesCount', 'topCategories[]'],
    icon: Star,
  },
  {
    key: 'loyalty',
    title: '6. Continental Rewards',
    framing:
      'Coins earned + redeemed (₦) + final tier + percentile rank vs all other users.',
    fields: [
      'loyalty.coinsEarned',
      'loyalty.coinsRedeemedNgn',
      'loyalty.finalTier',
      'loyalty.percentileRank',
    ],
    icon: Coins,
  },
  {
    key: 'care',
    title: '7. Care packages',
    framing:
      'Diaspora framing — orders shipped to a country other than home. Hidden if zero.',
    fields: ['carePackagesCount', 'carePackageDestinations[]'],
    icon: Heart,
  },
  {
    key: 'discoveries',
    title: '8. Discoveries',
    framing:
      "Products they bought that later became crowd favourites (rating ≥4.5, reviewCount ≥10).",
    fields: ['discoveries[]'],
    icon: BookOpen,
  },
  {
    key: 'share',
    title: '9. Share',
    framing:
      'Closing card with the year totals + one-tap export to Instagram / WhatsApp / X.',
    fields: ['totalOrders', 'totalProducts', 'uniqueCountriesCount'],
    icon: Gift,
  },
];
