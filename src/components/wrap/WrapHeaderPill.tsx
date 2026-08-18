'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useWrapReveal } from '@/stores/wrapStatusStore';

/**
 * Persistent "My Wrap" pill in the header nav. Renders nothing until
 * the viewer's wrap is live (Dec 1 drop), then stays as a quiet
 * re-entry point.
 */
export function WrapHeaderPill() {
  const { ready, year } = useWrapReveal();
  if (!ready || !year) return null;

  return (
    <Link
      href={`/wrapped/${year}`}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber px-4 py-1 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-transform hover:scale-105 md:text-sm"
    >
      <Sparkles size={13} aria-hidden /> My Wrap
    </Link>
  );
}
