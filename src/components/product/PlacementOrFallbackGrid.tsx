'use client';

import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductGridError } from '@/components/product/ProductGridError';
import { useProducts } from '@/hooks/use-products';
import type { ListProductsParams } from '@/lib/api/types';

/**
 * Phase 10.7 — homepage-section grid that prefers admin-curated placements
 * but falls back to a query-driven default when nothing is placed.
 *
 * Behaviour:
 *  1. First query: `placement=<key>`. If it returns ≥ 1 item, render those.
 *  2. Otherwise fall through to the `fallbackQuery` (typically a category
 *     filter), so existing homepage shelves stay populated until admin
 *     starts pinning products.
 *
 * Two parallel queries are cheap (TanStack Query dedupes + caches), and
 * having both available means the swap from "auto" to "curated" happens
 * the moment admin saves a product placement — no deploy.
 */
type ButtonVariant = 'navy' | 'pink';

interface Props {
  placement: string;
  fallbackQuery: ListProductsParams;
  limit?: number;
  skeletonCount?: number;
  delivery?: string;
  buttonVariant?: ButtonVariant;
  /** ISO-2 country to scope the placement. Optional. */
  country?: string;
}

export function PlacementOrFallbackGrid({
  placement,
  fallbackQuery,
  limit = 6,
  skeletonCount,
  delivery,
  buttonVariant,
  country,
}: Props) {
  const placed = useProducts({ placement, country, limit });
  const placedCount = placed.data?.items.length ?? 0;

  // Only fire fallback once placement has resolved AND turned up empty.
  const useFallback = !placed.isLoading && placedCount === 0;
  const fallback = useProducts(
    { ...fallbackQuery, limit },
  );

  const isLoading = placed.isLoading || (useFallback && fallback.isLoading);
  const isError =
    (!placed.isLoading && placed.isError && placedCount === 0 && fallback.isError) ||
    (useFallback && fallback.isError);
  const error = (useFallback ? fallback.error : placed.error) ?? undefined;

  const items =
    placedCount > 0 ? placed.data!.items : useFallback ? fallback.data?.items ?? [] : [];

  const count = skeletonCount ?? limit;

  if (isLoading) return <ProductGridSkeleton count={count} />;

  if (isError) {
    return (
      <ProductGridError
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => {
          void placed.refetch();
          void fallback.refetch();
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <p className="col-span-full px-4 py-8 text-center font-sans text-sm text-muted">
        Nothing here yet — check back soon.
      </p>
    );
  }

  return (
    <>
      {items.map((p) => {
        const discountPercent =
          p.comparePrice && p.comparePrice > p.price
            ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
            : undefined;
        return (
          <ProductCardPlaceholder
            key={p.id}
            id={p.id}
            slug={p.slug}
            name={p.name}
            price={p.price}
            comparePrice={p.comparePrice ?? undefined}
            discountPercent={discountPercent}
            origin={p.origin ?? undefined}
            outOfStock={!p.inStock}
            buttonVariant={buttonVariant}
            delivery={delivery}
          />
        );
      })}
    </>
  );
}
