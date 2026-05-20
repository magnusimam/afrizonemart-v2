'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFlag } from '@/lib/useFlag';

/**
 * Customer-facing degradation banner.
 *
 * Polls the API health endpoint at a long interval and surfaces a
 * banner when the API is unreachable for two consecutive checks
 * (kills false positives from a single dropped packet). The banner
 * itself reassures rather than alarms — the storefront's product
 * pages keep serving last-known-good data from Vercel's fetch cache
 * during a brief Railway outage, but cart/checkout actions WILL
 * fail, so we want the customer to know what they can and can't do.
 *
 * Polling cadence:
 *  - Healthy: every 120s. Cheap, just enough to notice an outage
 *    within ~4 minutes.
 *  - Degraded: every 30s. Reduces the recovery-detection window so
 *    the banner clears quickly once Railway comes back.
 *  - Document hidden: paused entirely. No point burning CPU + an
 *    API hit on a tab nobody's looking at.
 *
 * Render guards:
 *  - `useFlag('api_status_banner', true)` is the admin kill-switch.
 *    Flip to OFF if the banner ever creates noise during a planned
 *    deploy.
 *  - The banner is sticky-below the header (the existing header is
 *    already z-40 sticky), so it doesn't fight any other fixed UI.
 *  - prefers-reduced-motion users see the same banner without the
 *    slide-down enter animation.
 *
 * Why this lives outside the product-fetch path: detecting outage
 * from individual fetch failures would either need a global error
 * bus (over-engineered) or wrappers on every API client (heavy).
 * A standalone health probe is dirt simple and reliable.
 */

const POLL_HEALTHY_MS = 120_000;
const POLL_DEGRADED_MS = 30_000;
const FAIL_THRESHOLD_BEFORE_BANNER = 2;
const HEALTH_PATH = '/api/health';

export function ApiStatusBanner() {
  const enabled = useFlag('api_status_banner', true);
  if (!enabled) return null;
  return <ApiStatusBannerInner />;
}

function ApiStatusBannerInner() {
  /// `degraded` drives the visible UI. `consecutiveFails` is the
  /// underlying counter; we only flip `degraded` to true once it
  /// reaches the threshold so a single packet loss doesn't flash a
  /// banner at the customer.
  const [degraded, setDegraded] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let consecutiveFails = 0;

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    if (!apiBase) {
      /// No API URL configured — likely build-time fallback. Don't
      /// poll; the rest of the storefront has its own watchdog.
      return;
    }

    const schedule = (ms: number) => {
      timer = setTimeout(check, ms);
    };

    const check = async () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.hidden) {
        /// Tab in background — skip but keep the loop alive so we
        /// re-check when it comes back. Re-checks every 60s while
        /// hidden so the banner is accurate on tab return.
        schedule(60_000);
        return;
      }
      try {
        const res = await fetch(`${apiBase}${HEALTH_PATH}`, {
          cache: 'no-store',
          // Short signal — health checks shouldn't hang the loop.
          signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json().catch(() => null)) as
          | { status?: string; database?: string }
          | null;
        if (body?.status !== 'ok' || body?.database !== 'up') {
          throw new Error('health body unhealthy');
        }
        /// Recovery path.
        if (consecutiveFails > 0 || degraded) {
          consecutiveFails = 0;
          if (degraded) {
            /// Show a brief green "back online" toast for 5s before
            /// hiding the banner entirely — gives the customer a
            /// confirmation moment instead of a silent disappearance.
            setRecovering(true);
            setTimeout(() => {
              if (cancelled) return;
              setDegraded(false);
              setRecovering(false);
            }, 5_000);
          }
        }
        schedule(POLL_HEALTHY_MS);
      } catch {
        consecutiveFails += 1;
        if (consecutiveFails >= FAIL_THRESHOLD_BEFORE_BANNER && !degraded) {
          setDegraded(true);
          setRecovering(false);
        }
        schedule(POLL_DEGRADED_MS);
      }
    };

    /// Initial check after a small delay so we don't compete with
    /// the page's own LCP work. 4s is long enough that meaningful
    /// content has painted; short enough that an outage during
    /// first-load is still surfaced quickly.
    timer = setTimeout(check, 4_000);

    /// Re-check immediately when the tab regains focus — common
    /// case: customer alt-tabbed during an outage, came back to
    /// see if it's resolved.
    const onVisible = () => {
      if (!document.hidden) {
        if (timer) clearTimeout(timer);
        void check();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // `degraded` intentionally NOT in deps — the closure reads it
    // fresh via the setter, and including it would tear down + rebuild
    // the polling loop on every state flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!degraded && !recovering) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full ${
        recovering
          ? 'bg-success text-white'
          : 'bg-amber text-navy'
      }`}
    >
      <div className="mx-auto flex max-w-site items-start gap-3 px-4 py-2.5 md:items-center md:py-2">
        {recovering ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 md:mt-0" aria-hidden />
        ) : (
          <AlertCircle size={18} className="mt-0.5 shrink-0 md:mt-0" aria-hidden />
        )}
        <p className="font-sans text-sm leading-snug">
          {recovering ? (
            <span className="font-semibold">Back online — thanks for your patience.</span>
          ) : (
            <>
              <span className="font-semibold">We&apos;re experiencing a brief slowdown.</span>{' '}
              Browsing still works; your cart is safe. New orders may take a
              moment to confirm — please try again in a minute.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
