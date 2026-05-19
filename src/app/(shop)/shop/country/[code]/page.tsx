import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Globe2, Home as HomeIcon } from 'lucide-react';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { Flag } from '@/components/common/Flag';
import { ShopShell } from '@/components/shop/ShopShell';
import { fetchProducts } from '@/lib/api/products';
import { listCategories } from '@/lib/api/categories';
import { COUNTRY_CODES, getCountryBySlug, type CountryCode } from '@/lib/countries';
import type { ListProductsParams } from '@/lib/api/types';

interface PageProps {
  params: { code: string };
  searchParams: {
    page?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    inStock?: string;
    onSale?: string;
    sort?: string;
  };
}

const PAGE_SIZE = 48;
const SORT_VALUES = ['featured', 'newest', 'price-asc', 'price-desc', 'rating'] as const;
type SortValue = (typeof SORT_VALUES)[number];

const COUNTRY_HIGHLIGHTS: Partial<Record<CountryCode, string>> = {
  NG: 'Home of Ankara fashion, Nollywood, and over 200 million tastemakers.',
  KE: 'World-renowned coffee, beadwork, and tech innovation from Nairobi.',
  ZA: 'Wines from Stellenbosch, modern furniture, and rooibos.',
  EG: 'Egyptian cotton, fragrant oils, and ancient skincare wisdom.',
  GH: 'Premium cocoa, kente cloth, and craftsmanship from the Gold Coast.',
  MA: 'Hand-stitched leather, argan oil, and timeless design.',
  ET: 'The birthplace of coffee, plus injera, honey, and natural fabrics.',
  TZ: 'Tinga-tinga art, Zanzibar spices, and Maasai-crafted jewellery.',
  UG: 'Bark cloth, vanilla, and shea-rich beauty staples.',
  RW: 'Cooperative-made baskets, gorilla coffee, and cycling apparel.',
  ZW: 'Stone sculpture, fine cottons, and Sadza-fed culinary tradition.',
  CI: 'Cocoa-rich chocolate, woven cloth, and Akan craft.',
  SN: 'Wax prints, baobab products, and Senegalese hibiscus.',
  CM: 'Bamileke crafts, robusta coffee, and forest honey.',
  ML: 'Mudcloth (bogolan), Tuareg silver, and Saharan textiles.',
};

/// Parse the country page's URL into the same `ListProductsParams`
/// shape used everywhere else, with `origin` pinned by the route
/// segment. Matches the all-products page's parsing rules so the
/// two surfaces stay in lockstep.
function parseFilters(
  sp: PageProps['searchParams'],
  pinnedOrigin: string,
): { apiParams: ListProductsParams; hasAnyFilter: boolean } {
  const requestedPage = Number.parseInt(sp.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
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
      origin: pinnedOrigin,
      category,
      minPrice: Number.isFinite(minPrice) && (minPrice ?? -1) >= 0 ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) && (maxPrice ?? -1) >= 0 ? maxPrice : undefined,
      minRating: Number.isFinite(minRating) && (minRating ?? -1) > 0 ? minRating : undefined,
      inStock,
      onSale,
      sort,
    },
    hasAnyFilter: Boolean(category || minPrice || maxPrice || minRating || inStock || onSale),
  };
}

function buildPageQuery(apiParams: ListProductsParams, page: number): string {
  const sp = new URLSearchParams();
  sp.set('page', String(page));
  if (apiParams.category) sp.set('category', apiParams.category);
  if (apiParams.minPrice !== undefined) sp.set('minPrice', String(apiParams.minPrice));
  if (apiParams.maxPrice !== undefined) sp.set('maxPrice', String(apiParams.maxPrice));
  if (apiParams.minRating !== undefined) sp.set('minRating', String(apiParams.minRating));
  if (apiParams.inStock) sp.set('inStock', 'true');
  if (apiParams.onSale) sp.set('onSale', 'true');
  if (apiParams.sort && apiParams.sort !== 'featured') sp.set('sort', apiParams.sort);
  return sp.toString();
}

