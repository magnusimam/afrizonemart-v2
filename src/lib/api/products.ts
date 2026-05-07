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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    // Next 14 defaults server-side fetch to force-cache. We always want
    // fresh product data on detail pages — TanStack Query handles
    // caching on the client for list views.
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
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
  if (params.placement) sp.set('placement', params.placement);
  if (params.country) sp.set('country', params.country);
  if (params.ids && params.ids.length > 0) sp.set('ids', params.ids.join(','));
  if (params.sort) sp.set('sort', params.sort);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchProducts(
  params: ListProductsParams = {},
): Promise<ApiProductList> {
  return apiFetch<ApiProductList>(`/api/products${toQueryString(params)}`);
}

export async function fetchProduct(slug: string): Promise<ApiProduct> {
  return apiFetch<ApiProduct>(`/api/products/${encodeURIComponent(slug)}`);
}

export { ApiError };
