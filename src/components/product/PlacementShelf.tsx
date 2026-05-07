'use client';

import { ApiProductCard } from '@/components/product/ApiProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { useShelf } from '@/hooks/use-products';

/**
 * Phase 10.7 + 10.8 — renders a curated shelf of products tagged with a
 * placement key. Reads rows × cols + title + enabled from the
 * `Shelf` config (admin-controlled via /admin/shelves) and the product
 * list from `ProductPlacement` rows.
 *
 * Hides the entire shelf if disabled, errored, or empty so curated
 * pages never show empty headers.
 */
interface Props {
  placement: string;
  /** Default title used until the admin sets a Shelf row title. */
  title: string;
  /** Default subtitle. The admin's subtitle wins if set. */
  subtitle?: string;
  /** Backwards-compat: if shelf has no rows/cols set, this caps items. */
  limit?: number;
  /** ISO-2 country to scope per-product country filters. */
  country?: string;
  /** Static delivery copy passed to each card. */
  delivery?: string;
}

export function PlacementShelf({
  placement,
  title,
  subtitle,
  limit,
  country,
  delivery,
}: Props) {
  const { data, isLoading, isError } = useShelf(placement, country);

  // Resolve the effective container config — Shelf row wins, otherwise
  // we honour the props the component was mounted with so existing
  // pages keep working before /admin/shelves is touched.
  const shelf = data?.shelf;
  const effectiveTitle = shelf?.title ?? title;
  const effectiveSubtitle = shelf?.subtitle ?? subtitle;
  const cols = shelf?.cols ?? 6;
  const rows = shelf?.rows ?? 1;
  const cap = limit ?? rows * cols;
  const items = (data?.items ?? []).slice(0, cap);
  const enabled = shelf?.enabled ?? true;

  if (isLoading) {
    return (
      <section className="flex flex-col gap-3">
        <Header title={effectiveTitle} subtitle={effectiveSubtitle ?? undefined} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
          <ProductGridSkeleton count={Math.min(cap, 4)} />
        </div>
      </section>
    );
  }

  // Hide the whole shelf if disabled, errored, or empty — curated
  // shelves are optional editorial content; better silent than broken.
  if (!enabled || isError || items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <Header title={effectiveTitle} subtitle={effectiveSubtitle ?? undefined} />
      <div
        className="grid gap-3 md:gap-5"
        style={{ gridTemplateColumns: `repeat(${Math.min(cols, 6)}, minmax(0, 1fr))` }}
      >
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
