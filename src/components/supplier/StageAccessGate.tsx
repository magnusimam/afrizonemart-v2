'use client';

import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { useSupplierMe } from '@/lib/api/supplier-hooks';
import { getStage, isStageUnlocked, stageHref } from '@/lib/supplier/stages';

/**
 * Blocks a stage body the supplier hasn't reached yet.
 *
 * The journey is strictly sequential: a supplier may open any stage up to
 * and including their `currentStage`, never beyond. Without this, a URL
 * jump (`/supplier/stages/7`) would let someone sign the partnership
 * agreement or submit listing photos before their audit is done.
 */
export function StageAccessGate({ stage, children }: { stage: number; children: React.ReactNode }) {
  const { isLoading, data: profile } = useSupplierMe();

  if (isLoading || !profile) {
    return <div className="h-64 animate-pulse rounded-card bg-white shadow-card" />;
  }

  if (!isStageUnlocked(stage, profile.currentStage)) {
    const current = getStage(profile.currentStage);
    return (
      <div className="rounded-card border border-border bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-page text-muted">
          <Lock size={24} aria-hidden />
        </span>
        <h2 className="mt-4 font-raleway text-lg font-bold text-navy">
          This stage isn’t open yet
        </h2>
        <p className="mx-auto mt-2 max-w-md font-sans text-sm leading-relaxed text-charcoal">
          You’re currently at Stage {profile.currentStage} — {current?.name}. Each
          stage unlocks once the one before it is complete, so finish your
          current step and this one will open automatically.
        </p>
        <Link
          href={stageHref(profile.currentStage)}
          className="mt-6 inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-sm font-bold tracking-btn text-white transition-colors hover:bg-navy-dark"
        >
          Go to Stage {profile.currentStage}
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
