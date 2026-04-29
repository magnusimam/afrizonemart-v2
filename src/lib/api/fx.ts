const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface FxSnapshot {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
}

/** Fallback used only if the API is unreachable on first paint. */
const FALLBACK: FxSnapshot = {
  base: 'NGN',
  rates: {
    NGN: 1,
    USD: 0.00065,
    EUR: 0.0006,
    GBP: 0.00051,
    KES: 0.084,
    GHS: 0.0098,
    ZAR: 0.012,
    XAF: 0.39,
    XOF: 0.39,
    UGX: 2.4,
    TZS: 1.7,
    EGP: 0.032,
    CAD: 0.00089,
    AUD: 0.00099,
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
