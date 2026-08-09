import Link from 'next/link';
import { Check, Lock } from 'lucide-react';
import { SUPPLIER_STAGES, SUPPLIER_MAX_STAGE, stageHref } from '@/lib/supplier/stages';

/**
 * Horizontal 10-step tracker showing where a supplier is in the journey.
 * Sits at the top of each stage page so the supplier always sees their
 * position and can jump between stages.
 *
 * Design: a single continuous rail runs behind the nodes; the travelled
 * portion is a green gradient (matching the dashboard journey map). Each
 * node is a status pill — done (green + ✓), current (amber, larger,
 * pulsing), or locked (white + 🔒). On small screens the rail scrolls
 * horizontally so the nodes keep a comfortable tap target.
 */
export function SupplierStageProgressBar({
  currentStage,
}: {
  currentStage: number;
}) {
  const stagesDone = Math.max(0, currentStage - 1);
  const pct = Math.round((stagesDone / SUPPLIER_MAX_STAGE) * 100);
  // Fraction of the rail that should read as "travelled" — sits the green
  // fill at the centre of the current node.
  const lastIndex = SUPPLIER_STAGES.length - 1;
  const currentIndex = Math.min(
    lastIndex,
    Math.max(0, currentStage - 1),
  );
  const fillPct = (currentIndex / lastIndex) * 100;

  return (
    <div className="flex flex-col gap-3">
      {/* heading row */}
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
          Your progress
        </p>
        <p className="font-raleway text-[11px] font-bold text-navy">
          {pct}%{' '}
          <span className="font-semibold text-muted">
            · {stagesDone}/{SUPPLIER_MAX_STAGE} stages
          </span>
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-2 pt-5">
        <div className="relative min-w-[640px] px-6">
          {/* rail — base track + green travelled fill, centred on the nodes */}
          <div
            aria-hidden
            className="absolute left-6 right-6 top-[19px] h-1.5 -translate-y-1/2 rounded-full bg-border"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1A6B2E] to-[#2FA152] transition-[width] duration-700 ease-out"
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <ol className="relative flex items-start justify-between gap-0">
            {SUPPLIER_STAGES.map((s) => {
              const done = s.stage < currentStage;
              const active = s.stage === currentStage;
              const locked = !done && !active;
              const Wrapper = locked ? 'div' : Link;
              const wrapperProps = locked ? { 'aria-disabled': true as const } : { href: stageHref(s.stage) };
              return (
                <li key={s.stage} className="flex flex-1 justify-center">
                  <Wrapper
                    {...(wrapperProps as { href: string })}
                    title={s.summary}
                    aria-label={`Stage ${s.stage}: ${s.name}${
                      done ? ' — completed' : active ? ' — in progress' : ' — locked'
                    }`}
                    className={`group flex flex-col items-center text-center outline-none ${locked ? 'cursor-not-allowed' : ''}`}
                  >
                    <span className="relative block">
                      <span
                        className={`flex items-center justify-center rounded-full font-raleway font-bold shadow-card ring-offset-2 ring-offset-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-navy ${
                          active
                            ? 'h-11 w-11 bg-gradient-to-br from-amber to-amber-dark text-navy ring-4 ring-amber/30'
                            : 'h-9 w-9'
                        } ${
                          done
                            ? 'bg-gradient-to-br from-[#2FA152] to-success text-white ring-2 ring-success/25'
                            : active
                              ? ''
                              : 'bg-white text-muted ring-1 ring-border group-hover:text-navy group-hover:ring-navy'
                        }`}
                      >
                        {done ? (
                          <Check size={16} strokeWidth={3} aria-hidden />
                        ) : (
                          <span className="text-sm">{s.stage}</span>
                        )}
                      </span>

                      {/* current: pulsing halo */}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-0 animate-ping rounded-full ring-2 ring-amber/60 motion-reduce:hidden"
                        />
                      )}

                      {/* locked: lock chip */}
                      {!done && !active && (
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-muted ring-1 ring-border transition-colors group-hover:text-navy"
                        >
                          <Lock size={9} aria-hidden />
                        </span>
                      )}
                    </span>

                    <span
                      className={`mt-2.5 w-[72px] font-raleway text-[11px] leading-tight transition-colors ${
                        active
                          ? 'font-bold text-navy'
                          : done
                            ? 'font-semibold text-charcoal group-hover:text-navy'
                            : 'text-muted group-hover:text-navy'
                      }`}
                    >
                      {s.name}
                    </span>
                  </Wrapper>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
