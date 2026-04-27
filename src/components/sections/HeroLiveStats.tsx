'use client';

import { useEffect, useState } from 'react';

/**
 * Phase 10 — Special Discounts hero live stats.
 *
 * Three little chips below the hero with a count-up animation on first
 * render so the page feels alive. Numbers are decorative — they nudge
 * urgency without claiming hard inventory truth.
 */
interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

const STATS: Stat[] = [
  { label: 'deals live right now', value: 312 },
  { label: 'maximum off', value: 50, suffix: '%' },
  { label: 'free shipping over', value: 15, prefix: '₦', suffix: 'k' },
];

export function HeroLiveStats() {
  return (
    <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 px-4 md:gap-4">
      {STATS.map((s) => (
        <Counter key={s.label} stat={s} />
      ))}
    </div>
  );
}

function Counter({ stat }: { stat: Stat }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const target = stat.value;
    const durationMs = 900;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      // ease-out-cubic for that satisfying landing
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stat.value]);

  return (
    <div className="flex flex-col items-center gap-0.5 rounded-card border border-border bg-white px-3 py-2 text-center shadow-sm md:px-4 md:py-3">
      <span className="font-raleway text-base font-bold leading-none text-navy md:text-2xl">
        {stat.prefix}
        {n.toLocaleString()}
        {stat.suffix}
      </span>
      <span className="font-sans text-[10px] text-muted md:text-xs">{stat.label}</span>
    </div>
  );
}
