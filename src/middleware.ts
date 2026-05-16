import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge middleware — geo + locale detection.
 *
 * Vercel auto-injects `x-vercel-ip-country` (ISO-3166 alpha-2) on every
 * request when deployed. In dev / non-Vercel environments it's missing,
 * so we fall back to 'NG' so the storefront still renders.
 *
 * We persist the visitor's country + currency choice in cookies so
 * subsequent requests don't hit the geo lookup again, and so that
 * client-side React can read them via document.cookie via the
 * `useGeo()` hook.
 *
 * Currency mapping is intentionally narrow — we only show prices in
 * currencies the FX module has rates for AND that map cleanly to a
 * country's primary currency. Anywhere else falls through to NGN
 * so the customer sees the canonical price.
 */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // --- Non-Africa fallbacks for diaspora traffic ---
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR',
  IE: 'EUR', PT: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR',

  // --- All 54 African nations (kept in sync with src/lib/countries.ts) ---
  DZ: 'DZD', AO: 'AOA', BJ: 'XOF', BW: 'BWP', BF: 'XOF', BI: 'BIF',
  CV: 'CVE', CM: 'XAF', CF: 'XAF', TD: 'XAF', KM: 'KMF', CG: 'XAF',
  CD: 'CDF', CI: 'XOF', DJ: 'DJF', EG: 'EGP', GQ: 'XAF', ER: 'ERN',
  SZ: 'SZL', ET: 'ETB', GA: 'XAF', GM: 'GMD', GH: 'GHS', GN: 'GNF',
  GW: 'XOF', KE: 'KES', LS: 'LSL', LR: 'LRD', LY: 'LYD', MG: 'MGA',
  MW: 'MWK', ML: 'XOF', MR: 'MRU', MU: 'MUR', MA: 'MAD', MZ: 'MZN',
  NA: 'NAD', NE: 'XOF', NG: 'NGN', RW: 'RWF', ST: 'STN', SN: 'XOF',
  SC: 'SCR', SL: 'SLE', SO: 'SOS', ZA: 'ZAR', SS: 'SSP', SD: 'SDG',
  TZ: 'TZS', TG: 'XOF', TN: 'TND', UG: 'UGX', ZM: 'ZMW', ZW: 'USD',
};

const COUNTRY_COOKIE = 'azm_country';
const CURRENCY_COOKIE = 'azm_currency';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Honour an explicit user choice — if they already picked a currency
  // via the header dropdown, never overwrite it from geo.
  const existingCurrency = req.cookies.get(CURRENCY_COOKIE)?.value;

  const country =
    req.headers.get('x-vercel-ip-country')?.toUpperCase() ||
    req.cookies.get(COUNTRY_COOKIE)?.value ||
    'NG';

  res.cookies.set(COUNTRY_COOKIE, country, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  });

  if (!existingCurrency) {
    const currency = COUNTRY_TO_CURRENCY[country] ?? 'NGN';
    res.cookies.set(CURRENCY_COOKIE, currency, {
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      path: '/',
    });
  }

  // Expose the resolved values as request headers so server components
  // downstream can read them via next/headers without parsing cookies.
  res.headers.set('x-azm-country', country);
  res.headers.set(
    'x-azm-currency',
    existingCurrency ?? COUNTRY_TO_CURRENCY[country] ?? 'NGN',
  );

  return res;
}

// Run on every page + API route except Next internals + static files.
export const config = {
  matcher: ['/((?!_next/|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)'],
};
