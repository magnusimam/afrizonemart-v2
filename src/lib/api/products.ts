import type {
  ApiErrorEnvelope,
  ApiProduct,
  ApiProductList,
  ListProductsParams,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Resilience-aware fetch for read-only product endpoints.
 *
 * Uses Next.js' Data Cache (Vercel's edge-side fetch cache) with a
 * revalidate window — so:
 *
 *  - Same URL hit within `revalidateSeconds` returns instantly from
 *    Vercel's edge, no Railway hop.
 *  - When the window expires, the NEXT request triggers a background
 *    refetch but still returns the stale cache to the user (Vercel's
 *    fetch cache uses stale-while-revalidate semantics by default).
 *  - **If Railway is down**, the background refetch errors but the
 *    customer keeps seeing the last-known-good catalog. Browsing
 *    stays alive through a brief API outage — exactly the resilience
 *    we wanted after 2026-05-19's Railway hiccup.
 *
 * Cache key is the full URL (Next.js handles this), so different
 * query strings (origin filters, page numbers, etc.) cache
 * independently.
 *
 * Only used for endpoints where briefly-stale data is fine:
 * `fetchProducts`, `fetchProduct`. Cart/checkout/auth/admin flows
 * use their own fetchers with `cache: 'no-store'` — money paths
 * must NOT be stale.
 */
async function apiFetchCached<T>(
  path: string,
  revalidateSeconds: number,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate: revalidateSeconds },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    let envelope: ApiErrorEnvelope | undefined;
    try {
      envelope = (await res.json()) as ApiErrorEnvelope;
    } catch {
      /* body wasn't JSON */
    }
    throw new ApiError(
      res.status,
      envelope?.error?.code ?? 'UNKNOWN',
      envelope?.error?.message ?? `Request failed with status ${res.status}`,
      envelope?.error?.details,
    );
  }

  return (await res.json()) as T;
}

function toQueryString(params: ListProductsParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.category) sp.set('category', params.category);
  if (params.origin) sp.set('origin', params.origin);
  if (params.q) sp.set('q', params.q);
  if (params.inStock !== undefined) sp.set('inStock', String(params.inStock));
  if (params.onSale !== undefined) sp.set('onSale', String(params.onSale));
  if (params.minPrice !== undefined) sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) sp.set('maxPrice', String(params.maxPrice));
  if (params.minRating !== undefined) sp.set('minRating', String(params.minRating));
  if (params.placement) sp.set('placement', params.placement);
  if (params.country) sp.set('country', params.country);
  if (params.ids && params.ids.length > 0) sp.set('ids', params.ids.join(','));
  if (params.sort) sp.set('sort', params.sort);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/// Read-only product list / detail fetches run through the cached
/// path so the storefront survives brief Railway outages. 60s is a
/// good fresh-vs-resilience tradeoff for a catalog where prices
/// update minutes-to-hours apart, not seconds. Admin price edits
/// route through `applyPriceChange()` which bumps `updatedAt` on
/// the product — when we add cache-tag invalidation in a follow-up
/// the lag drops to ~immediate; until then customers see prices
/// up to 60s stale, which is acceptable.
const PRODUCT_LIST_REVALIDATE_S = 60;
const PRODUCT_DETAIL_REVALIDATE_S = 60;

export async function fetchProducts(
  params: ListProductsParams = {},
): Promise<ApiProductList> {
  return apiFetchCached<ApiProductList>(
    `/api/products${toQueryString(params)}`,
    PRODUCT_LIST_REVALIDATE_S,
  );
}

export async function fetchProduct(slug: string): Promise<ApiProduct> {
  return apiFetchCached<ApiProduct>(
    `/api/products/${encodeURIComponent(slug)}`,
    PRODUCT_DETAIL_REVALIDATE_S,
  );
}

export { ApiError };
