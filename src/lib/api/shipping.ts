const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ShippingRate {
  id: string;
  name: string;
  priceAmount: number;
  freeAboveAmount: number | null;
  isDefault: boolean;
}

export interface ShippingRatesResult {
  zoneId: string | null;
  zoneName: string | null;
  rates: ShippingRate[];
}

export async function fetchShippingRates(country: string): Promise<ShippingRatesResult> {
  const res = await fetch(
    `${API_BASE}/api/shipping/rates?country=${encodeURIComponent(country.toUpperCase())}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    throw new Error(`Failed to load shipping rates (${res.status})`);
  }
  return (await res.json()) as ShippingRatesResult;
}

export function effectiveShippingPrice(rate: ShippingRate, subtotal: number): number {
  if (rate.freeAboveAmount != null && subtotal >= rate.freeAboveAmount) return 0;
  return rate.priceAmount;
}

// =================================================================
// Phase 11 — Shipping quotes (weight + zone-aware)
// =================================================================

export interface ShippingQuoteDestination {
  country: string;
  city?: string;
  state?: string;
  postcode?: string;
  addressLine?: string;
}

export interface ShippingQuoteCartItem {
  productId: string;
  qty: number;
}

export interface ShippingQuote {
  /// Provider key — 'manual', 'gig', etc. Stored on the order.
  provider: string;
  /// Provider-side rate id (manual returns a ShippingRate.id; carrier
  /// quotes may return null).
  rateId: string | null;
  label: string;
  amountNgn: number;
  etaDaysMin: number;
  etaDaysMax: number;
  reason?: string;
}

export interface ShippingQuotesResult {
  quotes: ShippingQuote[];
  weightKg: number;
  subtotalNgn: number;
}

/// POST /api/shipping/quote — returns the merged list of quote
/// options for a cart. Used at checkout to render Standard / Express /
/// carrier-tier options side by side.
export async function fetchShippingQuotes(
  destination: ShippingQuoteDestination,
  items: ShippingQuoteCartItem[],
): Promise<ShippingQuotesResult> {
  const res = await fetch(`${API_BASE}/api/shipping/quote`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination, items }),
  });
  if (!res.ok) {
    throw new Error(`Failed to load shipping quotes (${res.status})`);
  }
  return (await res.json()) as ShippingQuotesResult;
}
