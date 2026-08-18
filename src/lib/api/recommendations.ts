/**
 * Client for the Recommendations & Personalization Phase 0 API
 * (`afrizonemart-api/src/modules/recommendations`, ALGORITHM_SYSTEMS_TRACKER.md).
 *
 * Mirrors `search.ts` — same `no-store` reasoning (a "similar to this
 * product" or "trending" batch is request-specific, not a shared
 * cacheable listing) and the same impression-log-id-for-click-tracking
 * pattern as `queryLogId`.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface RecommendationItem {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  comparePrice: number | null;
  discountPercent: number | null;
  origin: string | null;
  rating: number;
  reviewCount: number;
  images: string[];
  inStock: boolean;
  sellableCountries: string[];
  category: { id: string; slug: string | null; name: string | null } | null;
  createdAt: string;
}

export interface RecommendationResponse {
  module: 'similar' | 'trending' | 'also-bought' | 'frequently-bought-together' | 'viewed-also-viewed';
  items: RecommendationItem[];
  /// Pass back to `trackRecommendationClick` when the viewer clicks a
  /// result. Null if impression logging itself failed server-side —
  /// never blocks serving the items.
  impressionId: string | null;
}

export type RecommendationSurface = 'pdp' | 'home' | 'cart' | 'category';

export interface SimilarParams {
  slug: string;
  limit?: number;
  surface?: RecommendationSurface;
  country?: string;
  sessionId?: string;
}

export async function fetchSimilarProducts(
  params: SimilarParams,
): Promise<RecommendationResponse> {
  const sp = new URLSearchParams({ slug: params.slug });
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.surface) sp.set('surface', params.surface);
  if (params.country) sp.set('country', params.country);
  if (params.sessionId) sp.set('sessionId', params.sessionId);

  const res = await fetch(`${API_BASE}/api/recommendations/similar?${sp.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Similar products failed (${res.status})`);
  return (await res.json()) as RecommendationResponse;
}

export interface TrendingParams {
  limit?: number;
  surface?: RecommendationSurface;
  country?: string;
  sessionId?: string;
}

export async function fetchTrendingNearYou(
  params: TrendingParams = {},
): Promise<RecommendationResponse> {
  const sp = new URLSearchParams();
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.surface) sp.set('surface', params.surface);
  if (params.country) sp.set('country', params.country);
  if (params.sessionId) sp.set('sessionId', params.sessionId);

  const res = await fetch(`${API_BASE}/api/recommendations/trending?${sp.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Trending products failed (${res.status})`);
  return (await res.json()) as RecommendationResponse;
}

export interface AlsoBoughtParams {
  slug: string;
  limit?: number;
  surface?: RecommendationSurface;
  country?: string;
  sessionId?: string;
}

/// Phase 1 — "Customers also bought" (co-purchase, single seed).
export async function fetchAlsoBought(
  params: AlsoBoughtParams,
): Promise<RecommendationResponse> {
  const sp = new URLSearchParams({ slug: params.slug });
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.surface) sp.set('surface', params.surface);
  if (params.country) sp.set('country', params.country);
  if (params.sessionId) sp.set('sessionId', params.sessionId);

  const res = await fetch(`${API_BASE}/api/recommendations/also-bought?${sp.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Also bought failed (${res.status})`);
  return (await res.json()) as RecommendationResponse;
}

export interface FrequentlyBoughtTogetherParams {
  /// Every product slug currently in the cart — the module suggests
  /// complements to the whole basket, not just one item.
  slugs: string[];
  limit?: number;
  surface?: RecommendationSurface;
  country?: string;
  sessionId?: string;
}

/// Phase 1 — "Frequently bought together" (co-purchase, multi-seed).
export async function fetchFrequentlyBoughtTogether(
  params: FrequentlyBoughtTogetherParams,
): Promise<RecommendationResponse> {
  const sp = new URLSearchParams({ slugs: params.slugs.join(',') });
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.surface) sp.set('surface', params.surface);
  if (params.country) sp.set('country', params.country);
  if (params.sessionId) sp.set('sessionId', params.sessionId);

  const res = await fetch(
    `${API_BASE}/api/recommendations/frequently-bought-together?${sp.toString()}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Frequently bought together failed (${res.status})`);
  return (await res.json()) as RecommendationResponse;
}

/// Phase 1 — "Viewed also viewed" (co-view). Wired at the API-client
/// level for completeness; not yet surfaced on any page — a PDP
/// already carries "similar" + "also bought" + origin/category
/// cross-links, and a fourth rail was judged more clutter than value
/// for now. Available whenever that judgement call changes.
export async function fetchViewedAlsoViewed(
  params: AlsoBoughtParams,
): Promise<RecommendationResponse> {
  const sp = new URLSearchParams({ slug: params.slug });
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.surface) sp.set('surface', params.surface);
  if (params.country) sp.set('country', params.country);
  if (params.sessionId) sp.set('sessionId', params.sessionId);

  const res = await fetch(
    `${API_BASE}/api/recommendations/viewed-also-viewed?${sp.toString()}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Viewed also viewed failed (${res.status})`);
  return (await res.json()) as RecommendationResponse;
}

/// Fire-and-forget, mirrors `trackSearchClick`.
export function trackRecommendationClick(impressionId: string, productId: string): void {
  void fetch(`${API_BASE}/api/recommendations/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ impressionId, productId }),
    keepalive: true,
  }).catch(() => {
    /* best-effort — see trackSearchClick for the same pattern */
  });
}
