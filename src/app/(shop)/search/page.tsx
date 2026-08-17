import Link from 'next/link';
import { ChevronRight, Home as HomeIcon, Search } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { fetchSearch, toApiProduct, type SearchParams } from '@/lib/api/search';

const PAGE_SIZE = 48;

interface PageProps {
  searchParams: {
    q?: string;
    page?: string;
    origin?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    inStock?: string;
    onSale?: string;
    shipsToMe?: string;
    country?: string;
    sort?: string;
  };
}

const SUGGESTIONS = [
  'Beauty',
  'Coffee',
  'Ankara fabric',
  'Smoked catfish',
  'Olive oil',
  'Skin care',
];

const SORT_VALUES: SearchParams['sort'][] = [
  'relevance',
  'price-asc',
  'price-desc',
  'rating',
  'newest',
];

/// Same filter contract as `/shop`'s `parseFilters` (see
/// `shop/page.tsx`) — search results honour the exact same commerce
/// rules browsing does. `ShopToolbar`'s sort dropdown writes
/// `sort=featured` for the default (it's shared with `/shop`, which
/// uses that value); search's default is `relevance` instead, so we
/// translate at this one boundary rather than forking the toolbar.
function parseFilters(sp: PageProps['searchParams']): {
  apiParams: Omit<SearchParams, 'q'>;
  hasAnyFilter: boolean;
} {
  const requestedPage = Number.parseInt(sp.page ?? '1', 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const origin = sp.origin?.trim() || undefined;
  const category = sp.category?.trim() || undefined;
  const minPrice = sp.minPrice ? Number.parseInt(sp.minPrice, 10) : undefined;
  const maxPrice = sp.maxPrice ? Number.parseInt(sp.maxPrice, 10) : undefined;
  const minRating = sp.minRating ? Number.parseFloat(sp.minRating) : undefined;
  const inStock = sp.inStock === 'true' ? true : undefined;
  const onSale = sp.onSale === 'true' ? true : undefined;
  const shipsToMe = sp.shipsToMe === 'true' ? true : undefined;
  const country = sp.country?.trim() || undefined;
  const sort: SearchParams['sort'] =
    sp.sort && SORT_VALUES.includes(sp.sort as SearchParams['sort'])
      ? (sp.sort as SearchParams['sort'])
      : 'relevance';

  return {
    apiParams: {
      page,
      limit: PAGE_SIZE,
      origin,
      category,
      minPrice:
        Number.isFinite(minPrice) && (minPrice ?? -1) >= 0
          ? minPrice
          : undefined,
      maxPrice:
        Number.isFinite(maxPrice) && (maxPrice ?? -1) >= 0
          ? maxPrice
          : undefined,
      minRating:
        Number.isFinite(minRating) && (minRating ?? -1) > 0
          ? minRating
          : undefined,
      inStock,
      onSale,
      shipsToMe,
      country: shipsToMe ? country : undefined,
      sort,
    },
    hasAnyFilter: Boolean(
      origin ||
      category ||
      minPrice ||
      maxPrice ||
      minRating ||
      inStock ||
      onSale ||
      shipsToMe,
    ),
  };
}

function buildPageQuery(
  q: string,
  apiParams: Omit<SearchParams, 'q'>,
  page: number,
): string {
  const sp = new URLSearchParams();
  sp.set('q', q);
  sp.set('page', String(page));
  if (apiParams.origin) sp.set('origin', apiParams.origin);
  if (apiParams.category) sp.set('category', apiParams.category);
  if (apiParams.minPrice !== undefined)
    sp.set('minPrice', String(apiParams.minPrice));
  if (apiParams.maxPrice !== undefined)
    sp.set('maxPrice', String(apiParams.maxPrice));
  if (apiParams.minRating !== undefined)
    sp.set('minRating', String(apiParams.minRating));
  if (apiParams.inStock) sp.set('inStock', 'true');
  if (apiParams.onSale) sp.set('onSale', 'true');
  if (apiParams.shipsToMe) sp.set('shipsToMe', 'true');
  if (apiParams.country) sp.set('country', apiParams.country);
  if (apiParams.sort && apiParams.sort !== 'relevance')
    sp.set('sort', apiParams.sort);
  return sp.toString();
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q = (searchParams.q ?? '').trim();
  const hasQuery = q.length > 0;
  const { apiParams, hasAnyFilter } = parseFilters(searchParams);
  const page = apiParams.page ?? 1;

  // Real search via Search & Discovery Phase 0 (ts_rank_cd lexical
  // ranking + trigram typo fallback) — see
  // afrizonemart-api/ALGORITHM_SYSTEMS_TRACKER.md.
  const searchResponse = hasQuery
    ? await fetchSearch({ q, ...apiParams }).catch(() => null)
    : null;
  const results = searchResponse?.items ?? [];
  const totalResults = searchResponse?.pagination.total ?? 0;
  const totalPages = searchResponse?.pagination.pages ?? 1;
  const usedFallback = searchResponse?.usedFallback ?? false;
  const queryLogId = searchResponse?.queryLogId ?? null;
  const facets = searchResponse?.facets ?? null;
  const didYouMean = searchResponse?.didYouMean ?? null;
  const didYouMeanHref = didYouMean
    ? `/search?${buildPageQuery(didYouMean, apiParams, 1)}`
    : null;

  return (
    <>
      <main className="bg-page pb-12">
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-navy"
              >
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">Search</span>
            </li>
          </ol>
        </nav>

        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <header className="mb-6 flex flex-col gap-3 md:mb-8">
            <form
              role="search"
              action="/search"
              method="GET"
              className="flex max-w-2xl items-stretch overflow-hidden rounded-input border border-border bg-white shadow-card"
            >
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search products, brands & categories"
                aria-label="Search products"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className="min-w-0 flex-1 px-4 py-3 font-sans text-base text-charcoal placeholder:text-muted focus:outline-none md:text-base"
                autoFocus
              />
              <button
                type="submit"
                aria-label="Search"
                className="inline-flex min-h-[48px] items-center gap-2 bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark active:bg-navy/80 md:px-7 md:text-sm"
              >
                <Search size={16} aria-hidden />
                Search
              </button>
            </form>

            {hasQuery ? (
              <div>
                <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                  Results for &ldquo;{q}&rdquo;
                </h1>
                <p className="font-sans text-sm text-muted">
                  {totalResults.toLocaleString()} matching products across
                  Africa
                  {usedFallback ? ' · showing close matches' : ''}
                </p>
                {didYouMeanHref ? (
                  <p className="mt-1 font-sans text-sm text-charcoal">
                    Did you mean{' '}
                    <Link
                      href={didYouMeanHref}
                      className="font-semibold text-navy underline hover:text-amber"
                    >
                      &ldquo;{didYouMean}&rdquo;
                    </Link>
                    ?
                  </p>
                ) : null}
              </div>
            ) : (
              <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                What are you looking for?
              </h1>
            )}
          </header>

          {!hasQuery ? (
            <section className="rounded-card border border-border bg-white p-6 shadow-card md:p-10">
              <h2 className="mb-3 font-raleway text-base font-bold text-navy">
                Trending searches
              </h2>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border bg-page px-4 font-raleway text-xs font-semibold text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white active:bg-navy active:text-white md:min-h-0 md:py-1.5 md:text-sm"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              {/* On mobile, hide the sidebar entirely — it stacks
                  below ALL search results and is functionally
                  unreachable without scrolling past the entire grid.
                  Filters ARE wired (search/page.tsx now forwards the
                  same URL params /shop reads to fetchSearch), just
                  not reachable via this sidebar on small screens.
                  A mobile filter drawer (matching ShopShell) is a
                  separate follow-up. Desktop keeps the sidebar. */}
              <div className="hidden lg:col-span-3 lg:block">
                <SafeBoundary name="search:filters" fallback={null}>
                  <FiltersSidebar facets={facets} />
                </SafeBoundary>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
                <SafeBoundary name="search:toolbar" fallback={null}>
                  <ShopToolbar total={totalResults} />
                </SafeBoundary>

                {totalResults === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-12 text-center">
                    <Search size={36} className="text-border" aria-hidden />
                    <p className="font-raleway text-base font-bold text-navy">
                      No matches for &ldquo;{q}&rdquo;
                    </p>
                    <p className="font-sans text-sm text-muted">
                      {hasAnyFilter
                        ? 'Try widening your filters, or a different keyword.'
                        : 'Try a different keyword or browse our categories.'}
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy active:bg-amber active:text-navy"
                    >
                      Browse all products
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
                      {results.map((p) => (
                        <SafeBoundary
                          key={p.id}
                          name="search:card"
                          fallback={null}
                        >
                          <SearchResultCard
                            product={toApiProduct(p)}
                            queryLogId={queryLogId}
                          />
                        </SafeBoundary>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <nav
                        aria-label="Pagination"
                        className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white px-4 py-3 font-sans text-sm"
                      >
                        <span className="text-muted">
                          Page {page} of {totalPages} · showing {results.length}{' '}
                          of {totalResults.toLocaleString()} results
                        </span>
                        <div className="flex items-center gap-2">
                          {page > 1 ? (
                            <Link
                              href={`/search?${buildPageQuery(q, apiParams, page - 1)}`}
                              className="inline-flex min-h-[44px] items-center justify-center rounded-btn border border-border bg-white px-4 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal transition-colors hover:border-navy hover:text-navy active:border-navy active:text-navy"
                            >
                              ← Previous
                            </Link>
                          ) : (
                            <span className="rounded-btn border border-border bg-page px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                              ← Previous
                            </span>
                          )}
                          {page < totalPages ? (
                            <Link
                              href={`/search?${buildPageQuery(q, apiParams, page + 1)}`}
                              className="inline-flex min-h-[44px] items-center justify-center rounded-btn bg-navy px-4 font-raleway text-[11px] font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy active:bg-amber active:text-navy"
                            >
                              Next →
                            </Link>
                          ) : (
                            <span className="rounded-btn border border-border bg-page px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                              Next →
                            </span>
                          )}
                        </div>
                      </nav>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