export default async function ShopByCountryPage({ params, searchParams }: PageProps) {
  const country = getCountryBySlug(params.code);
  if (!country) notFound();

  const code = country.code as CountryCode;
  const highlight = COUNTRY_HIGHLIGHTS[code] ?? `Authentic products from ${country.name}.`;
  const { apiParams, hasAnyFilter } = parseFilters(searchParams, code);
  const page = apiParams.page ?? 1;

  const [productsResponse, categoriesTree] = await Promise.all([
    fetchProducts(apiParams).catch(() => null),
    listCategories(),
  ]);
  const products = productsResponse?.items ?? [];
  const totalProducts = productsResponse?.pagination.total ?? 0;
  const totalPages = productsResponse?.pagination.pages ?? 1;
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
              <Link href="/shop" className="hover:text-navy">
                Shop
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">{country.name}</span>
            </li>
          </ol>
        </nav>

        <section className="bg-navy text-white">
          <div className="mx-auto flex max-w-site flex-col gap-4 px-4 py-10 md:py-14">
            <div className="flex items-center gap-2">
              <Globe2 size={20} className="text-amber" aria-hidden />
              <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
                Shop By Country
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Flag
                code={country.code}
                title={country.name}
                size="lg"
                className="!h-14 !w-auto rounded-md md:!h-20"
              />
              <div className="flex flex-col gap-1">
                <h1 className="font-raleway text-3xl font-bold leading-tight md:text-5xl">
                  Product Of {country.name}
                </h1>
                <p className="max-w-2xl font-sans text-sm leading-relaxed text-white/80 md:text-lg">
                  {highlight}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <ShopShell
            categories={topLevelCategories}
            total={totalProducts}
            /* Country page pins the country via the route segment.
               Showing the country picker again would let visitors
               uncheck themselves into an empty grid. */
            showCountryFilter={false}
          >
            {totalProducts === 0 ? (
              <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                <p className="font-raleway text-lg font-bold text-navy">
                  {hasAnyFilter
                    ? `No products from ${country.name} match your filters`
                    : `No products from ${country.name} yet`}
                </p>
                <p className="mt-1 font-sans text-sm text-muted">
                  {hasAnyFilter
                    ? 'Try widening your filters on the left, or use Clear all to start over.'
                    : "Check back soon — we're constantly onboarding new makers from across the continent."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
                  {products.map((p) => (
                    <SafeBoundary key={p.id} name="country:card" fallback={null}>
                      <ApiProductCard product={p} />
                    </SafeBoundary>
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Pagination"
                    className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white px-4 py-3 font-sans text-sm"
                  >
                    <span className="text-muted">
                      Page {page} of {totalPages} · showing {products.length} of{' '}
                      {totalProducts.toLocaleString()} products from {country.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {page > 1 ? (
                        <Link
                          href={`/shop/country/${country.slug}?${buildPageQuery(apiParams, page - 1)}`}
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
                          href={`/shop/country/${country.slug}?${buildPageQuery(apiParams, page + 1)}`}
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

          {/* Single CTA into the all-countries directory — replaces the
              previous 8-tile grid (showed an arbitrary slice of the 53
              other nations and felt incomplete now that we cover every
              African country). The directory at /shop/countries is the
              canonical place to browse all of them. */}
          <section className="mt-12 md:mt-16">
            <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-8 text-center shadow-card md:flex-row md:justify-between md:gap-6 md:p-10 md:text-left">
              <div className="flex flex-col gap-1">
                <h2 className="font-raleway text-xl font-bold text-navy md:text-2xl">
                  Browse other countries
                </h2>
                <p className="font-sans text-sm text-muted md:text-base">
                  Discover authentic, locally-made products from all{' '}
                  {COUNTRY_CODES.length} African nations.
                </p>
              </div>
              <Link
                href="/shop/countries"
                className="rounded-full bg-navy px-6 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy"
              >
                See all {COUNTRY_CODES.length} countries →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
