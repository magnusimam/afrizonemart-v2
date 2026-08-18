'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, BadgeCheck, Boxes, Globe2, Repeat, ShoppingBag, Sparkles } from 'lucide-react';
import { getPerformance } from '@/lib/api/supplier';

/**
 * Stage 10 — Continuous Engagement. A live performance snapshot (drawn from the
 * supplier's audit + trade activity) plus the ongoing development programmes.
 */

const PROGRAMMES = [
  { icon: Repeat, title: 'Periodic audits', body: 'Quarterly / bi-annual re-checks keep your compliance and quality current.' },
  { icon: Award, title: 'Capacity building', body: 'Workshops on quality, packaging, ESG and export readiness.' },
  { icon: Globe2, title: 'CallyValley® access', body: 'Intra-African trade development — new markets across AfCFTA.' },
  { icon: Sparkles, title: 'Joint marketing', body: 'Co-branded campaigns and “It’s Made in Africa” features.' },
];

function money(n: number) {
  return `₦${n.toLocaleString()}`;
}

export function Stage10Continuous() {
  const { data: perf, isLoading } = useQuery({
    queryKey: ['supplier', 'performance'],
    queryFn: getPerformance,
    retry: false,
  });

  if (isLoading || !perf) {
    return <div className="h-48 animate-pulse rounded-card bg-white shadow-card" />;
  }

  const memberSince = new Date(perf.memberSince).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const kpis = [
    { icon: ShoppingBag, label: 'Orders fulfilled', value: String(perf.orders.fulfilled), sub: `${perf.orders.total} total` },
    { icon: BadgeCheck, label: 'Trade value', value: money(perf.orders.valueFulfilled), sub: 'fulfilled' },
    { icon: Boxes, label: 'Listing', value: perf.listingLive ? 'Live' : 'Pending', sub: `${perf.products} product${perf.products === 1 ? '' : 's'}` },
    { icon: Award, label: 'Audit', value: perf.audit?.outcome ?? '—', sub: perf.audit?.score != null ? `${perf.audit.score}/100` : 'not yet' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-card border border-border bg-gradient-to-br from-navy to-[#0a1942] p-6 text-white shadow-card">
        <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">Active supplier · since {memberSince}</p>
        {/* Explicit text-white: the globals.css base layer sets `h1..h6 {
            text-navy }` directly on the element, which beats the `text-white`
            inherited from this navy section — so the heading would otherwise
            render navy-on-navy and be invisible. */}
        <h2 className="mt-1 font-raleway text-2xl font-extrabold text-white">You’re in continuous engagement</h2>
        <p className="mt-1 max-w-lg font-sans text-sm text-white/80">
          You’ve completed onboarding and you’re trading with Afrizonemart. Here’s
          your performance so far — keep it strong to unlock growth programmes.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-card border border-border bg-white p-4 shadow-card">
            <k.icon size={18} aria-hidden className="text-navy" />
            <p className="mt-2 font-raleway text-xl font-extrabold text-navy">{k.value}</p>
            <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{k.label}</p>
            <p className="font-sans text-xs text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      <section className="rounded-card border border-border bg-white p-6 shadow-card">
        <h3 className="font-raleway text-base font-bold text-navy">Development programmes</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROGRAMMES.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-light text-navy">
                <p.icon size={18} aria-hidden />
              </span>
              <div>
                <p className="font-raleway text-sm font-bold text-navy">{p.title}</p>
                <p className="font-sans text-xs leading-relaxed text-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
