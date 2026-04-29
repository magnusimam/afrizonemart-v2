'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

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
    Sentry.withScope((scope) => {
      scope.setTag('boundary', this.props.name);
      scope.setContext('react', {
        componentStack: info.componentStack,
      });
      Sentry.captureException(error);
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
