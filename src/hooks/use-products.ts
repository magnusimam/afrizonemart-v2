'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProduct, fetchProducts } from '@/lib/api/products';
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
