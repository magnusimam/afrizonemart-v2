import Link from 'next/link';
import { ChevronRight, Home as HomeIcon, Search } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { COUNTRY_CODES } from '@/lib/countries';
import { SafeBoundary } from '@/components/common/SafeBoundary';

interface PageProps {
  searchParams: { q?: string };
}

const SAMPLE = (q: string) =>
  Array.from({ length: 12 }, (_, i) => ({
    id: `q-${i + 1}`,
    name: `${q.charAt(0).toUpperCase() + q.slice(1)} ${SUFFIXES[i % SUFFIXES.length]}`,
    price: 1500 + i * 950,
    comparePrice: i % 3 === 0 ? 2400 + i * 1100 : undefined,
    discountPercent: i % 3 === 0 ? 15 + (i % 4) * 5 : undefined,
    origin: COUNTRY_CODES[i % COUNTRY_CODES.length],
  }));

const SUFFIXES = [
  '— Premium Edition', 'Pack of 6', 'Original', '1L Bottle', 'Family Size',
  'Travel Size', 'Limited Stock', 'Pro', 'Classic', 'Edition 2', 'Bundle', 'Refill',
];

const SUGGESTIONS = [
  'Beauty', 'Coffee', 'Ankara fabric', 'Smoked catfish', 'Olive oil',
  'Mobile phone', 'Headphones', 'Skin care', 'Maya Naturals',
];

export default function SearchPage({ searchParams }: PageProps) {
  const q = (searchParams.q ?? '').trim();
  const hasQuery = q.length > 0;
  const results = hasQuery ? SAMPLE(q) : [];

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
                placeholder="Search for products, brands & categories..."
                className="min-w-0 flex-1 px-4 py-3 font-sans text-sm text-charcoal placeholder:text-muted focus:outline-none md:text-base"
                autoFocus
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-navy-dark md:px-7 md:text-sm"
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
                  {results.length} matching products across Africa
                </p>
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
                    className="rounded-full border border-border bg-page px-4 py-1.5 font-raleway text-xs font-semibold text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white md:text-sm"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-3">
                <SafeBoundary name="search:filters" fallback={null}>
                  <FiltersSidebar />
                </SafeBoundary>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
                <SafeBoundary name="search:toolbar" fallback={null}>
                  <ShopToolbar total={results.length} />
                </SafeBoundary>

                {results.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-12 text-center">
                    <Search size={36} className="text-border" aria-hidden />
                    <p className="font-raleway text-base font-bold text-navy">
                      No matches for &ldquo;{q}&rdquo;
                    </p>
                    <p className="font-sans text-sm text-muted">
                      Try a different keyword or browse our categories.
                    </p>
                    <Link
                      href="/shop"
                      className="rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                    >
                      Browse All Products
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
                    {results.map((p) => (
                      <SafeBoundary key={p.id} name="search:card" fallback={null}>
                        <ProductCardPlaceholder {...p} />
                      </SafeBoundary>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
