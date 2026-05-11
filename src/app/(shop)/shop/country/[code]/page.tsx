import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Globe2, Home as HomeIcon } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { Flag } from '@/components/common/Flag';
import { fetchProducts } from '@/lib/api/products';
import {
  COUNTRIES,
  COUNTRY_CODES,
  getCountryBySlug,
  type CountryCode,
} from '@/lib/countries';

interface PageProps {
  params: { code: string };
  searchParams: { page?: string };
}

const PAGE_SIZE = 48;

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

export default async function ShopByCountryPage({ params, searchParams }: PageProps) {
  const country = getCountryBySlug(params.code);
  if (!country) notFound();

  const code = country.code as CountryCode;
  const highlight = COUNTRY_HIGHLIGHTS[code] ?? `Authentic products from ${country.name}.`;

  // Real products from the API — filtered by the ISO-2 origin column
  // that the CSV importer + admin product form both write to.
  const requestedPage = Number.parseInt(searchParams.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const productsResponse = await fetchProducts({
    origin: code,
    limit: PAGE_SIZE,
    page,
  }).catch(() => null);
  const products = productsResponse?.items ?? [];
  const totalProducts = productsResponse?.pagination.total ?? 0;
  const totalPages = productsResponse?.pagination.pages ?? 1;
  const otherCountries = COUNTRY_CODES.filter((c) => c !== code).slice(0, 8);

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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <SafeBoundary name="country:filters" fallback={null}>
                <FiltersSidebar />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
              <SafeBoundary name="country:toolbar" fallback={null}>
                <ShopToolbar total={totalProducts} />
              </SafeBoundary>

              {totalProducts === 0 ? (
                <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
                  <p className="font-raleway text-lg font-bold text-navy">
                    No products from {country.name} yet
                  </p>
                  <p className="mt-1 font-sans text-sm text-muted">
                    Check back soon — we&apos;re constantly onboarding new makers
                    from across the continent.
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
                            href={`/shop/country/${country.slug}?page=${page - 1}`}
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
                            href={`/shop/country/${country.slug}?page=${page + 1}`}
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

          <section className="mt-12 md:mt-16">
            <h2 className="mb-4 font-raleway text-xl font-bold text-navy md:text-2xl">
              Discover other African countries
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4 lg:grid-cols-8">
              {otherCountries.map((c) => {
                const cc = COUNTRIES[c];
                return (
                  <Link
                    key={c}
                    href={`/shop/country/${cc.slug}`}
                    className="flex flex-col items-center gap-2 rounded-card border border-border bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <Flag code={cc.code} title={cc.name} size="lg" className="!h-7 !w-auto rounded-md" />
                    <span className="font-raleway text-xs font-bold text-navy">
                      {cc.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
