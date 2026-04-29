'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useGeo } from '@/components/providers/GeoProvider';

const DISMISSED_COOKIE = 'azm_geo_banner_dismissed';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.split('; ').find((r) => r.startsWith(`${name}=`));
  return m ? m.slice(name.length + 1) : undefined;
}

function dismiss() {
  const expires = new Date(Date.now() + 60 * 86400 * 1000).toUTCString();
  document.cookie = `${DISMISSED_COOKIE}=1; expires=${expires}; path=/; SameSite=Lax`;
}

export function GeoBanner() {
  const { country, currency, setCurrency, ready } = useGeo();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (currency === 'NGN') return; // No conversion happening — no banner.
    if (readCookie(DISMISSED_COOKIE)) return;
    setVisible(true);
  }, [ready, currency]);

  if (!visible) return null;

  return (
    <div className="border-b border-amber/30 bg-amber/15">
      <div className="mx-auto flex max-w-site items-center justify-between gap-3 px-4 py-2 font-sans text-xs text-charcoal md:text-sm">
        <p className="flex-1">
          Showing prices in <strong>{currency}</strong>{' '}
          <span className="text-muted">
            (detected {country}). You&apos;ll be charged in NGN at checkout.
          </span>{' '}
          <button
            type="button"
            onClick={() => {
              setCurrency('NGN');
              dismiss();
              setVisible(false);
            }}
            className="font-semibold text-navy underline underline-offset-2 hover:text-amber"
          >
            Show NGN
          </button>
        </p>
        <button
          type="button"
          onClick={() => {
            dismiss();
            setVisible(false);
          }}
          aria-label="Dismiss"
          className="text-muted hover:text-charcoal"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
