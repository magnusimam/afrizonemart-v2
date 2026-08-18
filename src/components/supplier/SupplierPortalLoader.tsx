'use client';

import { useEffect, useState } from 'react';

/**
 * The wait every supplier sees immediately after signing in.
 *
 * `RequireSupplier` blocks on four things — store hydration, a token refresh,
 * auth, and the /me fetch — and it used to hold the screen with one line of
 * grey text. That is the portal's first impression, and on a slow connection
 * an unchanging line reads as a page that has stopped working.
 *
 * So this does two jobs. The mark moves, which says the app is alive. And the
 * captions name the ten stages in order, which turns dead time into the one
 * thing a new supplier most needs: an idea of what the journey ahead actually
 * is. They advance on a timer rather than tracking real progress — claiming
 * false precision about what has loaded would be worse than saying nothing.
 */
const STAGES = [
  'Discovery',
  'Expression of Interest',
  'Registration & Profiling',
  'Product Questionnaire',
  'Orientation',
  'Product Audit',
  'Partnership',
  'Activation & Listing',
  'Trade Engagement',
  'Continuous Engagement',
];

export function SupplierPortalLoader({
  label = 'Loading your portal',
}: {
  label?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    // Slow enough to read, and it stops at the last stage rather than looping:
    // a caption cycling for a third time would advertise that something is
    // wrong more loudly than it reassures.
    const t = setInterval(() => {
      setI((n) => (n + 1 < STAGES.length ? n + 1 : n));
    }, 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-page px-6"
    >
      {/* Two counter-rotating arcs around a steady core. Built from borders so
          it costs no SVG and no image request on a first paint. */}
      <div className="relative h-16 w-16" aria-hidden>
        <span className="absolute inset-0 animate-[azm-spin_1.1s_linear_infinite] rounded-full border-[3px] border-navy/10 border-t-navy" />
        <span className="absolute inset-[7px] animate-[azm-spin-reverse_1.5s_linear_infinite] rounded-full border-[3px] border-amber/20 border-b-amber" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-2.5 w-2.5 animate-[azm-pulse_1.6s_ease-in-out_infinite] rounded-full bg-pink" />
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-raleway text-sm font-bold uppercase tracking-btn text-navy">
          {label}
        </p>

        <p
          key={i}
          className="animate-[azm-fade_0.5s_ease-out] font-sans text-sm text-muted"
        >
          Stage {i + 1} · {STAGES[i]}
        </p>

        {/* Ten ticks, one per stage — a quiet map of the journey rather than a
            progress bar, which would be a lie about how much has loaded. */}
        <div className="mt-1 flex items-center gap-1.5">
          {STAGES.map((s, n) => (
            <span
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                n <= i ? 'w-5 bg-amber' : 'w-2 bg-navy/15'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keyframes live here rather than in the Tailwind config: they are used
          by this component alone, and animation names are global. Reduced
          motion drops the spin and keeps the content legible. */}
      <style jsx global>{`
        @keyframes azm-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes azm-spin-reverse {
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes azm-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(0.75);
          }
        }
        @keyframes azm-fade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[azm-spin_1\\.1s_linear_infinite\\],
          .animate-\\[azm-spin-reverse_1\\.5s_linear_infinite\\],
          .animate-\\[azm-pulse_1\\.6s_ease-in-out_infinite\\],
          .animate-\\[azm-fade_0\\.5s_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default SupplierPortalLoader;
