'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number up to `value` (eased). Re-animates when `value` changes
 * (e.g. data arrives after the first render) and always settles exactly on
 * `value` — even under React Strict Mode's mount/cleanup/remount. Honours
 * prefers-reduced-motion.
 */
export function CountUp({
  value,
  suffix = '',
  prefix = '',
  duration = 900,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const target = value;
    const from = fromRef.current;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === from) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        fromRef.current = target; // next animation eases from here
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Settle on the target so a Strict-Mode cleanup never leaves us mid-tween.
      fromRef.current = target;
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
