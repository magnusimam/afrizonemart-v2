'use client';

import { Check } from 'lucide-react';
import { SUPPLIER_STAGES } from './stages';

/**
 * 10-stage horizontal progress indicator for the supplier journey.
 * Renders a labelled segment per stage; completed stages show a check
 * mark, the current stage glows amber, future stages are muted.
 *
 * Used at the top of every supplier-side page so the supplier always
 * sees where they are in the onboarding pipeline. The labels collapse
 * to numbers on mobile to fit; full names show on md+.
 */

interface Props {
  /// 1-indexed; stages < currentStage are "completed", == is "current",
  /// > is "future". Defaults to 1 so a brand-new supplier sees the
  /// pipeline correctly even before any data flows.
  currentStage?: number;
}

export function SupplierStageProgressBar({ currentStage = 1 }: Props) {
  return (
    <nav
      aria-label="Supplier journey progress"
      className="overflow-x-auto rounded-card border border-border bg-white p-3 shadow-card"
    >
      <ol className="flex min-w-max items-center gap-2">
        {SUPPLIER_STAGES.map((s, i) => {
          const completed = s.number < currentStage;
          const current = s.number === currentStage;
          return (
            <li key={s.number} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-raleway text-[11px] font-bold ${
                    completed
                      ? 'bg-success text-white'
                      : current
                        ? 'bg-amber text-navy ring-2 ring-amber/40'
                        : 'bg-page text-muted'
                  }`}
                  aria-label={`Stage ${s.number} ${current ? 'current' : completed ? 'completed' : 'upcoming'}`}
                >
                  {completed ? <Check size={14} aria-hidden /> : s.number}
                </span>
                <span
                  className={`whitespace-nowrap font-raleway text-[10px] font-semibold uppercase tracking-btn ${
                    current ? 'text-navy' : 'text-muted'
                  }`}
                >
                  <span className="md:hidden">{s.short}</span>
                  <span className="hidden md:inline">{s.long}</span>
                </span>
              </div>
              {/* Connector line between segments. Last item has no connector. */}
              {i < SUPPLIER_STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={`h-px w-6 ${completed ? 'bg-success' : 'bg-border'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
