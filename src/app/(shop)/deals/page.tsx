'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Flame, Home as HomeIcon, Tag, Timer } from 'lucide-react';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { PlacementShelf } from '@/components/product/PlacementShelf';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductGridError } from '@/components/product/ProductGridError';
import { useProducts } from '@/hooks/use-products';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { useState } from 'react';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', icon: Flame },
  { id: 'price-desc', label: 'Biggest savings', icon: Tag },
  { id: 'price-asc', label: 'Lowest price', icon: Timer },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]['id'];

const PAGE_SIZE = 48;

export default function DealsPage() {
  const [sort, setSort] = useState<SortId>('price-desc');
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the sort flips so users don't end up on
  // page 7 of a different ordering.
  const handleSortChange = (next: SortId) => {
    setSort(next);
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch } = useProducts({
    onSale: true,
    limit: PAGE_SIZE,
    page,
    sort,
  });

  const items = data?.items ?? [];
  const totalDeals = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.pages ?? 1;
  // Insert promo banners after every 12 cards.
  const groups: { cards: typeof items; banner?: 'made' | 'bnpl' }[] = [];
  for (let i = 0; i < items.length; i += 12) {
    const slice = items.slice(i, i + 12);
    const idx = Math.floor(i / 12);
    const banner = idx === 0 ? 'made' : idx === 1 ? 'bnpl' : undefined;
    groups.push({ cards: slice, banner });
  }

  return (
    <>
      <main className="bg-page pb-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-navy">
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">Today&apos;s Deals</span>
            </li>
          </ol>
        </nav>

        {/* Hero strip */}
        <section className="bg-gradient-to-r from-navy via-[#16265d] to-[#1d2f70] py-10 md:py-14">
          <div className="mx-auto flex max-w-site flex-col items-start gap-3 px-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="flex flex-col gap-2">
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                On sale right now
              </p>
              <h1 className="font-raleway text-3xl font-bold leading-tight text-white md:text-5xl">
                Today&apos;s Deals
              </h1>
              <p className="max-w-2xl font-sans text-sm text-white/80 md:text-base">
                Every product on this page is currently discounted. Hand-picked
                Made-in-Africa goods at prices you won&rsquo;t see again next
                week.
              </p>
            </div>

            {!isLoading && !isError && (
              <div className="rounded-card border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <span className="font-raleway text-2xl font-bold leading-none text-white md:text-3xl">
                  {totalDeals.toLocaleString()}
                </span>
                <span className="ml-2 font-sans text-xs text-white/70 md:text-sm">
                  deal{totalDeals === 1 ? '' : 's'} live
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Sort row */}
        <div className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-site items-center gap-2 overflow-x-auto px-4 py-3">
            <span className="shrink-0 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              Sort
            </span>
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSortChange(opt.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn transition-colors ${
                    active
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-charcoal hover:border-navy'
                  }`}
                >
                  <Icon size={12} aria-hidden />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor-pinned picks (uses placement registry) */}
        <div className="mx-auto max-w-site px-4 pt-8 md:pt-10">
          <PlacementShelf
            placement="todays_deals_pick"
            title="Staff picks today"
            subtitle="Hand-selected by Afrizonemart curators."
            delivery="Pick"
          />
        </div>

        {/* Grid */}
        <div className="mx-auto max-w-site px-4 py-8 md:py-10">
          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
              <ProductGridSkeleton count={12} />
            </div>
          )}

          {isError && (
            <ProductGridError
              message={error instanceof Error ? error.message : undefined}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
              <p className="font-raleway text-lg font-bold text-navy">
                No deals live right now
              </p>
              <p className="mt-1 font-sans text-sm text-muted">
                Check back soon — new products go on sale every week.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
              >
                Browse all products
              </Link>
            </div>
          )}

          {!isLoading &&
            !isError &&
            groups.map((g, gi) => (
              <div key={gi} className="flex flex-col gap-6 md:gap-8">
                {gi > 0 && <div className="h-px bg-border" />}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
                  {g.cards.map((p) => (
                    <SafeBoundary key={p.id} name="deals:card" fallback={null}>
                      <ApiProductCard product={p} delivery="Sale" />
                    </SafeBoundary>
                  ))}
                </div>
                {g.banner === 'made' && (
                  <BannerStrip
                    src="/images/discount/made-in-africa.png"
                    alt="Remember, if it is made in Africa, it is made for you!"
                  />
                )}
                {g.banner === 'bnpl' && (
                  <BannerStrip
                    src="/images/discount/bnpl.webp"
                    alt="Don't forget — you can just Buy Now Pay Later when checking out"
                    href="/checkout"
                  />
                )}
              </div>
            ))}

          {!isLoading && !isError && totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white px-4 py-3 font-sans text-sm"
            >
              <span className="text-muted">
                Page {page} of {totalPages} · showing {items.length} of{' '}
                {totalDeals.toLocaleString()} deals
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:bg-page disabled:text-muted"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-btn bg-navy px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:bg-page disabled:text-muted"
                >
                  Next →
                </button>
              </div>
            </nav>
          )}
        </div>

        <SafeBoundary name="deals:trust" fallback={null}>
          <TrustBarSection />
        </SafeBoundary>
      </main>
    </>
  );
}

function BannerStrip({
  src,
  alt,
  href,
}: {
  src: string;
  alt: string;
  href?: string;
}) {
  const inner = (
    <div className="overflow-hidden rounded-card border border-border bg-white shadow-card">
      <Image
        src={src}
        alt={alt}
        width={2400}
        height={400}
        className="h-auto w-full"
      />
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
