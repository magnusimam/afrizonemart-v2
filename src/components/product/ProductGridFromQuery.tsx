'use client';

import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductGridError } from '@/components/product/ProductGridError';
import { useProducts } from '@/hooks/use-products';
import type { ListProductsParams } from '@/lib/api/types';

type ButtonVariant = 'navy' | 'pink';

interface Props {
  query: ListProductsParams;
  /** Skeleton count while loading. Defaults to query.limit or 6. */
  skeletonCount?: number;
  /** Static card prop applied to every card (e.g. delivery="2hrs"). */
  delivery?: string;
  buttonVariant?: ButtonVariant;
}

/**
 * Shared grid renderer for homepage product sections backed by the API.
 * Mirrors the Groceries pattern in one place so adding/migrating sections
 * is a one-component swap.
 */
export function ProductGridFromQuery({
  query,
  skeletonCount,
  delivery,
  buttonVariant,
}: Props) {
  const { data, isLoading, isError, error, refetch } = useProducts(query);
  const count = skeletonCount ?? query.limit ?? 6;

  if (isLoading) return <ProductGridSkeleton count={count} />;

  if (isError) {
    return (
      <ProductGridError
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      {data?.items.map((p) => (
        <ProductCardPlaceholder
          key={p.id}
          id={p.id}
          slug={p.slug}
          name={p.name}
          price={p.price}
          comparePrice={p.comparePrice ?? undefined}
          discountPercent={
            p.comparePrice && p.comparePrice > p.price
              ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
              : undefined
          }
          outOfStock={!p.inStock}
          origin={p.origin ?? undefined}
          delivery={delivery}
          buttonVariant={buttonVariant}
        />
      ))}
    </>
  );
}
