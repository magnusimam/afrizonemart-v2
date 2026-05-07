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
  params: { category: string };
  searchParams: { page?: string };
}

const CATEGORY_TITLES: Record<string, { title: string; description: string }> = {
  beauty: { title: 'Beauty & Personal Care', description: 'Skincare, makeup, and grooming from across the continent.' },
  'for-her': { title: 'For Her', description: 'Curated picks for women — fashion, beauty, accessories.' },
  'for-him': { title: 'For Him', description: 'Curated picks for men — apparel, grooming, gadgets.' },
  groceries: { title: 'Groceries, Food & Beverages', description: 'African pantry essentials, drinks, and snacks.' },
  books: { title: 'Books', description: 'Stories, knowledge, and culture from African authors.' },
  'home-essentials': { title: 'Home Essentials', description: 'Cleaning, kitchenware, and household basics.' },
};

function titleFor(slug: string, apiName?: string) {
  const builtIn = CATEGORY_TITLES[slug];
  if (builtIn) return builtIn;
  const fallback = apiName ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  return {
    title: fallback,
    description: `Browse African-made ${fallback.toLowerCase()} on Afrizonemart — verified products from across the continent.`,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = titleFor(params.category);
  const url = `/shop/${params.category}`;
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url: absUrl(url),
      siteName: SITE_NAME,
      title: cat.title,
      description: cat.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: cat.title,
      description: cat.description,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  // Verify the category slug exists in the catalog. 404 if it doesn't —
  // mirrors the subcategory page so we never serve a fake landing page.
  const tree = await listCategories().catch(() => []);
  const apiCat = tree.find((c) => c.slug === params.category);
  if (!apiCat) notFound();

  const cat = titleFor(params.category, apiCat.name);

  const requestedPage = Number.parseInt(searchParams.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Real products from the API — the category filter walks descendants
  // server-side, so passing the parent slug returns every product in
  // any sub-category too.
  const productsResponse = await fetchProducts({
    category: params.category,
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
              <span className="font-medium text-charcoal">{cat.title}</span>
            </li>
          </ol>
        </nav>

        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <header className="mb-6 flex flex-col gap-2 md:mb-8">
            <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
              Category
            </p>
            <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
              {cat.title}
            </h1>
            <p className="font-sans text-sm text-muted md:text-base">{cat.description}</p>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <SafeBoundary name="category:filters" fallback={null}>
                <FiltersSidebar />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
              <SafeBoundary name="category:toolbar" fallback={null}>
                <ShopToolbar total={totalProducts} />
              </SafeBoundary>

              {totalProducts === 0 ? (
                <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                  <p className="font-raleway text-lg font-bold text-navy">
                    No products in {cat.title} yet
                  </p>
                  <p className="mt-1 font-sans text-sm text-muted">
                    Check back soon as we onboard new makers.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
                    {products.map((p) => (
                      <SafeBoundary key={p.id} name="category:card" fallback={null}>
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
                            href={`/shop/${params.category}?page=${page - 1}`}
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
                            href={`/shop/${params.category}?page=${page + 1}`}
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
