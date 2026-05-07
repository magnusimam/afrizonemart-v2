'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProduct, fetchProducts } from '@/lib/api/products';
import { fetchShelf } from '@/lib/api/shelves';
import type { ListProductsParams } from '@/lib/api/types';

export function useProducts(params: ListProductsParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
    enabled: Boolean(slug),
  });
}

/// Phase 10.8 — fetches the shelf container + its curated products.
/// Use this for any shelf that should follow admin-set rows/cols and
/// product order; falls back to component props only when the shelf
/// hasn't been configured yet.
export function useShelf(key: string, country?: string) {
  return useQuery({
    queryKey: ['shelf', key, country ?? null],
    queryFn: () => fetchShelf(key, country),
    enabled: Boolean(key),
  });
}
