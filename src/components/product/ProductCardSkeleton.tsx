/**
 * Loading skeleton that matches the shape of `ProductCardPlaceholder` so
 * the page doesn't shift when real data arrives. Used by useProducts
 * loading state.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card">
      <div className="aspect-square animate-pulse bg-page" />
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="h-3 w-full animate-pulse rounded-input bg-page" />
        <div className="h-3 w-3/4 animate-pulse rounded-input bg-page" />
        <div className="mt-1 h-4 w-1/2 animate-pulse rounded-input bg-page" />
        <div className="mt-auto h-8 animate-pulse rounded-btn bg-page" />
      </div>
    </div>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </>
  );
}
