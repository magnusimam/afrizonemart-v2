import { CheckCircle2, Sparkles } from 'lucide-react';
import type { PIQGuidance } from '@/lib/supplier/piq-config';

/**
 * Per-question guidance (example + how-to + why-it-matters) from the AZM
 * PIQ guideline. Presentation-only and intentionally compact — the form
 * engine decides *when* to reveal it (collapsed by default behind a "How
 * to answer" toggle); this just keeps it light and scannable.
 */
export function PIQGuidancePanel({ guidance }: { guidance: PIQGuidance }) {
  const hasHowTo = !!guidance.howTo && guidance.howTo.length > 0;

  return (
    <div className="rounded-input border border-amber/30 bg-amber-light/40 p-3.5">
      {guidance.example && (
        <div>
          <p className="flex items-center gap-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber-dark">
            <Sparkles size={12} aria-hidden /> Example
          </p>
          <p className="mt-1 font-sans text-xs italic leading-relaxed text-charcoal">
            “{guidance.example}”
          </p>
        </div>
      )}

      {hasHowTo && (
        <div className={guidance.example ? 'mt-3' : ''}>
          <p className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
            How to answer
          </p>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {guidance.howTo!.map((tip, i) => (
              <li
                key={i}
                className="flex gap-1.5 font-sans text-xs leading-relaxed text-charcoal"
              >
                <CheckCircle2 size={12} aria-hidden className="mt-0.5 shrink-0 text-amber-dark" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {guidance.why && (
        <p
          className={`font-sans text-[11px] leading-relaxed text-muted ${
            guidance.example || hasHowTo ? 'mt-3 border-t border-amber/20 pt-2.5' : ''
          }`}
        >
          <span className="font-semibold text-charcoal">Why it matters: </span>
          {guidance.why}
        </p>
      )}
    </div>
  );
}
