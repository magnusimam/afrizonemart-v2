'use client';

import { useEffect } from 'react';
import { getOrCreateSessionId } from '@/lib/analyticsSession';
import { recordProductView } from '@/lib/api/views';

/**
 * Drop-in PDP dwell tracker. Renders nothing; fires `POST /api/views`
 * after the user has been on the page for 2 seconds.
 *
 * Why 2s? Less than that is accidental tab-switching / bounce noise.
 * More than that misses legitimate scanners. The server soft-dedups
 * per (sessionId, productId) for 5 minutes, so a user who refreshes
 * the same product doesn't double-log.
 *
 * AbortController cancels the request if the component unmounts
 * mid-fetch (e.g. user navigates to a different product). The timer
 * itself clears before the request is even queued if the user leaves
 * within the 2s window.
 *
 * SSR-safe: `getOrCreateSessionId()` returns null on the server, so
 * the effect is a no-op until hydration. Honest-claims: no tracking
 * happens server-side and no cookies are set — the session id lives
 * in localStorage only.
 */
export interface ViewTrackerProps {
  productSlug: string;
}

export function ViewTracker({ productSlug }: ViewTrackerProps) {
  useEffect(() => {
    if (!productSlug) return;
    let cancelled = false;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      if (cancelled) return;
      const sessionId = getOrCreateSessionId();
      if (!sessionId) return; // SSR or localStorage blocked
      void recordProductView(productSlug, sessionId, ctrl.signal);
    }, 2000);
    return () => {
      cancelled = true;
      clearTimeout(t);
      ctrl.abort();
    };
  }, [productSlug]);

  return null;
}
