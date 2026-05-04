'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Home as HomeIcon,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { AfricaMap } from '@/components/sections/AfricaMap';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { Flag } from '@/components/common/Flag';
import { PlacementShelf } from '@/components/product/PlacementShelf';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductGridError } from '@/components/product/ProductGridError';
import { useProducts } from '@/hooks/use-products';
import { COUNTRIES, type CountryCode } from '@/lib/countries';
import type { ApiProduct } from '@/lib/api/types';
import { SafeBoundary } from '@/components/common/SafeBoundary';

/**
 * Editorial micro-copy per country. Marketing edits this without touching
 * code in v2 — for now we ship hand-written lines that beat AI-generic.
 */
const COUNTRY_BLURBS: Partial<Record<CountryCode, string>> = {
  NG: 'Lagos ateliers, Aba leather, jollof-grade pantry staples.',
  KE: 'Nairobi craft, Rift Valley coffee, Maasai-inspired textiles.',
  ZA: 'Cape Town design, vineyards, modernist homeware.',
  GH: 'Accra fashion, kente weaves, cocoa-rich pantry.',
  EG: 'Cairo jewellery, cotton, North-African beauty.',
  MA: 'Marrakesh leather, argan oil, hand-knotted rugs.',
  ET: 'Highland coffee, Habesha textiles, Addis ceramics.',
  TZ: 'Zanzibar spices, Tinga Tinga art, Kanga prints.',
  UG: 'Bark cloth, Lake Victoria crafts, plantain pantry.',
  RW: 'Imigongo art, peace-coffee, Kigali ceramics.',
  ZW: 'Stone sculpture, Ndebele beadwork.',
  CI: 'Abidjan beauty, cocoa, Akan textiles.',
  SN: 'Dakar tailoring, Wolof cloth, Saint-Louis style.',
  CM: 'Bamileke craft, palm oil, Douala coffee.',
  ML: 'Bogolan mudcloth, Tuareg silver.',
  DZ: 'Algiers ceramics, Atlas Mountain rugs.',
  TN: 'Tunis mosaics, Sidi Bou Said pottery.',
  AO: 'Luanda fashion, Capulana cloth.',
  BW: 'Kalahari basketry, leather goods.',
  NA: 'Damara craft, desert minerals.',
  MZ: 'Maputo style, cashew, Makonde sculpture.',
};

/**
 * Days back to consider "new arrivals". Past this window products fall
 * out of the page even if they were recent at one point.
 */
const NEW_ARRIVAL_DAYS = 30;

/**
 * Drop number is a deterministic running counter so the page reads like
 * a release cycle. We base it on how many full weeks have elapsed since
 * the platform launch — not real but stable and shareable.
 */
const PLATFORM_LAUNCH = new Date('2024-01-01T00:00:00Z').getTime();
function currentDropNumber(): number {
  const weeks = Math.floor((Date.now() - PLATFORM_LAUNCH) / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, weeks);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now';
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
}

