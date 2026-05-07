import type { ApiProduct } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Phase 10.8 — Shelves storefront client.
 *
 * `GET /api/shelves/:key` returns the container config (title/rows/cols/
 * enabled) and the products pinned to that key, in admin-curated order,
 * scoped to the requested country if provided.
 */

export interface ShelfConfig {
  key: string;
  title: string;
  subtitle: string | null;
  rows: number;
  cols: number;
  enabled: boolean;
}

export interface ShelfReadResult {
  shelf: ShelfConfig;
  items: ApiProduct[];
}

export async function fetchShelf(
  key: string,
  country?: string,
): Promise<ShelfReadResult> {
  const sp = new URLSearchParams();
  if (country) sp.set('country', country);
  const qs = sp.toString();
  const url = `${API_BASE}/api/shelves/${encodeURIComponent(key)}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load shelf ${key}: ${res.status}`);
  }
  return (await res.json()) as ShelfReadResult;
}
