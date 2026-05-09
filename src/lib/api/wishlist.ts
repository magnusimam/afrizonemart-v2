import type { ApiErrorEnvelope } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface WishlistProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  comparePrice: number | null;
  discountPercent: number | null;
  origin: string | null;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
}

export interface WishlistEntry {
  id: string;
  addedAt: string;
  product: WishlistProduct;
}

export class WishlistApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'WishlistApiError';
    this.status = status;
    this.code = code;
  }
}

async function wlFetch<T>(
  path: string,
  accessToken: string,
  init: Omit<RequestInit, 'headers'> = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let envelope: ApiErrorEnvelope | undefined;
    try {
      envelope = (await res.json()) as ApiErrorEnvelope;
    } catch {
      /* not JSON */
    }
    throw new WishlistApiError(
      res.status,
      envelope?.error?.code ?? 'UNKNOWN',
      envelope?.error?.message ?? `Request failed with status ${res.status}`,
    );
  }
  return (await res.json()) as T;
}

export function listWishlist(
  accessToken: string,
): Promise<{ items: WishlistEntry[] }> {
  return wlFetch<{ items: WishlistEntry[] }>('/api/wishlist', accessToken, {
    method: 'GET',
  });
}

export function countWishlist(
  accessToken: string,
): Promise<{ count: number }> {
  return wlFetch<{ count: number }>('/api/wishlist/count', accessToken, {
    method: 'GET',
  });
}

export function addToWishlist(
  accessToken: string,
  productId: string,
): Promise<WishlistEntry> {
  return wlFetch<WishlistEntry>('/api/wishlist', accessToken, {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export function removeFromWishlist(
  accessToken: string,
  productId: string,
): Promise<void> {
  return wlFetch<void>(`/api/wishlist/${productId}`, accessToken, {
    method: 'DELETE',
  });
}
