'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { useWrapReveal } from '@/stores/wrapStatusStore';

/**
 * One-time reveal modal — pops the first time a user lands on the site
 * after their wrap goes live, then never again (localStorage per year).
 * Mounted site-wide in the root layout.
 */
export function WrapLoginPopup() {
  const { ready, year } = useWrapReveal();
  const [open, setOpen] = useState(false);

  const storageKey = year ? `wrap-popup-seen-${year}` : null;

  useEffect(() => {
    if (!ready || !storageKey) return;
    if (window.localStorage.getItem(storageKey) !== '1') setOpen(true);
  }, [ready, storageKey]);

  if (!open || !year) return null;

  const close = () => {
    if (storageKey) window.localStorage.setItem(storageKey, '1');
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl p-8 text-center text-white shadow-2xl"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, #131388 0%, #000066 60%, #00003D 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={18} aria-hidden />
        </button>
        <Sparkles size={36} className="text-amber" aria-hidden />
        <h2 className="font-raleway text-2xl font-extrabold">
          Your {year} Wrap is ready
        </h2>
        <p className="font-sans text-sm text-white/80">
          A year of African makers, care packages and cultural moments —
          wrapped up just for you.
        </p>
        <Link
          href={`/wrapped/${year}`}
          onClick={close}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-amber px-7 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-transform hover:scale-105"
        >
          Unwrap it
        </Link>
        <button
          type="button"
          onClick={close}
          className="font-sans text-xs text-white/60 underline-offset-2 hover:underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
