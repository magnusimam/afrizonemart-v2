'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * PostHog provider — initialises once, then tracks page views as the
 * URL changes. Activates only when NEXT_PUBLIC_POSTHOG_KEY is set.
 *
 * Custom events fired elsewhere in the app should use the `TRACK`
 * enum + `trackEvent(TRACK.X, props)` so we keep one canonical
 * vocabulary across web + mobile. The mobile copy lives in
 * `afrizonemart-mobile/src/lib/analytics.ts` — KEEP THEM 1:1.
 *
 * **No-PII rule (memory)**: never pass email, name, phone, address,
 * absolute Naira amounts, or raw search query text as event
 * properties. Use coarse buckets (`cartValueBucket`) and product
 * slugs / ids only.
 */

/// Canonical event vocabulary. Single source of truth across both
/// apps — when adding a new event, mirror the change in the mobile
/// copy too.
export const TRACK = {
  APP_OPENED: 'app_opened',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PRODUCT_VIEWED: 'product_viewed',
  SEARCH_PERFORMED: 'search_performed',
  WISHLIST_ADDED: 'wishlist_added',
  WISHLIST_REMOVED: 'wishlist_removed',
  ADD_TO_CART: 'add_to_cart',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_STEP: 'checkout_step',
  ORDER_PLACED: 'order_placed',
  PUSH_OPENED: 'push_opened',
  HANDLED_ERROR: 'handled_error',
} as const;

export type TrackEvent = (typeof TRACK)[keyof typeof TRACK];

/**
 * Coarse cart-value bucket. Same definition as the mobile copy so
 * dashboards group cleanly across both surfaces. NEVER store
 * absolute Naira amounts in PostHog.
 */
export function cartValueBucket(ngnSubtotal: number): string {
  if (ngnSubtotal < 1_000) return '<1k';
  if (ngnSubtotal < 5_000) return '1k-5k';
  if (ngnSubtotal < 10_000) return '5k-10k';
  if (ngnSubtotal < 25_000) return '10k-25k';
  if (ngnSubtotal < 50_000) return '25k-50k';
  if (ngnSubtotal < 100_000) return '50k-100k';
  return '100k+';
}

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
 * Convenience helper for tracking conversion events. Safe to call
 * even when PostHog isn't configured — becomes a no-op.
 *
 * Prefer passing a `TRACK` enum value as the event name so we
 * keep one canonical vocabulary (`trackEvent(TRACK.ADD_TO_CART,
 * ...)`). Accepts a plain string for special cases like
 * `$pageview`.
 */
export function trackEvent(
  event: TrackEvent | string,
  props?: Record<string, unknown>,
): void {
  if (!KEY || typeof window === 'undefined') return;
  posthog.capture(event, props);
}

/**
 * Reset on sign-out so the next anonymous session doesn't get
 * charged to the old identity.
 */
export function resetAnalytics(): void {
  if (!KEY || typeof window === 'undefined') return;
  posthog.reset();
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
