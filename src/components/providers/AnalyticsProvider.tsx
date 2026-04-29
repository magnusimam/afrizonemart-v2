'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * PostHog provider — initialises once, then tracks page views as the
 * URL changes. Activates only when NEXT_PUBLIC_POSTHOG_KEY is set.
 *
 * Custom events fired elsewhere in the app:
 *   posthog.capture('add_to_cart', { productId, value })
 *   posthog.capture('purchase', { orderId, value, currency })
 *   posthog.capture('signup', { method: 'email' | 'google' | 'phone' })
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let initialised = false;
function init() {
  if (initialised || !KEY || typeof window === 'undefined') return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // we handle this ourselves so SPA navs are tracked
    capture_pageleave: true,
  });
  initialised = true;
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    init();
    if (!KEY) return;
    const url = searchParams && searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}

/**
 * Convenience helper for tracking conversion events. Safe to call even
 * when PostHog isn't configured — becomes a no-op.
 */
export function trackEvent(event: string, props?: Record<string, unknown>): void {
  if (!KEY || typeof window === 'undefined') return;
  posthog.capture(event, props);
}

/**
 * Identify the current user once they're known (post sign-in / sign-up).
 * Wires future events to that user's profile in PostHog.
 */
export function identifyUser(
  id: string,
  traits?: Record<string, unknown>,
): void {
  if (!KEY || typeof window === 'undefined') return;
  posthog.identify(id, traits);
}
