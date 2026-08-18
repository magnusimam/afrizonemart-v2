'use client';

import Link from 'next/link';
import { ChevronRight, Gift } from 'lucide-react';
import { useWrapReveal } from '@/stores/wrapStatusStore';

/**
 * Permanent re-entry point in the account dashboard. Appears once the
 * wrap is live so customers can revisit it any time after the reveal.
 */
export function WrapDashboardCard() {
  const { ready, year } = useWrapReveal();
  if (!ready || !year) return null;

  return (
    <Link
      href={`/wrapped/${year}`}
      className="group flex items-center gap-4 rounded-2xl p-5 text-white shadow-card transition-transform hover:scale-[1.01]"
      style={{
        background:
          'linear-gradient(110deg, #000066 0%, #281580 60%, #FBAC34 150%)',
      }}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Gift size={22} className="text-amber" aria-hidden />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="font-raleway text-base font-extrabold">
          Your {year} Afrizonemart Wrap
        </span>
        <span className="font-sans text-xs text-white/80">
          Your year in review — tap to relive it.
        </span>
      </span>
      <ChevronRight
        size={20}
        className="shrink-0 text-white/70 transition-transform group-hover:translate-x-1"
        aria-hidden
      />
    </Link>
  );
}
