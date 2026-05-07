'use client';

import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductGridError } from '@/components/product/ProductGridError';
import { useProducts, useShelf } from '@/hooks/use-products';
import type { ListProductsParams } from '@/lib/api/types';

/**
 * Phase 10.7 + 10.8 — homepage-section grid that prefers admin-curated
 * placements (now with admin-controlled rows × cols via the Shelf row)
 * but falls back to a query-driven default when no products are pinned.
 *
 * Behaviour:
 *  1. First load the Shelf config + curated products from
 *     `GET /api/shelves/:key`. If `enabled = false`, render nothing.
 *     If `items.length > 0`, render those (capped at rows × cols).
 *  2. Otherwise fall through to `fallbackQuery` (typically a category
 *     filter) so existing homepage shelves stay populated until admin
 *     starts pinning products.
 *
 * The visual grid container lives in the parent section component
 * (`ProductsSection`, `FavouritesSection`, …); we only emit cards.
 */
type ButtonVariant = 'navy' | 'pink';

interface Props {
  placement: string;
  fallbackQuery: ListProductsParams;
  /** Default cap; overridden by `rows * cols` when the Shelf is configured. */
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
  const placed = useShelf(placement, country);
  const shelf = placed.data?.shelf;
  const placedItems = placed.data?.items ?? [];

  // Effective cap: shelf rows*cols wins when configured, else `limit`
  // prop (so existing call sites that pass an explicit limit keep
  // their current behaviour until the Shelf row gets edited).
  const cap = shelf ? Math.max(1, shelf.rows * shelf.cols) : limit;

  // Only fire the fallback once we know the shelf has zero curated
  // items — otherwise we'd waste a query whenever the shelf is full.
  const useFallback = !placed.isLoading && placedItems.length === 0;
  const fallback = useProducts({ ...fallbackQuery, limit: cap });

  const isLoading = placed.isLoading || (useFallback && fallback.isLoading);
  const isError =
    (!placed.isLoading && placed.isError && placedItems.length === 0 && fallback.isError) ||
    (useFallback && fallback.isError);
  const error = (useFallback ? fallback.error : placed.error) ?? undefined;

  // Honour the admin "disabled" flag — render nothing so the section
  // can be hidden temporarily without removing it from a page.
  if (shelf && !shelf.enabled) return null;

  const items =
    placedItems.length > 0
      ? placedItems.slice(0, cap)
      : useFallback
        ? fallback.data?.items.slice(0, cap) ?? []
        : [];

  const count = skeletonCount ?? cap;

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
            imageSrc={p.images?.[0]}
            imageAlt={p.name}
          />
        );
      })}
    </>
  );
}