function nextDropAt(): Date {
  // Drops Tuesdays + Fridays at 10:00 local time.
  const now = new Date();
  const candidates = [2, 5].flatMap((dow) => {
    const d = new Date(now);
    const offset = (dow - now.getDay() + 7) % 7;
    d.setDate(now.getDate() + offset);
    d.setHours(10, 0, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
    return [d];
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

export function NewArrivalsPageClient() {
  // Pull a generous window of newest products and filter client-side
  // by createdAt. Avoids needing a new API filter for now.
  const { data, isLoading, isError, error, refetch } = useProducts({
    sort: 'newest',
    limit: 60,
  });

  const newArrivals = useMemo(() => {
    if (!data) return [] as ApiProduct[];
    const cutoff = Date.now() - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
    // ApiProduct may not include createdAt today — fall back to "all
    // returned items are new" so the page always has content.
    return data.items.filter((p) => {
      const created = (p as { createdAt?: string }).createdAt;
      if (!created) return true;
      return new Date(created).getTime() >= cutoff;
    });
  }, [data]);

  // Group by origin country.
  const byCountry = useMemo(() => {
    const map = new Map<CountryCode, ApiProduct[]>();
    for (const p of newArrivals) {
      const code = (p.origin ?? 'NG') as CountryCode;
      if (!COUNTRIES[code]) continue;
      const arr = map.get(code) ?? [];
      arr.push(p);
      map.set(code, arr);
    }
    return map;
  }, [newArrivals]);

  const orderedCountries = useMemo(
    () =>
      Array.from(byCountry.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([code]) => code),
    [byCountry],
  );

  const activeIso2Set = useMemo(
    () => new Set<string>(orderedCountries),
    [orderedCountries],
  );

  // selectedCountry drives the map's regional-tint highlight + glow.
  // comingSoon shows the inline "be notified" panel under the map.
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    undefined,
  );
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  function handleCountrySelect(
    countryName: string,
    iso2: string,
    isOnPlatform: boolean,
  ) {
    setSelectedCountry(countryName);
    if (isOnPlatform) {
      // Country has products — clear any "coming soon" panel and scroll
      // to its chapter.
      setComingSoon(null);
      const id = `country-${iso2}`;
      const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // No products yet — surface the inline coming-soon panel.
      setComingSoon(countryName);
    }
  }

  const dropNo = useMemo(currentDropNumber, []);

  const [countdown, setCountdown] = useState(() =>
    formatCountdown(nextDropAt().getTime() - Date.now()),
  );
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(formatCountdown(nextDropAt().getTime() - Date.now()));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const total = newArrivals.length;
  const countriesCount = orderedCountries.length;

  return (
    <>
      <main className="bg-page pb-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-navy">
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">New Arrivals</span>
            </li>
          </ol>
        </nav>

        {/* Hero — Africa map + drop banner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-page via-page to-white">
          <div className="mx-auto grid max-w-site grid-cols-1 gap-8 px-4 pb-10 pt-4 md:grid-cols-12 md:gap-10 md:pb-16 md:pt-6">
            {/* Left column — copy + counter + drop banner */}
            <div className="flex flex-col gap-6 md:col-span-7 md:gap-8">
              <div className="flex flex-col gap-3">
                <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                  <Sparkles size={12} aria-hidden /> Just landed from Africa
                </p>
                <h1 className="font-raleway text-4xl font-bold leading-[1.05] text-navy md:text-6xl">
                  This week&rsquo;s
                  <br />
                  arrivals.
                </h1>
                <p className="max-w-xl font-sans text-base leading-relaxed text-charcoal md:text-lg">
                  Hand-picked drops from makers across the continent. Curated, captioned, and shipped from where it&rsquo;s made.
                </p>
              </div>

              {/* Counter pills */}
              <div className="flex flex-wrap gap-3">
                <Stat label="new this week" value={String(total)} />
                <Stat label="countries shipping" value={String(countriesCount)} />
                <Stat label="curators on duty" value="6" />
              </div>

              {/* Drop banner */}
              <div className="overflow-hidden rounded-card border border-navy/10 bg-navy text-white shadow-card">
                <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-3">
                  <div className="bg-navy px-5 py-4">
                    <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                      Drop
                    </span>
                    <p className="mt-1 font-raleway text-3xl font-extrabold leading-none text-white md:text-4xl">
                      #{dropNo}
                    </p>
                    <p className="mt-1 font-sans text-[11px] text-white/70">
                      Tuesdays &amp; Fridays · 10:00 WAT
                    </p>
                  </div>
                  <div className="bg-navy px-5 py-4">
                    <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                      Next drop in
                    </span>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-white md:text-3xl">
                      {countdown}
                    </p>
                  </div>
                  <div className="flex items-center bg-amber px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                        Don&rsquo;t miss it
                      </span>
                      <Link
                        href="#subscribe"
                        className="mt-1 inline-flex items-center gap-1 font-raleway text-sm font-bold uppercase tracking-btn text-navy"
                      >
                        Get drop alerts <ArrowRight size={14} aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — Africa map (sandboxed: if it throws, the
                rest of the page keeps rendering — see SafeBoundary).
                Negative margin pulls only the map up toward the header
                without affecting the left column's copy alignment. */}
            <div className="md:col-span-5 md:-mt-12 lg:-mt-16">
              <SafeBoundary name="new-arrivals:africa-map">
                <AfricaMap
                  activeIso2={activeIso2Set}
                  selectedCountry={selectedCountry}
                  onCountrySelect={handleCountrySelect}
                />
                {comingSoon ? (
                  <ComingSoonPanel
                    countryName={comingSoon}
                    onDismiss={() => setComingSoon(null)}
                  />
                ) : (
                  <p className="mt-2 text-center font-sans text-[11px] text-muted">
                    Tap a country to jump to its arrivals — or to be notified
                    when it launches.
                  </p>
                )}
              </SafeBoundary>
            </div>
          </div>
        </section>

        {/* Editor-pinned new arrivals (overrides the 30-day window) */}
        <SafeBoundary name="new-arrivals:editors-pin">
          <div className="mx-auto max-w-site px-4 pt-4 md:pt-8">
            <PlacementShelf
              placement="new_arrivals_pin"
              title="Editors&rsquo; pin"
              subtitle="Hand-picked highlights from across the continent."
              delivery="Pinned"
            />
          </div>
        </SafeBoundary>

        {/* Country chapters */}
        <div className="mx-auto grid max-w-site grid-cols-1 gap-6 px-4 py-8 md:grid-cols-12 md:gap-8 md:py-10">
          {/* Sticky jump nav (desktop) */}
          <aside className="hidden md:col-span-3 md:block">
            <nav className="sticky top-6 flex flex-col gap-1 rounded-card border border-border bg-white p-3 shadow-card">
              <p className="px-2 pb-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                Browse by country
              </p>
              {orderedCountries.length === 0 && (
                <p className="px-2 font-sans text-xs text-muted">
                  Loading…
                </p>
              )}
              {orderedCountries.map((code) => {
                const c = COUNTRIES[code];
                const count = byCountry.get(code)?.length ?? 0;
                return (
                  <a
                    key={code}
                    href={`#country-${code}`}
                    className="flex items-center justify-between gap-2 rounded px-2 py-1.5 font-sans text-sm text-charcoal hover:bg-page hover:text-navy"
                  >
                    <span className="flex items-center gap-2">
                      <Flag code={c.code} title={c.name} size="sm" />
                      <span>{c.name}</span>
                    </span>
                    <span className="font-mono text-[11px] text-muted">{count}</span>
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Chapters */}
          <div className="flex flex-col gap-12 md:col-span-9 md:gap-16">
            {isLoading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
                <ProductGridSkeleton count={8} />
              </div>
            )}
            {isError && (
              <ProductGridError
                message={error instanceof Error ? error.message : undefined}
                onRetry={() => refetch()}
              />
            )}
            {!isLoading && !isError && orderedCountries.length === 0 && (
              <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                <p className="font-raleway text-lg font-bold text-navy">
                  No new arrivals just yet
                </p>
                <p className="mt-1 font-sans text-sm text-muted">
                  Check back on the next drop — Tuesdays and Fridays at 10:00 WAT.
                </p>
              </div>
            )}
            {!isLoading &&
              orderedCountries.map((code) => (
                <SafeBoundary
                  key={code}
                  name={`new-arrivals:chapter:${code}`}
                  fallback={null}
                >
                  <CountryChapter
                    code={code}
                    products={byCountry.get(code) ?? []}
                  />
                </SafeBoundary>
              ))}
          </div>
        </div>

        {/* Subscribe to drop */}
        <section id="subscribe" className="mx-auto max-w-site px-4 py-10">
          <div className="overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy to-[#1d2f70] p-1 shadow-card">
            <div className="rounded-[10px] bg-navy/95 px-6 py-10 text-center md:px-14 md:py-14">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                <Bell size={12} aria-hidden /> Drop alerts
              </span>
              <h2 className="mt-3 font-raleway text-2xl font-bold leading-tight text-white md:text-4xl">
                Be first to the next drop.
              </h2>
              <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-white/80 md:text-base">
                We&rsquo;ll email you 30 minutes before each drop with a sneak
                peek of what&rsquo;s landing. Unsubscribe any time.
              </p>
              <SubscribeForm />
            </div>
          </div>
        </section>

        <TrustBarSection />
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start rounded-card border border-border bg-white px-4 py-2 shadow-sm">
      <span className="font-raleway text-2xl font-bold leading-none text-navy md:text-3xl">
        {value}
      </span>
      <span className="font-sans text-[11px] text-muted md:text-xs">{label}</span>
    </div>
  );
}

function CountryChapter({ code, products }: { code: CountryCode; products: ApiProduct[] }) {
  const c = COUNTRIES[code];
  const blurb = COUNTRY_BLURBS[code];
  return (
    <section
      id={`country-${code}`}
      className="scroll-mt-24"
    >
      <header className="mb-4 flex flex-col gap-1 border-b border-border pb-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="flex items-baseline gap-3">
          <Flag code={c.code} title={c.name} size="lg" className="!h-7 !w-auto rounded-md md:!h-9" />
          <div className="flex flex-col leading-tight">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
              From
            </span>
            <h2 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              {c.name}
            </h2>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 md:items-end">
          <span className="font-raleway text-sm font-bold text-navy md:text-base">
            {products.length} new this week
          </span>
          <Link
            href={`/shop/country/${c.slug}`}
            className="inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:text-amber md:text-xs"
          >
            See all from {c.name} <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </header>

      {blurb && (
        <p className="mb-4 max-w-2xl font-serif text-sm italic leading-relaxed text-charcoal md:text-base">
          “{blurb}”
        </p>
      )}

      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[68%] shrink-0 snap-start px-1 sm:w-[44%] md:w-[32%] lg:w-[26%]"
          >
            <ApiProductCard product={p} delivery="New" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // We don't have a dedicated newsletter endpoint yet — store the
      // intent in localStorage so the page is functional today; later
      // wire to /api/notifications/subscribe or a Mailchimp webhook.
      const list = JSON.parse(
        window.localStorage.getItem('azm.dropAlerts') ?? '[]',
      ) as string[];
      if (!list.includes(email)) list.push(email);
      window.localStorage.setItem('azm.dropAlerts', JSON.stringify(list));
      setDone(true);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Could not subscribe');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="mx-auto mt-6 max-w-md rounded-card bg-amber/10 px-4 py-3 font-sans text-sm text-amber">
        You&rsquo;re on the list. See you on the next drop.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-input border border-white/30 bg-white/10 px-4 py-3 font-sans text-sm text-white placeholder:text-white/50 focus:border-amber focus:outline-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-btn bg-amber px-5 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy shadow-card hover:bg-white disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Notify me'}
      </button>
      {error && (
        <p className="font-sans text-xs text-amber">{error}</p>
      )}
    </form>
  );
}

/**
 * Inline panel under the Africa map. Surfaced when a visitor clicks a
 * country that doesn't yet have products on Afrizonemart. Lets them
 * leave their email so we can notify them when products from that
 * country land. Drops the email into the same `azm.dropAlerts`
 * localStorage list used by the SubscribeForm above so a later
 * marketing-list-export wires both intents into one outbound flow.
 */
function ComingSoonPanel({
  countryName,
  onDismiss,
}: {
  countryName: string;
  onDismiss: () => void;
}) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const list = JSON.parse(
        window.localStorage.getItem('azm.dropAlerts') ?? '[]',
      ) as Array<{ email: string; country?: string }>;
      list.push({ email, country: countryName });
      window.localStorage.setItem('azm.dropAlerts', JSON.stringify(list));
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mt-3 overflow-hidden rounded-card border border-amber/40 bg-amber/5 px-4 py-3 shadow-card">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-full p-1 text-muted hover:bg-amber/10 hover:text-charcoal"
      >
        <X size={14} aria-hidden />
      </button>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber/20">
          <Sparkles size={14} className="text-amber" aria-hidden />
        </span>
        <p className="font-raleway text-sm font-bold leading-tight text-navy">
          {countryName} — coming soon
        </p>
      </div>
      {done ? (
        <p className="mt-2 flex items-center gap-1.5 font-sans text-xs text-success">
          <Check size={14} aria-hidden />
          You&apos;re on the list. We&apos;ll email when products from{' '}
          {countryName} arrive.
        </p>
      ) : (
        <>
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-charcoal">
            Be first to know when products from {countryName} land on Afrizonemart.
          </p>
          <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-input border border-border bg-white px-3 py-2 font-sans text-xs text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-btn bg-navy px-4 py-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Notify me'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
