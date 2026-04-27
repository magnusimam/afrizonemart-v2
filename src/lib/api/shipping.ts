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
