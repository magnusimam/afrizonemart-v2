'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/// Why no top-level `import * as Sentry from '@sentry/nextjs'`:
///
/// `@sentry/nextjs`'s server entry has a transitive `require()` into
/// an ESM-only OpenTelemetry module via `@prisma/instrumentation`. Any
/// Server Component that reaches a SafeBoundary in its tree (e.g. the
/// product detail page wrapping `<ProductInfo>` in a boundary) makes
/// Next.js's SSR pass walk that import chain, which throws
/// `ERR_REQUIRE_ESM` and 500s the entire route. Confirmed in
/// production 2026-05-08 — every `/product/<slug>` page started 500'ing
/// after the deploy that touched any boundary-related code. **Never
/// re-add a top-level Sentry import here.** Keep it lazy and inside
/// `componentDidCatch` (client-only path) so the boundary's render +
/// fallback never depends on Sentry being load-able.

interface SafeBoundaryProps {
  /** Telemetry tag — shows up in Sentry as `boundary:<name>` so you can
   *  see which section is failing in production. */
  name: string;
  /** What to render when the wrapped tree throws. Defaults to `null`
   *  — the section just disappears, the rest of the page renders fine.
   *  For content sections (not decoration), pass a small fallback like
   *  `<p>Couldn't load this section</p>`. */
  fallback?: ReactNode;
  /** Optional callback for telemetry beyond Sentry (e.g., PostHog). */
  onError?: (err: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface SafeBoundaryState {
  hasError: boolean;
}

/**
 * Section-level fault isolation.
 *
 * Wrap any non-critical UI block in a <SafeBoundary> so a throw inside
 * it can't crash its siblings or the rest of the page. Pair with
 * route-level `error.tsx` files (which catch route-level throws) and
 * data-level `isError` handling (which catches expected fetch failures
 * before they propagate).
 *
 * Why class-based: React error boundaries MUST be class components.
 * `react-error-boundary` would also work but adds a dep — this is ~30
 * lines, no dep, and integrates Sentry directly.
 */
export class SafeBoundary extends Component<SafeBoundaryProps, SafeBoundaryState> {
  state: SafeBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SafeBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Lazy-load Sentry. componentDidCatch only fires client-side
    // (errors during SSR bubble to the framework error.tsx, not here),
    // so the dynamic import resolves cleanly via webpack's chunk
    // splitting and bypasses the SSR ESM/CJS-resolution issue. If
    // Sentry fails to load for any reason we still call onError, log
    // in dev, and let the boundary render its fallback — Sentry
    // capture is a side effect, not the boundary's job.
    void import('@sentry/nextjs')
      .then(({ withScope, captureException }) => {
        withScope((scope) => {
          scope.setTag('boundary', this.props.name);
          scope.setContext('react', {
            componentStack: info.componentStack,
          });
          captureException(error);
        });
      })
      .catch(() => {
        // Silent fall-through. Better to lose one Sentry report than
        // to crash the boundary that was meant to keep us alive.
      });
    this.props.onError?.(error, info);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`[SafeBoundary:${this.props.name}]`, error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
