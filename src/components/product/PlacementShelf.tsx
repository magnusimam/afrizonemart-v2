'use client';

import { ApiProductCard } from '@/components/product/ApiProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { useProducts } from '@/hooks/use-products';

/**
 * Phase 10.7 — renders a horizontal shelf of products tagged with a
 * specific placement key. Used by curated pages
 * (new-arrivals, deals, special-discount, etc.) to surface the items
 * an admin manually pinned via /admin/products → "Where this product appears".
 *
 * Hides the entire shelf if zero products have the placement so pages
 * never show empty headers.
 */
interface Props {
  placement: string;
  title: string;
  subtitle?: string;
  /** Limit how many cards show. Defaults to 6. */
  limit?: number;
  /** ISO-2 country to scope the placement. */
  country?: string;
  /** Static delivery copy passed to each card. */
  delivery?: string;
}

export function PlacementShelf({
  placement,
  title,
  subtitle,
  limit = 6,
  country,
  delivery,
}: Props) {
  const { data, isLoading } = useProducts({ placement, country, limit });
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <section className="flex flex-col gap-3">
        <Header title={title} subtitle={subtitle} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
          <ProductGridSkeleton count={Math.min(limit, 4)} />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <Header title={title} subtitle={subtitle} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-6">
        {items.map((p) => (
          <ApiProductCard key={p.id} product={p} delivery={delivery} />
        ))}
      </div>
    </section>
  );
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-end justify-between gap-3 border-b border-border pb-2">
      <div className="flex flex-col leading-tight">
        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
          Pinned by editors
        </span>
        <h2 className="font-raleway text-xl font-bold text-navy md:text-2xl">{title}</h2>
        {subtitle && (
          <p className="font-sans text-xs text-muted md:text-sm">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
