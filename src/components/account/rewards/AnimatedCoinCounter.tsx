'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 2026-05-16 — coin balance that counts up from 0 to the current
 * value over ~1.2s when the page mounts. Cheap dopamine — the
 * number is the reward, so making it feel earned each visit keeps
 * the page sticky.
 *
 * Skipped under prefers-reduced-motion; the static number renders
 * immediately.
 *
 * Falls back gracefully on hydration mismatch — initial render is
 * the final number to keep SSR/client output consistent; the
 * count-up only kicks in once useEffect has run.
 */

interface Props {
  value: number;
  durationMs?: number;
  /// Optional class for the wrapping <span>.
  className?: string;
}

export function AnimatedCoinCounter({
  value,
  durationMs = 1200,
  className,
}: Props) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || value <= 0) {
      setDisplay(value);
      return;
    }

    /// Start from 0 each mount. We want the moment-of-arrival
    /// dopamine even on a fast re-visit.
    const start = performance.now();
    setDisplay(0);

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      /// easeOutCubic — fast then settles, feels coin-counter-y.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, durationMs]);

  return <span className={className}>{display.toLocaleString()}</span>;
}
