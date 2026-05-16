const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface FxSnapshot {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
}

/** Fallback used only if the API is unreachable on first paint.
 *  Mirrors the server-side FALLBACK in afrizonemart-api/src/modules/fx/service.ts. */
const FALLBACK: FxSnapshot = {
  base: 'NGN',
  rates: {
    NGN: 1,
    USD: 0.00065, EUR: 0.0006, GBP: 0.00051, CAD: 0.00089, AUD: 0.00099,
    AOA: 0.59, BIF: 1.9,  BWP: 0.0087, CDF: 1.8,   CVE: 0.066,
    DJF: 0.115, DZD: 0.087, EGP: 0.032, ERN: 0.0098, ETB: 0.075,
    GHS: 0.0098, GMD: 0.045, GNF: 5.6,  KES: 0.084, KMF: 0.295,
    LRD: 0.123, LSL: 0.012, LYD: 0.0031, MAD: 0.0064, MGA: 2.95,
    MRU: 0.026, MUR: 0.030, MWK: 1.13, MZN: 0.042, NAD: 0.012,
    RWF: 0.87,  SCR: 0.0094, SDG: 0.39, SLE: 0.015, SOS: 0.37,
    SSP: 2.85,  STN: 0.015, SZL: 0.012, TND: 0.002, TZS: 1.7,
    UGX: 2.4,   XAF: 0.39,  XOF: 0.39, ZAR: 0.012, ZMW: 0.016,
  },
  fetchedAt: '2026-04-26T00:00:00.000Z',
};

export async function fetchFxRates(): Promise<FxSnapshot> {
  try {
    const res = await fetch(`${API_BASE}/api/fx/rates`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK;
    return (await res.json()) as FxSnapshot;
  } catch {
    return FALLBACK;
  }
}
