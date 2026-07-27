'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ChevronRight,
  Clapperboard,
  Clock,
  FileSpreadsheet,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { SupplierJourneyMap } from '@/components/supplier/SupplierJourneyMap';
import { CountUp } from '@/components/supplier/CountUp';
import { useSupplierMe, useSupplierPIQs } from '@/lib/api/supplier-hooks';
import { getStage, stageHref, SUPPLIER_MAX_STAGE } from '@/lib/supplier/stages';
import { SUPPLIER_SUPPORT, VOLTRON_SERVICES } from '@/lib/supplier/support';

/**
 * Supplier dashboard — live read. Hero + KPI strip + journey map + right
 * rail, all driven by GET /api/suppliers/me and /me/piqs.
 */

const VOLTRON_ICONS: Record<string, LucideIcon> = {
  Scale, Receipt, ShieldCheck, Boxes, BadgeCheck, Clapperboard,
};
const ACTIVITY_TONES: Record<string, string> = {
  success: 'bg-success/10 text-success',
  amber: 'bg-amber-light text-amber-dark',
  navy: 'bg-navy-light text-navy',
  muted: 'bg-page text-muted',
};

export default function SupplierDashboardPage() {
  const { data: profile, isLoading } = useSupplierMe();
  const { data: piqs } = useSupplierPIQs();
  const list = piqs ?? [];

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="h-40 animate-pulse rounded-card bg-white shadow-card" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-card bg-white shadow-card" />
          ))}
        </div>
      </div>
    );
  }

  const currentStage = profile.currentStage;
  const stage = getStage(currentStage);
  const stagesDone = Math.max(0, currentStage - 1);
  const pct = Math.round((stagesDone / SUPPLIER_MAX_STAGE) * 100);

  const counts = {
    total: list.length,
    approved: list.filter((p) => p.status === 'APPROVED').length,
    underReview: list.filter((p) => p.status === 'UNDER_REVIEW' || p.status === 'SUBMITTED').length,
  };

  const companyInitials = profile.companyName
    .split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

  const RING_R = 34;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C * (1 - pct / 100);

  const kpis: { label: string; num: number; suffix?: string; sub: string; icon: LucideIcon; tone: string }[] = [
    { label: 'Current stage', num: currentStage, suffix: `/${SUPPLIER_MAX_STAGE}`, sub: stage?.name ?? '', icon: MapPin, tone: 'bg-amber-light text-amber-dark' },
    { label: 'PIQs approved', num: counts.approved, sub: `${counts.total} submitted`, icon: BadgeCheck, tone: 'bg-success/10 text-success' },
    { label: 'In review', num: counts.underReview, sub: 'awaiting AZM', icon: Clock, tone: 'bg-navy-light text-navy' },
    { label: 'Journey complete', num: pct, suffix: '%', sub: `${stagesDone} of ${SUPPLIER_MAX_STAGE} stages`, icon: TrendingUp, tone: 'bg-pink-light text-pink-dark' },
  ];

  // Derive a small activity feed from the live products.
  const activity: { icon: LucideIcon; tone: string; text: string }[] = [
    ...list.filter((p) => p.status === 'APPROVED').slice(0, 2).map((p) => ({
      icon: BadgeCheck, tone: 'success', text: `PIQ for “${p.name}” was approved`,
    })),
    ...list.filter((p) => p.status === 'UNDER_REVIEW' || p.status === 'SUBMITTED').slice(0, 3).map((p) => ({
      icon: FileSpreadsheet, tone: 'amber', text: `PIQ for “${p.name}” submitted for review`,
    })),
  ].slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy to-[#0a1942] p-6 text-white shadow-card md:p-8">
        <span aria-hidden className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber/20 blur-3xl" />
        <span aria-hidden className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-pink/20 blur-3xl" />
        <span aria-hidden className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark font-raleway text-xl font-extrabold text-navy shadow-lg ring-4 ring-white/10">
              {companyInitials}
            </span>
            <div>
              <p className="font-raleway text-[11px] font-bold uppercase tracking-[0.2em] text-amber">Supplier dashboard</p>
              <h1 className="mt-0.5 font-raleway text-2xl font-extrabold leading-tight text-white md:text-3xl">
                Welcome back, {profile.companyName}
              </h1>
              <p className="mt-1.5 max-w-md font-sans text-sm leading-relaxed text-white/75">
                You’re in Stage {currentStage} — {stage?.name}. Here’s your journey at a glance.
              </p>
              <Link
                href={stageHref(currentStage)}
                className="group/cta mt-4 inline-flex items-center gap-2 rounded-btn bg-amber px-4 py-2.5 font-raleway text-sm font-bold tracking-btn text-navy shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-white"
              >
                Continue your journey
                <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover/cta:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 self-center md:self-auto">
            <div className="relative h-[88px] w-[88px]">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="40" cy="40" r={RING_R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle cx="40" cy="40" r={RING_R} fill="none" stroke="#FBAC34" strokeWidth="8" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={ringOffset} />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-raleway text-lg font-extrabold leading-none text-white">{pct}%</span>
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="font-raleway text-sm font-bold text-white">Journey progress</p>
              <p className="font-sans text-xs text-white/70">{stagesDone} of {SUPPLIER_MAX_STAGE} stages done</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="group relative flex items-start justify-between gap-3 overflow-hidden rounded-card border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy/20 hover:shadow-xl">
            <div className="min-w-0">
              <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{kpi.label}</p>
              <p className="mt-1 font-raleway text-2xl font-extrabold text-navy">
                <CountUp value={kpi.num} suffix={kpi.suffix} />
              </p>
              <p className="mt-0.5 truncate font-sans text-xs text-muted">{kpi.sub}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card transition-transform duration-300 group-hover:scale-110 ${kpi.tone}`}>
              <kpi.icon size={20} aria-hidden />
            </span>
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-navy to-amber transition-transform duration-300 group-hover:scale-x-100" />
          </div>
        ))}
      </section>

      {/* Main */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-card border border-border bg-gradient-to-b from-white to-page p-5 shadow-card md:p-7 lg:col-span-2">
          <div className="mb-2">
            <h2 className="font-raleway text-xl font-bold text-navy">Your journey to global markets</h2>
            <p className="mt-1 font-sans text-sm text-muted">From first contact to live trade — tap a stop to open it.</p>
          </div>
          <div className="mt-6">
            <SupplierJourneyMap currentStage={currentStage} />
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          {/* Next step */}
          <div className="rounded-card border border-amber/40 bg-gradient-to-br from-amber-light to-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
              Next step · Stage {currentStage}
            </span>
            <h3 className="mt-3 font-raleway text-lg font-bold text-navy">{stage?.name}</h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-charcoal">{stage?.summary}</p>
            <Link
              href={stageHref(currentStage)}
              className="group/cta mt-4 inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-2.5 font-raleway text-sm font-bold tracking-btn text-white shadow-card transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark hover:shadow-lg"
            >
              {currentStage === 4 ? 'Go to My PIQs' : `Open Stage ${currentStage}`}
              <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover/cta:translate-x-1" />
            </Link>
            <p className="mt-3 inline-flex items-center gap-1.5 font-raleway text-xs font-semibold text-success">
              <BadgeCheck size={14} aria-hidden /> {counts.approved} approved · {counts.underReview} in review
            </p>
          </div>

          {/* Recent activity */}
          <div className="rounded-card border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="font-raleway text-sm font-bold uppercase tracking-btn text-navy">Recent activity</h3>
            {activity.length === 0 ? (
              <p className="mt-4 font-sans text-sm text-muted">No recent activity yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-1">
                {activity.map((item, i) => (
                  <li key={i} className="-mx-2 flex gap-3 rounded-input px-2 py-2 transition-colors hover:bg-page">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ACTIVITY_TONES[item.tone] ?? ACTIVITY_TONES.muted}`}>
                      <item.icon size={15} aria-hidden />
                    </span>
                    <p className="font-sans text-sm leading-snug text-charcoal">{item.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Support / Voltron */}
          <div className="rounded-card border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="font-raleway text-sm font-bold uppercase tracking-btn text-navy">We’re with you</h3>
            <p className="mt-1 font-sans text-xs text-muted">{SUPPLIER_SUPPORT.desk} · {SUPPLIER_SUPPORT.hours}</p>
            <div className="mt-3 flex flex-col gap-2">
              <a href={SUPPLIER_SUPPORT.hotlineHref} className="inline-flex items-center gap-2 font-raleway text-sm font-bold text-navy hover:text-amber-dark">
                <Phone size={15} aria-hidden /> {SUPPLIER_SUPPORT.hotline}
              </a>
              <a href={SUPPLIER_SUPPORT.emailHref} className="inline-flex items-center gap-2 font-sans text-xs text-muted hover:text-navy">
                <Mail size={13} aria-hidden /> {SUPPLIER_SUPPORT.email}
              </a>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Project Voltron support</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {VOLTRON_SERVICES.slice(0, 3).map((svc) => {
                  const Icon = VOLTRON_ICONS[svc.icon] ?? ShieldCheck;
                  return (
                    <li key={svc.title} className="-mx-2 flex items-center gap-2.5 rounded-input px-2 py-1.5 transition-colors hover:bg-amber-light/50">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-card bg-amber-light text-amber-dark">
                        <Icon size={15} aria-hidden />
                      </span>
                      <span className="font-sans text-sm text-charcoal">{svc.title}</span>
                    </li>
                  );
                })}
              </ul>
              <Link href="/supplier/support" className="group/link mt-4 inline-flex items-center gap-1 font-raleway text-sm font-semibold text-navy hover:text-amber-dark">
                View all support
                <ChevronRight size={15} aria-hidden className="transition-transform duration-200 group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
