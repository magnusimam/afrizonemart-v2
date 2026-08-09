'use client';

import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Clock,
  Headset,
  Package,
  Pencil,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { PIQStatusBadge, type PIQStatus } from '@/components/supplier/piq/PIQStatusBadge';
import { useSupplierPIQs } from '@/lib/api/supplier-hooks';
import type { SupplierPIQ } from '@/lib/api/supplier';
import { SUPPLIER_SUPPORT } from '@/lib/supplier/support';

/** "My PIQs" — Stage 4. One card per product, read live from the API. */

const CTA: Record<PIQStatus, string> = {
  DRAFT: 'Continue',
  SUBMITTED: 'View',
  UNDER_REVIEW: 'View',
  APPROVED: 'View',
  REVISION_REQUIRED: 'Address feedback',
  REJECTED: 'View',
};

const ACCENT: Record<PIQStatus, string> = {
  DRAFT: 'bg-muted',
  SUBMITTED: 'bg-navy',
  UNDER_REVIEW: 'bg-amber',
  APPROVED: 'bg-success',
  REVISION_REQUIRED: 'bg-danger',
  REJECTED: 'bg-danger',
};

export default function MyPIQsPage() {
  const { data: piqs, isLoading } = useSupplierPIQs();
  const list: SupplierPIQ[] = piqs ?? [];

  const counts = {
    total: list.length,
    approved: list.filter((p) => p.status === 'APPROVED').length,
    underReview: list.filter((p) => p.status === 'UNDER_REVIEW' || p.status === 'SUBMITTED').length,
    needsAction: list.filter((p) => p.status === 'DRAFT' || p.status === 'REVISION_REQUIRED').length,
  };

  const stats: { label: string; value: number; icon: LucideIcon; tone: string }[] = [
    { label: 'Products', value: counts.total, icon: Package, tone: 'bg-navy-light text-navy' },
    { label: 'Approved', value: counts.approved, icon: BadgeCheck, tone: 'bg-success/10 text-success' },
    { label: 'In review', value: counts.underReview, icon: Clock, tone: 'bg-amber-light text-amber-dark' },
    { label: 'Needs action', value: counts.needsAction, icon: Pencil, tone: 'bg-page text-muted' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-raleway text-2xl font-extrabold text-navy md:text-3xl">My PIQs</h1>
          <p className="mt-1 max-w-xl font-sans text-sm text-muted">
            Complete a Product Information Questionnaire for each product — one form per product.
          </p>
        </div>
        <Link
          href="/supplier/piqs/new/edit"
          className="inline-flex shrink-0 items-center gap-2 rounded-btn bg-amber px-5 py-2.5 font-raleway text-sm font-bold tracking-btn text-navy shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-amber-dark hover:text-white"
        >
          <Plus size={16} aria-hidden /> Add new product PIQ
        </Link>
      </div>

      {/* Stats strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-card border border-border bg-white p-4 shadow-card">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card ${s.tone}`}>
              <s.icon size={19} aria-hidden />
            </span>
            <div>
              <p className="font-raleway text-2xl font-extrabold leading-none text-navy">
                {isLoading ? '–' : s.value}
              </p>
              <p className="mt-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Product cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isLoading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-card border border-border bg-white shadow-card" />
            ))
          : list.map((piq) => (
              <Link
                key={piq.id}
                href={`/supplier/piqs/${piq.id}/edit`}
                className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy/20 hover:shadow-xl"
              >
                <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${ACCENT[piq.status]}`} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-light to-page text-navy transition-transform duration-300 group-hover:scale-110">
                      <Package size={20} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-raleway text-base font-bold text-navy">{piq.name}</h2>
                      <p className="font-sans text-xs text-muted">{piq.category ?? piq.brand ?? '—'}</p>
                    </div>
                  </div>
                  <PIQStatusBadge status={piq.status} />
                </div>

                {piq.status === 'REVISION_REQUIRED' && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-input bg-[#FDEDEC] px-2.5 py-1.5 font-raleway text-xs font-semibold text-danger">
                    <AlertCircle size={13} aria-hidden /> Changes requested
                  </p>
                )}

                <div className="mt-5">
                  <div className="flex items-center justify-between font-sans text-xs">
                    <span className="text-muted">Completion</span>
                    <span className="font-raleway font-bold text-navy">{piq.completion}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-page">
                    <div className={`h-full rounded-full transition-all duration-500 ${ACCENT[piq.status]}`} style={{ width: `${piq.completion}%` }} />
                  </div>
                </div>

                <span className="mt-5 inline-flex items-center gap-1.5 font-raleway text-sm font-bold text-navy transition-colors group-hover:text-amber-dark">
                  {CTA[piq.status]}
                  <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            ))}

        {/* Add-new card */}
        <Link
          href="/supplier/piqs/new/edit"
          className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border bg-white/50 p-5 text-center transition-all duration-300 hover:border-amber hover:bg-amber-light/30"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-light text-amber-dark transition-transform duration-300 group-hover:scale-110 group-hover:bg-amber group-hover:text-navy">
            <Plus size={24} aria-hidden />
          </span>
          <span className="font-raleway text-sm font-bold text-navy">
            {list.length === 0 && !isLoading ? 'Add your first product' : 'Add another product'}
          </span>
          <span className="font-sans text-xs text-muted">One PIQ per product you want us to buy.</span>
        </Link>
      </div>

      {/* Support banner */}
      <div className="mt-8 flex flex-col items-start gap-4 overflow-hidden rounded-card bg-gradient-to-br from-amber-light to-white p-6 shadow-card ring-1 ring-amber/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark text-navy shadow-md">
            <Headset size={22} aria-hidden />
          </span>
          <div>
            <p className="font-raleway text-base font-bold text-navy">Stuck on a question?</p>
            <p className="mt-0.5 font-sans text-sm text-charcoal">
              Our {SUPPLIER_SUPPORT.desk} can help with any PIQ — {SUPPLIER_SUPPORT.hours}.
            </p>
          </div>
        </div>
        <Link
          href="/supplier/support"
          className="inline-flex shrink-0 items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark"
        >
          <Headset size={15} aria-hidden /> Get support
        </Link>
      </div>
    </div>
  );
}
