import Link from 'next/link';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { COUNTRY_CODES } from '@/lib/countries';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { ShopShell } from '@/components/shop/ShopShell';
import { fetchProducts } from '@/lib/api/products';
import { listCategories } from '@/lib/api/categories';
import type { ListProductsParams } from '@/lib/api/types';

const PAGE_SIZE = 48;

const SORT_VALUES = ['featured', 'newest', 'price-asc', 'price-desc', 'rating'] as const;
type SortValue = (typeof SORT_VALUES)[number];

interface PageProps {
  searchParams: {
    page?: string;
    origin?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    inStock?: string;
    onSale?: string;
    sort?: string;
  };
}

/// Build the canonical filter object once from URL params. Same
/// shape is used to call the API and to rebuild pagination links so
/// the customer doesn't lose their filters when paging.
function parseFilters(sp: PageProps['searchParams']): {
  apiParams: ListProductsParams;
  hasAnyFilter: boolean;
} {
  const requestedPage = Number.parseInt(sp.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const origin = sp.origin?.trim() || undefined;
  const category = sp.category?.trim() || undefined;
  const minPrice = sp.minPrice ? Number.parseInt(sp.minPrice, 10) : undefined;
  const maxPrice = sp.maxPrice ? Number.parseInt(sp.maxPrice, 10) : undefined;
  const minRating = sp.minRating ? Number.parseFloat(sp.minRating) : undefined;
  const inStock = sp.inStock === 'true' ? true : undefined;
  const onSale = sp.onSale === 'true' ? true : undefined;
  const sort: SortValue =
    sp.sort && (SORT_VALUES as readonly string[]).includes(sp.sort)
      ? (sp.sort as SortValue)
      : 'featured';

  return {
    apiParams: {
      page,
      limit: PAGE_SIZE,
      origin,
      category,
      minPrice: Number.isFinite(minPrice) && (minPrice ?? -1) >= 0 ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) && (maxPrice ?? -1) >= 0 ? maxPrice : undefined,
      minRating: Number.isFinite(minRating) && (minRating ?? -1) > 0 ? minRating : undefined,
      inStock,
      onSale,
      sort,
    },
    hasAnyFilter: Boolean(origin || category || minPrice || maxPrice || minRating || inStock || onSale),
  };
}

function buildPageQuery(apiParams: ListProductsParams, page: number): string {
  const sp = new URLSearchParams();
  sp.set('page', String(page));
  if (apiParams.origin) sp.set('origin', apiParams.origin);
  if (apiParams.category) sp.set('category', apiParams.category);
  if (apiParams.minPrice !== undefined) sp.set('minPrice', String(apiParams.minPrice));
  if (apiParams.maxPrice !== undefined) sp.set('maxPrice', String(apiParams.maxPrice));
  if (apiParams.minRating !== undefined) sp.set('minRating', String(apiParams.minRating));
  if (apiParams.inStock) sp.set('inStock', 'true');
  if (apiParams.onSale) sp.set('onSale', 'true');
  if (apiParams.sort && apiParams.sort !== 'featured') sp.set('sort', apiParams.sort);
  return sp.toString();
}

export default async function ShopPage({ searchParams }: PageProps) {
  // Real products from the API. No fake fallback — if there's nothing
  // in the catalog, the page renders an empty state.
  const { apiParams, hasAnyFilter } = parseFilters(searchParams);
  const page = apiParams.page ?? 1;

  const [productsResponse, categoriesTree] = await Promise.all([
    fetchProducts(apiParams).catch(() => null),
    listCategories(),
  ]);
  const products = productsResponse?.items ?? [];
  const totalProducts = productsResponse?.pagination.total ?? 0;
  const totalPages = productsResponse?.pagination.pages ?? 1;
  /// Sidebar surfaces top-level categories only (subcategory drill-down
  /// happens via the per-category routes); flatten the tree to the
  /// root nodes.
  const topLevelCategories = categoriesTree.filter((c) => !c.parentId);

  return (
    <>
      <main className="bg-page pb-12">
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
              <span className="font-medium text-charcoal">Shop</span>
            </li>
          </ol>
        </nav>

        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <header className="mb-6 flex flex-col gap-2 md:mb-8">
            <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
              Shop everything made in Africa
            </p>
            <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
              All Products
            </h1>
            <p className="font-sans text-sm text-muted md:text-base">
              Discover authentic African-made products from {COUNTRY_CODES.length}+ countries.
            </p>
          </header>

          <ShopShell categories={topLevelCategories} total={totalProducts}>
            {totalProducts === 0 ? (
              <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                <p className="font-raleway text-lg font-bold text-navy">
                  {hasAnyFilter ? 'No products match your filters' : 'No products yet'}
                </p>
                <p className="mt-1 font-sans text-sm text-muted">
                  {hasAnyFilter
                    ? 'Try widening your filters on the left, or use Clear all to start over.'
                    : 'Our catalog is being built — check back soon.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
                  {products.map((p) => (
                    <SafeBoundary key={p.id} name="shop:card" fallback={null}>
                      <ApiProductCard product={p} />
                    </SafeBoundary>
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Pagination"
                    className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white px-4 py-3 font-sans text-sm"
                  >
                    <span className="text-muted">
                      Page {page} of {totalPages} · showing {products.length} of{' '}
                      {totalProducts.toLocaleString()} products
                    </span>
                    <div className="flex items-center gap-2">
                      {page > 1 ? (
                        <Link
                          href={`/shop?${buildPageQuery(apiParams, page - 1)}`}
                          className="rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal hover:border-navy hover:text-navy"
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
                          href={`/shop?${buildPageQuery(apiParams, page + 1)}`}
                          className="rounded-btn bg-navy px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
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
          </ShopShell>
        </div>
      </main>
    </>
  );
}
