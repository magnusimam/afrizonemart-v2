'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { SupplierStageProgressBar } from '@/components/supplier/SupplierStageProgressBar';
import { PIQ_STAGE_NUMBER, SUPPLIER_STAGES } from '@/components/supplier/stages';
import { supplierGetMe, type SupplierMe } from '@/lib/api/supplier';

/// Supplier dashboard. Surfaces: where they are in the 9-stage
/// pipeline + the next thing they need to do for that stage.
export default function SupplierDashboardPage() {
  const [me, setMe] = useState<SupplierMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supplierGetMe()
      .then(setMe)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load profile'));
  }, []);

  const currentStage = me?.currentStage ?? 1;
  const companyOrName = me?.companyName?.trim() || me?.name?.trim() || 'there';
  const stageDef = SUPPLIER_STAGES.find((s) => s.number === currentStage);
  const isAtPIQ = currentStage === PIQ_STAGE_NUMBER;

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Supplier Dashboard
          </p>
          <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            Welcome, {companyOrName}
          </h1>
          <p className="mt-1 font-sans text-sm text-muted">
            Track your onboarding progress towards your first purchase order from Afrizonemart.
          </p>
          {error && (
            <p className="mt-2 rounded-input border border-danger/30 bg-danger/10 px-3 py-1.5 font-sans text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      </header>

      {/* 10-stage journey strip */}
      <section className="mb-6">
        <SupplierStageProgressBar currentStage={currentStage} />
      </section>

      {/* Next-step card — copy depends on which stage they're at. PIQ is
          the only stage with a built UI today; all other stages get a
          placeholder pointing at the AZM Sourcing Unit until those flows
          land. */}
      <section className="mb-6 rounded-card border border-amber/40 bg-amber/10 p-5 shadow-card">
        <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
          Stage {currentStage} · {stageDef?.long ?? 'Up next'}
        </p>
        {isAtPIQ ? (
          <>
            <h2 className="mt-1 font-raleway text-lg font-bold text-navy">
              Complete a Product Information Questionnaire (PIQ) for each product
            </h2>
            <p className="mt-1 font-sans text-sm text-charcoal">
              Each product you want us to buy needs its own PIQ — pricing, MOQ,
              lead time, regulatory docs. Submit at least one and our
              Merchandise Sourcing Unit will review. Once approved, you advance
              to the next stage.
            </p>
            <Link
              href="/supplier/piqs"
              className="mt-3 inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
            >
              Start a new PIQ <ArrowRight size={14} aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <h2 className="mt-1 font-raleway text-lg font-bold text-navy">
              {stageDef?.long ?? 'Continue your application'}
            </h2>
            <p className="mt-1 font-sans text-sm text-charcoal">
              Our Merchandise Sourcing Unit will reach out by email with the
              next steps for this stage. You can always email{' '}
              <a
                href="mailto:suppliers@afrizonemart.com"
                className="font-bold text-navy underline hover:text-amber"
              >
                suppliers@afrizonemart.com
              </a>{' '}
              with questions in the meantime.
            </p>
          </>
        )}
      </section>

      {/* At-a-glance tiles */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile
          label="Products you're submitting"
          value="—"
          hint="Drafts awaiting your input"
          href="/supplier/piqs"
        />
        <Tile
          label="With AZM for review"
          value="—"
          hint="Sourcing Unit is reviewing"
          href="/supplier/piqs"
        />
        <Tile
          label="Approved for procurement"
          value="—"
          hint="Eligible for purchase orders"
          href="/supplier/piqs"
        />
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-card border border-border bg-white p-5 shadow-card transition hover:border-amber"
    >
      <header className="flex items-center justify-between gap-3">
        <span className="font-raleway text-xs font-semibold uppercase tracking-btn text-muted">
          {label}
        </span>
        <Package size={16} className="text-navy group-hover:text-amber" aria-hidden />
      </header>
      <span className="font-raleway text-3xl font-bold leading-none text-navy">
        {value}
      </span>
      <span className="font-sans text-[11px] text-muted">{hint}</span>
    </Link>
  );
}
