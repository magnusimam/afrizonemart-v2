'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ExternalLink, Home as HomeIcon, SlidersHorizontal } from 'lucide-react';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { LibraryDocCard } from '@/components/library/LibraryDocCard';
import { LibraryFiltersSidebar } from '@/components/library/LibraryFiltersSidebar';
import { useLibraryDocs } from '@/hooks/use-library-docs';
import type { DocumentType } from '@/lib/api/documents';

const PAGE_SIZE = 24;

export default function LibraryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const country = searchParams.get('country') ?? undefined;
  const docType = (searchParams.get('docType') as DocumentType | null) ?? undefined;
  // URL-bound (not local state) so LibraryFiltersSidebar's writeParams
  // — which strips `page` on every filter change — actually resets
  // pagination back to 1 instead of leaving a stale local page number
  // pointed at a now-different filtered set.
  const page = (() => {
    const raw = searchParams.get('page');
    const n = raw ? Number.parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();
  const setPage = useCallback(
    (updater: (prev: number) => number) => {
      const next = updater(page);
      const params = new URLSearchParams(searchParams.toString());
      if (next <= 1) params.delete('page');
      else params.set('page', String(next));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [page, pathname, router, searchParams],
  );

  const { data, isLoading, isError, error, refetch } = useLibraryDocs({
    country,
    docType,
    page,
    limit: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.pages ?? 1;

  return (
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
            <span className="font-medium text-charcoal">Civic Library</span>
          </li>
        </ol>
      </nav>

      {/* Hero strip */}
      <section className="bg-gradient-to-r from-navy via-[#16265d] to-[#1d2f70] py-10 md:py-14">
        <div className="mx-auto flex max-w-site flex-col gap-3 px-4">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
            Free downloads
          </p>
          <h1 className="font-raleway text-3xl font-bold leading-tight text-white md:text-5xl">
            Civic Library
          </h1>
          <p className="max-w-2xl font-sans text-sm text-white/80 md:text-base">
            Constitutions, acts, bills, and policies for African countries —
            free to download, no account required.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-site px-4 py-8 md:py-10">
        {/* Sourcing disclaimer — every document links back to its
            official government source so a visitor can verify it's
            current rather than trusting AZM as the authority. */}
        <div className="mb-6 flex items-start gap-2 rounded-card border border-border bg-white px-4 py-3 font-sans text-xs text-muted">
          <ExternalLink size={14} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            Documents are sourced from official government publications.
            Each card links to its original source — always verify against
            that source before relying on a document for legal purposes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="hidden lg:col-span-3 lg:block">
            <SafeBoundary name="library:filters" fallback={null}>
              <LibraryFiltersSidebar />
            </SafeBoundary>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-sans text-sm text-muted">
                {isLoading ? 'Loading…' : `${total.toLocaleString()} document${total === 1 ? '' : 's'}`}
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-btn border border-border bg-white px-4 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal hover:border-navy hover:text-navy lg:hidden"
              >
                <SlidersHorizontal size={14} aria-hidden />
                Filters
              </button>
            </div>

            {isLoading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card"
                  >
                    <div className="aspect-square animate-pulse bg-page" />
                    <div className="flex flex-1 flex-col gap-2 p-2.5">
                      <div className="h-3 w-full animate-pulse rounded-input bg-page" />
                      <div className="h-3 w-3/4 animate-pulse rounded-input bg-page" />
                      <div className="mt-auto h-8 animate-pulse rounded-btn bg-page" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-10 text-center">
                <p className="font-raleway text-base font-bold text-navy">
                  Couldn&apos;t load the Civic Library right now
                </p>
                <p className="mt-1 font-sans text-sm text-muted">
                  {error instanceof Error ? error.message : 'Try again in a moment.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 rounded-btn border border-navy bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                >
                  Try Again
                </button>
              </div>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                <p className="font-raleway text-lg font-bold text-navy">
                  No documents match those filters yet
                </p>
                <p className="mt-1 font-sans text-sm text-muted">
                  We&apos;re adding new countries and document types regularly
                  — check back soon.
                </p>
              </div>
            )}

            {!isLoading && !isError && items.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
                {items.map((doc) => (
                  <SafeBoundary key={doc.id} name="library:card" fallback={null}>
                    <LibraryDocCard doc={doc} />
                  </SafeBoundary>
                ))}
              </div>
            )}

            {!isLoading && !isError && totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white px-4 py-3 font-sans text-sm"
              >
                <span className="text-muted">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-btn border border-border bg-white px-4 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal transition-colors hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:bg-page disabled:text-muted"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-btn bg-navy px-4 font-raleway text-[11px] font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:bg-page disabled:text-muted"
                  >
                    Next →
                  </button>
                </div>
              </nav>
            )}
          </div>

          {drawerOpen ? (
            <div
              className="fixed inset-0 z-50 flex lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
            >
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 bg-black/40"
              />
              <div className="h-full w-[88%] max-w-sm overflow-y-auto bg-white shadow-xl">
                <SafeBoundary name="library:filters-drawer" fallback={null}>
                  <LibraryFiltersSidebar onClose={() => setDrawerOpen(false)} />
                </SafeBoundary>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
