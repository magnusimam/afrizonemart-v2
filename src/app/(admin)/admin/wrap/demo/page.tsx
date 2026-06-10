'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { WrapDeck } from '@/components/admin/wrap/WrapDeck';
import { toast } from '@/components/admin/Toast';
import {
  adminWrapMockPreview,
  type WrappedPersonality,
  type WrappedStatsV1,
} from '@/lib/api/wrap';

/**
 * /admin/wrap/demo — live preview with mock data.
 *
 * No DB writes, no real users required. The persona toggle hits
 * `POST /api/admin/wrap/mock-preview` which returns a fully-shaped
 * `WrappedStatsV1` synthesised from a small set of knobs. The same
 * `WrapDeck` component the real preview uses renders it.
 *
 * What this is good for:
 *  - Showing the deck to stakeholders before Dec 1.
 *  - Confirming each card has visually interesting content for
 *    every persona archetype before pixel polish.
 *  - Debugging copy / framing decisions without seeding orders.
 *
 * What this is NOT:
 *  - A test fixture. The aggregation is mocked, not the renderer.
 *  - Customer-facing. Stays behind `content.write` capability.
 */

const PERSONA_DEFS: Array<{
  key: WrappedPersonality;
  label: string;
  blurb: string;
  defaultHome: string;
  defaultOrders: number;
}> = [
  {
    key: 'CONNECTOR',
    label: 'Connector',
    blurb: 'Diaspora gifter — sends care packages back home.',
    defaultHome: 'GB',
    defaultOrders: 14,
  },
  {
    key: 'PATRIOT',
    label: 'Patriot',
    blurb: 'Loyal to one country — 70%+ from a single origin.',
    defaultHome: 'NG',
    defaultOrders: 18,
  },
  {
    key: 'EXPLORER',
    label: 'Explorer',
    blurb: '4+ countries — shopped across the continent.',
    defaultHome: 'KE',
    defaultOrders: 21,
  },
  {
    key: 'CURATOR',
    label: 'Curator',
    blurb: 'Small specific catalog — a few items they love.',
    defaultHome: 'NG',
    defaultOrders: 6,
  },
];

const COUNTRY_OPTIONS = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'MA', name: 'Morocco' },
  { code: 'EG', name: 'Egypt' },
];

export default function AdminWrapDemoPage() {
  const [personality, setPersonality] = useState<WrappedPersonality>('CONNECTOR');
  const [homeCountry, setHomeCountry] = useState<string>('GB');
  const [totalOrders, setTotalOrders] = useState<number>(14);
  const [customerName, setCustomerName] = useState<string>('Joy');

  const [stats, setStats] = useState<WrappedStatsV1 | null>(null);
  const [busy, setBusy] = useState(false);

  /// Snap defaults whenever the persona changes — saves a click.
  const selectPersona = (p: WrappedPersonality) => {
    const def = PERSONA_DEFS.find((d) => d.key === p)!;
    setPersonality(p);
    setHomeCountry(def.defaultHome);
    setTotalOrders(def.defaultOrders);
  };

  /// Recompute the mock whenever any knob changes. Debounce a tick
  /// so the slider doesn't spam the endpoint on every drag.
  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      setBusy(true);
      adminWrapMockPreview({ personality, homeCountry, totalOrders })
        .then((r) => {
          if (!cancelled) setStats(r.stats);
        })
        .catch((e) => {
          if (!cancelled) toast(e instanceof Error ? e.message : 'Mock failed', 'error');
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [personality, homeCountry, totalOrders]);

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Wrap — Live Demo"
        subtitle="Mock data. Pure synthesis from persona knobs — never reads or writes the database."
        action={
          <Link
            href="/admin/wrap"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-page"
          >
            <ChevronLeft size={14} aria-hidden /> Back to Wrap
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
        {/* ── Knobs panel ────────────────────────────────────────── */}
        <aside className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 font-raleway text-xs font-bold uppercase tracking-btn text-muted">
              Persona archetype
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {PERSONA_DEFS.map((d) => {
                const active = d.key === personality;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => selectPersona(d.key)}
                    className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      active
                        ? 'border-amber bg-amber/10'
                        : 'border-border bg-white hover:border-amber/40'
                    }`}
                  >
                    <Sparkles
                      size={14}
                      className={active ? 'text-amber' : 'text-muted'}
                      aria-hidden
                    />
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-raleway text-sm font-bold text-navy">
                        {d.label}
                      </span>
                      <span className="font-sans text-xs text-muted">{d.blurb}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h2 className="mb-3 font-raleway text-xs font-bold uppercase tracking-btn text-muted">
              Tweaks
            </h2>

            <label className="mb-3 block">
              <span className="mb-1 block font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                Customer name (display only)
              </span>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Joy"
                className="w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                Home country
              </span>
              <select
                value={homeCountry}
                onChange={(e) => setHomeCountry(e.target.value)}
                className="w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 flex items-center justify-between">
                <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                  Total orders
                </span>
                <span className="font-mono text-xs text-navy">{totalOrders}</span>
              </span>
              <input
                type="range"
                min={3}
                max={50}
                value={totalOrders}
                onChange={(e) => setTotalOrders(Number(e.target.value))}
                className="w-full accent-amber"
              />
              <span className="mt-1 block font-sans text-[10px] text-muted">
                Min 3 (eligibility threshold). Above that, each card scales
                its numbers proportionally.
              </span>
            </label>
          </section>

          {stats && (
            <section>
              <details>
                <summary className="cursor-pointer font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                  Raw stats JSON
                </summary>
                <pre className="mt-2 max-h-[400px] overflow-auto rounded-md bg-charcoal p-3 font-mono text-[10px] text-white">
                  {JSON.stringify(stats, null, 2)}
                </pre>
              </details>
            </section>
          )}
        </aside>

        {/* ── Deck preview ────────────────────────────────────────── */}
        <section className="flex flex-col items-center gap-4 rounded-lg border border-border bg-page/40 p-6">
          {stats ? (
            <WrapDeck stats={stats} customerName={customerName || null} />
          ) : busy ? (
            <p className="font-sans text-sm text-muted">Computing…</p>
          ) : (
            <p className="font-sans text-sm text-muted">No data yet.</p>
          )}
          <p className="max-w-md text-center font-sans text-xs text-muted">
            Tap the chevrons to step through the deck. Production version
            renders one card at a time at 9:16 with Story-style transitions
            and per-card share buttons.
          </p>
        </section>
      </div>
    </div>
  );
}
