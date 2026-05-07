import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { listCategories } from '@/lib/api/categories';
import { fetchProducts } from '@/lib/api/products';
import { SITE_NAME, absUrl } from '@/lib/seo';
import type { Metadata } from 'next';

const PAGE_SIZE = 48;

interface PageProps {
  params: { category: string; subcategory: string };
  searchParams: { page?: string };
}

/** Resolve a (parent, child) pair from the API. Returns null if either
 *  slug doesn't exist or if the child isn't actually a subcategory of
 *  the named parent — both cases 404 for the customer so we never serve
 *  a confusing mismatch (e.g. /shop/books/fresh-fruits). */
async function resolvePair(parentSlug: string, childSlug: string) {
  const tree = await listCategories();
  const parent = tree.find((c) => c.slug === parentSlug);
  if (!parent) return null;
  const child = parent.children?.find((c) => c.slug === childSlug);
  if (!child) return null;
  return { parent, child };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pair = await resolvePair(params.category, params.subcategory);
  const title = pair
    ? `${pair.child.name} — ${pair.parent.name}`
    : params.subcategory.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const description = pair
    ? `Browse ${pair.child.name} in ${pair.parent.name} on Afrizonemart.`
    : `Browse African-made products on Afrizonemart.`;
  const url = `/shop/${params.category}/${params.subcategory}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url: absUrl(url),
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SubcategoryPage({ params, searchParams }: PageProps) {
  const pair = await resolvePair(params.category, params.subcategory);
  if (!pair) notFound();

  const requestedPage = Number.parseInt(searchParams.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Real products from the API — filtered by the subcategory slug.
  // The API's category filter walks the tree, so passing the child
  // slug returns only that subcategory's products.
  const productsResponse = await fetchProducts({
    category: pair.child.slug,
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
              <Link href="/shop" className="hover:text-navy">
                Shop
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <Link href={`/shop/${pair.parent.slug}`} className="hover:text-navy">
                {pair.parent.name}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">{pair.child.name}</span>
            </li>
          </ol>
        </nav>

        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <header className="mb-6 flex flex-col gap-2 md:mb-8">
            <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
              {pair.parent.name} · Subcategory
            </p>
            <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
              {pair.child.name}
            </h1>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <SafeBoundary name="subcategory:filters" fallback={null}>
                <FiltersSidebar />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
              <SafeBoundary name="subcategory:toolbar" fallback={null}>
                <ShopToolbar total={totalProducts} />
              </SafeBoundary>

              {totalProducts === 0 ? (
                <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                  <p className="font-raleway text-lg font-bold text-navy">
                    No products in {pair.child.name} yet
                  </p>
                  <p className="mt-1 font-sans text-sm text-muted">
                    Check back soon as we onboard new makers.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
                    {products.map((p) => (
                      <SafeBoundary key={p.id} name="subcategory:card" fallback={null}>
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
                            href={`/shop/${pair.parent.slug}/${pair.child.slug}?page=${page - 1}`}
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
                            href={`/shop/${pair.parent.slug}/${pair.child.slug}?page=${page + 1}`}
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
