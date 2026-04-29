'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { FxSnapshot } from '@/lib/api/fx';
import { fetchFxRates } from '@/lib/api/fx';

interface GeoState {
  country: string; // ISO-3166 alpha-2, defaults to 'NG'
  currency: string; // ISO-4217, defaults to 'NGN'
  fx: FxSnapshot | null;
  ready: boolean;
  setCurrency: (code: string) => void;
}

const GeoContext = createContext<GeoState | null>(null);

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function writeCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 86400 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

interface GeoProviderProps {
  initialCountry?: string;
  initialCurrency?: string;
  children: ReactNode;
}

export function GeoProvider({ initialCountry, initialCurrency, children }: GeoProviderProps) {
  const [country, setCountry] = useState(initialCountry ?? 'NG');
  const [currency, setCurrencyState] = useState(initialCurrency ?? 'NGN');
  const [fx, setFx] = useState<FxSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate from cookies the edge middleware set, then load FX rates once.
  useEffect(() => {
    const cookieCountry = readCookie('azm_country');
    const cookieCurrency = readCookie('azm_currency');
    if (cookieCountry) setCountry(cookieCountry);
    if (cookieCurrency) setCurrencyState(cookieCurrency);

    let cancelled = false;
    fetchFxRates().then((snap) => {
      if (cancelled) return;
      setFx(snap);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    const upper = code.toUpperCase();
    setCurrencyState(upper);
    writeCookie('azm_currency', upper);
  }, []);

  return (
    <GeoContext.Provider value={{ country, currency, fx, ready, setCurrency }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo(): GeoState {
  const ctx = useContext(GeoContext);
  if (!ctx) {
    // Safe fallback so components don't crash if rendered outside the
    // provider (Storybook, isolated tests, etc).
    return {
      country: 'NG',
      currency: 'NGN',
      fx: null,
      ready: false,
      setCurrency: () => undefined,
    };
  }
  return ctx;
}

/** Convert a NGN amount to the active currency. Returns null if FX
 * isn't ready yet so callers can fall back to NGN. */
export function useConvertFromNgn(amountNgn: number): {
  converted: number | null;
  currency: string;
} {
  const { currency, fx } = useGeo();
  if (currency === 'NGN') return { converted: amountNgn, currency: 'NGN' };
  if (!fx) return { converted: null, currency };
  const rate = fx.rates[currency];
  if (typeof rate !== 'number') return { converted: null, currency };
  return { converted: amountNgn * rate, currency };
}
