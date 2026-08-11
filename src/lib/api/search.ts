import type { ApiProduct } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Client for the Search & Discovery Phase 0 API
 * (`afrizonemart-api/src/modules/search`, ALGORITHM_SYSTEMS_TRACKER.md).
 *
 * Deliberately `cache: 'no-store'` rather than the products module's
 * revalidate-cached pattern — search queries are one-off strings, and
 * caching each one in Vercel's Data Cache would bloat it for no reuse
 * benefit the way a shared `/api/products` listing gets.
 */

export interface SearchResultItem {
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

export interface SearchResponse {
  items: SearchResultItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
  /// True when the lexical query found nothing and this came from the
  /// trigram typo-tolerance fallback instead.
  usedFallback: boolean;
  /// Pass back to `trackSearchClick` when the searcher clicks a result.
  queryLogId: string | null;
}

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  category?: string;
  origin?: string;
  inStock?: boolean;
  onSale?: boolean;
  shipsToMe?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  country?: string;
  sessionId?: string;
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

function toQueryString(params: SearchParams): string {
  const sp = new URLSearchParams();
  sp.set('q', params.q);
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.category) sp.set('category', params.category);
  if (params.origin) sp.set('origin', params.origin);
  if (params.inStock !== undefined) sp.set('inStock', String(params.inStock));
  if (params.onSale !== undefined) sp.set('onSale', String(params.onSale));
  if (params.shipsToMe) sp.set('shipsToMe', 'true');
  if (params.minPrice !== undefined)
    sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined)
    sp.set('maxPrice', String(params.maxPrice));
  if (params.minRating !== undefined)
    sp.set('minRating', String(params.minRating));
  if (params.country) sp.set('country', params.country);
  if (params.sessionId) sp.set('sessionId', params.sessionId);
  if (params.sort) sp.set('sort', params.sort);
  return `?${sp.toString()}`;
}

export async function fetchSearch(
  params: SearchParams,
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search${toQueryString(params)}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()) as SearchResponse;
}

export interface AutocompleteProduct {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
}

export interface AutocompleteResponse {
  queries: string[];
  products: AutocompleteProduct[];
}

export async function fetchAutocomplete(
  q: string,
  limit = 6,
  signal?: AbortSignal,
): Promise<AutocompleteResponse> {
  const sp = new URLSearchParams({ q, limit: String(limit) });
  const res = await fetch(
    `${API_BASE}/api/search/autocomplete?${sp.toString()}`,
    {
      cache: 'no-store',
      signal,
    },
  );
  if (!res.ok) throw new Error(`Autocomplete failed (${res.status})`);
  return (await res.json()) as AutocompleteResponse;
}

/// Fire-and-forget, mirrors `recordProductView` — never blocks a
/// navigation and never surfaces an error to the searcher.
export function trackSearchClick(queryLogId: string, productId: string): void {
  void fetch(`${API_BASE}/api/search/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queryLogId, productId }),
    keepalive: true,
  }).catch(() => {
    /* best-effort — see recordProductView for the same pattern */
  });
}

/// Adapter so search results can reuse `ApiProductCard` (the single
/// source of truth for card visuals) without a parallel card
/// component. Fields `ApiProductCard` never reads (shortDescription,
/// ingredients, weightKg, attributes, category, updatedAt) get inert
/// placeholders — safe because the card only touches id/slug/name/
/// price/comparePrice/origin/sellableCountries/inStock/images.
export function toApiProduct(item: SearchResultItem): ApiProduct {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    price: item.price,
    comparePrice: item.comparePrice,
    discountPercent: item.discountPercent,
    shortDescription: null,
    description: null,
    ingredients: null,
    origin: item.origin,
    sellableCountries: item.sellableCountries,
    weightKg: null,
    inStock: item.inStock,
    rating: item.rating,
    reviewCount: item.reviewCount,
    images: item.images,
    attributes: {
      bundles: [],
      features: [],
      specifications: [],
      aboutTitle: '',
      aboutBody: '',
      aboutImage: '',
    },
    categoryId: item.category?.id ?? null,
    category: null,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  };
}
