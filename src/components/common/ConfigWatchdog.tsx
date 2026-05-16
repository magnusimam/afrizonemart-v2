'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  diffPublicEnv,
  readPublicEnvSnapshot,
  type MissingEnvReport,
} from '@/lib/public-env';

/**
 * 2026-05-16 bugfix — config watchdog banner.
 *
 * Mounts in the root layout. On first render reads every registered
 * `NEXT_PUBLIC_*` env var; if any required one is missing or empty,
 * shows a loud banner at the top of the page so the next person who
 * hits the site notices in <1 second instead of debugging silent
 * fetch-to-localhost / hidden-button mysteries.
 *
 * Hidden in normal production once configured. Dismiss-able per
 * session for the (rare) case where staff are aware and don't want
 * the banner cluttering their view. Sentry breadcrumb on first render
 * so we get one alert even if the banner is hidden by ad blockers.
 */
export function ConfigWatchdog() {
  const [report, setReport] = useState<MissingEnvReport | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const snapshot = readPublicEnvSnapshot();
    const diff = diffPublicEnv(snapshot);
    if (
      diff.required.length > 0 ||
      diff.optional.length > 0 ||
      diff.corrupted.length > 0
    ) {
      setReport(diff);
      // Sentry breadcrumb if available — lazy import so this doesn't
      // pull Sentry into pages that don't need it (memory:
      // feedback_no_eager_sentry_in_client_components).
      if (diff.required.length > 0 || diff.corrupted.length > 0) {
        void (async () => {
          try {
            const Sentry = await import('@sentry/nextjs');
            const missingPart =
              diff.required.length > 0
                ? `missing: ${diff.required.map((s) => s.key).join(', ')}`
                : '';
            const corruptedPart =
              diff.corrupted.length > 0
                ? `corrupted: ${diff.corrupted.map((c) => c.spec.key).join(', ')}`
                : '';
            Sentry.captureMessage(
              `Public env config issue — ${[missingPart, corruptedPart].filter(Boolean).join('; ')}`,
              'warning',
            );
          } catch {
            /* Sentry not installed — fine */
          }
        })();
      }
    }
    // Per-session dismissal so the banner doesn't reappear on every
    // route navigation after staff acknowledges it.
    try {
      if (sessionStorage.getItem('config-watchdog-dismissed') === '1') {
        setDismissed(true);
      }
    } catch {
      /* SSR / private mode — fine */
    }
  }, []);

  if (!report || dismissed) return null;
  if (
    report.required.length === 0 &&
    report.optional.length === 0 &&
    report.corrupted.length === 0
  )
    return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('config-watchdog-dismissed', '1');
    } catch {
      /* SSR / private mode — fine */
    }
  };

  const hasCritical = report.required.length > 0 || report.corrupted.length > 0;

  return (
    <div
      role={hasCritical ? 'alert' : 'status'}
      className={`fixed bottom-4 right-4 z-[9999] max-w-md rounded-card border-2 p-4 shadow-card-hover ${
        hasCritical
          ? 'border-danger bg-danger/5 text-danger'
          : 'border-amber bg-amber/5 text-charcoal'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} aria-hidden />
          <p className="font-raleway text-sm font-bold uppercase tracking-btn">
            {hasCritical ? 'Configuration issue' : 'Optional config note'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="rounded p-1 text-current hover:bg-current/10"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      {report.required.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5 font-sans text-xs leading-snug">
          <p className="font-semibold">
            Set these on Vercel and redeploy:
          </p>
          {report.required.map((spec) => (
            <div key={spec.key} className="rounded bg-white/60 p-2">
              <code className="font-mono text-[11px] font-bold">{spec.key}</code>
              <p className="mt-0.5">{spec.affects}</p>
            </div>
          ))}
        </div>
      )}
      {report.corrupted.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5 font-sans text-xs leading-snug">
          <p className="font-semibold">
            These vars have stray whitespace — re-set them WITHOUT a
            trailing newline:
          </p>
          {report.corrupted.map(({ spec, rawLength, trimmedLength }) => (
            <div key={spec.key} className="rounded bg-white/60 p-2">
              <code className="font-mono text-[11px] font-bold">{spec.key}</code>
              <p className="mt-0.5">
                {spec.affects}{' '}
                <span className="font-mono text-[10px] opacity-70">
                  ({rawLength - trimmedLength} stray char
                  {rawLength - trimmedLength === 1 ? '' : 's'})
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
      {report.optional.length > 0 && (
        <details className="font-sans text-xs">
          <summary className="cursor-pointer font-semibold">
            {report.optional.length} optional var
            {report.optional.length === 1 ? '' : 's'} also missing
          </summary>
          <div className="mt-1.5 flex flex-col gap-1">
            {report.optional.map((spec) => (
              <div key={spec.key}>
                <code className="font-mono text-[10px]">{spec.key}</code>{' '}
                <span className="text-muted">— {spec.affects}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
