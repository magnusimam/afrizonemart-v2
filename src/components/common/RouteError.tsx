'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface RouteErrorProps {
  /** Provided by Next.js error.tsx. */
  error: Error & { digest?: string };
  /** Provided by Next.js error.tsx — re-renders the route segment. */
  reset: () => void;
  /** Where the "back to safety" link sends the user. Defaults to `/`. */
  homeHref?: string;
  /** Header copy. Defaults to "Something went wrong." */
  title?: string;
}

/**
 * Shared fallback UI used by every route-level `error.tsx`.
 * Sentry has already captured the error by the time this renders
 * (Next.js + our @sentry/nextjs config wire that automatically).
 */
export function RouteError({
  error,
  reset,
  homeHref = '/',
  title = 'Something went wrong on this page',
}: RouteErrorProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber/15">
        <AlertTriangle size={28} className="text-amber" aria-hidden />
      </div>
      <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md font-sans text-sm text-muted md:text-base">
        We&apos;ve logged the error and our team will look at it. You can try
        reloading this page, or head back to the homepage and continue
        shopping — the rest of the site is unaffected.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy"
        >
          <RotateCcw size={16} aria-hidden />
          Reload page
        </button>
        <Link
          href={homeHref}
          className="flex items-center justify-center rounded-btn border-2 border-navy bg-white px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
