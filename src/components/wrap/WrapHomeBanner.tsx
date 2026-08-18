'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, X } from 'lucide-react';
import { useWrapReveal } from '@/stores/wrapStatusStore';

/**
 * Homepage reveal banner — the "it's here!" moment on Dec 1.
 * Dismissible per year (localStorage). Hidden until the wrap is live.
 */
export function WrapHomeBanner() {
  const { ready, year } = useWrapReveal();
  const [dismissed, setDismissed] = useState(true);

  const storageKey = year ? `wrap-banner-dismissed-${year}` : null;

  useEffect(() => {
    if (!ready || !storageKey) return;
    setDismissed(window.localStorage.getItem(storageKey) === '1');
  }, [ready, storageKey]);

  if (!ready || !year || dismissed) return null;

  const dismiss = () => {
    if (storageKey) window.localStorage.setItem(storageKey, '1');
    setDismissed(true);
  };

  return (
    <div
      className="relative flex items-center justify-center gap-3 px-4 py-2.5 text-white"
      style={{
        background:
          'linear-gradient(90deg, #000066 0%, #281580 55%, #FBAC34 140%)',
      }}
    >
      <Gift size={18} className="shrink-0 text-amber" aria-hidden />
      <p className="text-center font-raleway text-xs font-bold uppercase tracking-btn sm:text-sm">
        Your {year} Afrizonemart Wrap is here
      </p>
      <Link
        href={`/wrapped/${year}`}
        className="shrink-0 rounded-full bg-amber px-4 py-1 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-transform hover:scale-105"
      >
        View now
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
