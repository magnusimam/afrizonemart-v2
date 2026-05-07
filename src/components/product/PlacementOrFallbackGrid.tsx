'use client';

import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductGridError } from '@/components/product/ProductGridError';
import { useProducts, useShelf } from '@/hooks/use-products';
import type { ListProductsParams } from '@/lib/api/types';

/**
 * Phase 10.7 + 10.8 — homepage-section grid that **mixes** admin-curated
 * picks with a query-driven fallback.
 *
 * Render order:
 *   1. Explicit picks from the Shelf (in admin-set order, scoped to the
 *      requested country).
 *   2. Fallback products that match `fallbackQuery`, excluding any
 *      product already in the explicit pick list.
 *   3. Capped at `rows × cols` (from the Shelf) or `limit` prop.
 *
 * This is the fix for "adding one product wiped my shelf": picks no
 * longer replace the fallback — they layer on top of it. Adding the
 * first pick pushes the fallback rows down rather than nuking them.
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

  // Effective cap: admin-set rows × cols wins; falls back to the prop
  // so existing call sites work even before the Shelf row is edited.
  const cap = shelf ? Math.max(1, shelf.rows * shelf.cols) : limit;

  // Always run the fallback query — the merge step uses it to fill any
  // slots not already taken by explicit picks. We over-fetch slightly
  // (cap items) so duplicate-filtering against the picks still leaves
  // enough to fill the cap.
  const fallback = useProducts({ ...fallbackQuery, limit: cap });

  // Honour the admin "disabled" flag — render nothing.
  if (shelf && !shelf.enabled) return null;

  const isLoading = placed.isLoading || fallback.isLoading;
  const isError =
    placed.isError && placedItems.length === 0 && fallback.isError;
  const error = (fallback.error ?? placed.error) ?? undefined;

  // Merge: picks first (in their saved order), then fallback rows
  // filling the remaining slots, dropping any product already pinned.
  const pickedIds = new Set(placedItems.map((p) => p.id));
  const fallbackItems = (fallback.data?.items ?? []).filter(
    (p) => !pickedIds.has(p.id),
  );
  const items = [...placedItems, ...fallbackItems].slice(0, cap);

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
