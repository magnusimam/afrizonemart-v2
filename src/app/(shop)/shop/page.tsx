import Link from 'next/link';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { COUNTRY_CODES } from '@/lib/countries';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { fetchProducts } from '@/lib/api/products';

const PAGE_SIZE = 48;

interface PageProps {
  searchParams: { page?: string };
}

export default async function ShopPage({ searchParams }: PageProps) {
  // Real products from the API. No fake fallback — if there's nothing
  // in the catalog, the page renders an empty state. searchParams.page
  // drives pagination; first-time visitors land on page 1.
  const requestedPage = Number.parseInt(searchParams.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const productsResponse = await fetchProducts({
    limit: PAGE_SIZE,
    page,
    sort: 'newest',
  }).catch(() => null);
  const products = productsResponse?.items ?? [];
  const totalProducts = productsResponse?.pagination.total ?? 0;
  const totalPages = productsResponse?.pagination.pages ?? 1;

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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <SafeBoundary name="shop:filters" fallback={null}>
                <FiltersSidebar />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
              <SafeBoundary name="shop:toolbar" fallback={null}>
                <ShopToolbar total={totalProducts} />
              </SafeBoundary>

              {totalProducts === 0 ? (
                <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                  <p className="font-raleway text-lg font-bold text-navy">
                    No products yet
                  </p>
                  <p className="mt-1 font-sans text-sm text-muted">
                    Our catalog is being built — check back soon.
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
                            href={`/shop?page=${page - 1}`}
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
                            href={`/shop?page=${page + 1}`}
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
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
