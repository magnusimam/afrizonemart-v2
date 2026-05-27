import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Globe2, Home as HomeIcon } from 'lucide-react';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { Flag } from '@/components/common/Flag';
import { CrossLinkChips } from '@/components/seo/CrossLinkChips';
import { fetchProducts } from '@/lib/api/products';
import { listCategories } from '@/lib/api/categories';
import { fetchSiteContent } from '@/lib/site-content';
import {
  COUNTRIES,
  COUNTRY_CODES,
  getCountryBySlug,
  type CountryCode,
} from '@/lib/countries';
import { SITE_NAME, SITE_URL, metaDescription } from '@/lib/seo';

/**
 * Country × category landing page — the programmatic SEO surface.
 *
 * URL: `/shop/country/<country-slug>/<category-slug>`. Each combo is
 * a real indexable page targeting long-tail intent like "Nigerian
 * groceries" or "Kenyan beauty products" — niches where global
 * marketplaces don't rank.
 *
 * Copy is admin-editable via `/admin/landing-pages`. Each page reads
 * two content slots and falls back to a templated default if the
 * admin hasn't customised:
 *   • `content.shop.cc.<countrySlug>.<categorySlug>.headline`
 *   • `content.shop.cc.<countrySlug>.<categorySlug>.intro`
 *
 * Internal-linking: every page cross-links to OTHER categories from
 * this country and OTHER countries that ship this category, plus the
 * parent country/category hubs. That's the link equity flowing through
 * to deep product pages.
 */

interface PageProps {
  params: { code: string; category: string };
}

const PRODUCT_LIMIT = 48;
/// Other-category / other-country chip caps so the link block doesn't
/// blow up to 50+ items on heavy pages.
const CROSS_LINKS_CAP = 12;

interface ResolvedCombo {
  country: ReturnType<typeof getCountryBySlug>;
  category: { id: string; slug: string; name: string; parentId: string | null };
  categories: Array<{ id: string; slug: string; name: string; parentId: string | null }>;
}

async function resolveCombo(
  params: PageProps['params'],
): Promise<ResolvedCombo | null> {
  const country = getCountryBySlug(params.code);
  if (!country) return null;
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === params.category);
  if (!category) return null;
  return { country, category, categories };
}

function defaultHeadline(countryName: string, categoryName: string): string {
  return `${categoryName} from ${countryName}`;
}

function defaultIntro(countryName: string, categoryName: string): string {
  return (
    `Discover authentic ${categoryName.toLowerCase()} made in ${countryName}. ` +
    `Every product is sourced from verified ${countryName} suppliers and ships ` +
    `worldwide through ${SITE_NAME}. Compare prices, read details, and order ` +
    `directly from the makers — no middlemen, no guesswork.`
  );
}

function keyFor(countrySlug: string, categorySlug: string, field: 'headline' | 'intro'): string {
  return `content.shop.cc.${countrySlug}.${categorySlug}.${field}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await resolveCombo(params);
  if (!resolved || !resolved.country) {
    return { title: 'Page not found', robots: { index: false, follow: true } };
  }
  const { country, category } = resolved;
  const content = await fetchSiteContent();
  const headline = content.getText(
    keyFor(country.slug, category.slug, 'headline'),
    defaultHeadline(country.name, category.name),
  );
  const intro = content.getLongText(
    keyFor(country.slug, category.slug, 'intro'),
    defaultIntro(country.name, category.name),
  );
  return {
    title: `${headline} | ${SITE_NAME}`,
    description: metaDescription(intro),
    alternates: { canonical: `/shop/country/${country.slug}/${category.slug}` },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: headline,
      description: metaDescription(intro),
      url: `${SITE_URL}/shop/country/${country.slug}/${category.slug}`,
    },
  };
}

/// Statically pre-generate the FEATURED country × top-level category
/// combos so Google finds them via the sitemap and Vercel caches them
/// hot. Other combos render on demand.
export async function generateStaticParams() {
  try {
    const cats = await listCategories();
    const tops = cats.filter((c) => !c.parentId);
    const params: Array<{ code: string; category: string }> = [];
    for (const code of COUNTRY_CODES) {
      const country = COUNTRIES[code];
      for (const c of tops) {
        params.push({ code: country.slug, category: c.slug });
      }
    }
    return params;
  } catch {
    return [];
  }
}

export const revalidate = 3600;

export default async function CountryCategoryLandingPage({ params }: PageProps) {
  const resolved = await resolveCombo(params);
  if (!resolved || !resolved.country) notFound();
  const { country, category, categories } = resolved;
  const code = country.code as CountryCode;

  const content = await fetchSiteContent();
  const headline = content.getText(
    keyFor(country.slug, category.slug, 'headline'),
    defaultHeadline(country.name, category.name),
  );
  const intro = content.getLongText(
    keyFor(country.slug, category.slug, 'intro'),
    defaultIntro(country.name, category.name),
  );

  const productsResponse = await fetchProducts({
    origin: code,
    category: category.slug,
    limit: PRODUCT_LIMIT,
    page: 1,
  }).catch(() => null);
  const products = productsResponse?.items ?? [];
  const totalProducts = productsResponse?.pagination.total ?? 0;

  /// Internal-linking blocks. Other top-level categories from this
  /// country, and other featured countries shipping this category.
  const topLevels = categories.filter((c) => !c.parentId && c.slug !== category.slug);
  const otherCategories = topLevels.slice(0, CROSS_LINKS_CAP);
  const otherCountries = COUNTRY_CODES.filter((c) => c !== code)
    .slice(0, CROSS_LINKS_CAP)
    .map((c) => COUNTRIES[c]);

  const canonicalUrl = `${SITE_URL}/shop/country/${country.slug}/${category.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        name: headline,
        description: metaDescription(intro),
        url: canonicalUrl,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
          {
            '@type': 'ListItem',
            position: 3,
            name: country.name,
            item: `${SITE_URL}/shop/country/${country.slug}`,
          },
          { '@type': 'ListItem', position: 4, name: category.name, item: canonicalUrl },
        ],
      },
    ],
  };

  /// Thin-content guard: a combo with no products gets `noindex` so we
  /// don't ask Google to index an empty page. The page still renders
  /// (linked from cross-link blocks), just unsubmittable to the SERP.
  const isThin = totalProducts === 0;

  return (
    <>
      {isThin ? <meta name="robots" content="noindex,follow" /> : null}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
              <Link href={`/shop/country/${country.slug}`} className="hover:text-navy">
                {country.name}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">{category.name}</span>
            </li>
          </ol>
        </nav>

        <section className="bg-navy text-white">
          <div className="mx-auto flex max-w-site flex-col gap-4 px-4 py-10 md:py-14">
            <div className="flex items-center gap-2">
              <Globe2 size={20} className="text-amber" aria-hidden />
              <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
                {country.name} · {category.name}
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
                  {headline}
                </h1>
                <p className="max-w-2xl font-sans text-sm leading-relaxed text-white/85 md:text-base">
                  {intro}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-site space-y-10 px-4 py-8 md:py-12">
          {/* Product grid (or thin-content message) */}
          {totalProducts === 0 ? (
            <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
              <p className="font-raleway text-lg font-bold text-navy">
                No {category.name.toLowerCase()} from {country.name} yet
              </p>
              <p className="mt-1 font-sans text-sm text-muted">
                We&apos;re onboarding new makers across the continent. In the
                meantime, browse {category.name.toLowerCase()} from other
                African countries below.
              </p>
            </div>
          ) : (
            <section>
              <header className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-raleway text-xl font-bold text-navy md:text-2xl">
                  Browse {totalProducts} {category.name.toLowerCase()} from {country.name}
                </h2>
                <Link
                  href={`/shop/country/${country.slug}`}
                  className="font-raleway text-xs font-semibold uppercase tracking-btn text-navy hover:text-amber"
                >
                  All from {country.name} →
                </Link>
              </header>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {products.map((p) => (
                  <SafeBoundary key={p.id} name="country-cat:card" fallback={null}>
                    <ApiProductCard product={p} />
                  </SafeBoundary>
                ))}
              </div>
            </section>
          )}

          {/* Internal-linking — uses the shared CrossLinkChips. Each
              self-hides when its list is empty. */}
          <CrossLinkChips
            title={`More from ${country.name}`}
            hint={`Other categories sourced from ${country.name}.`}
            chips={otherCategories.map((c) => ({
              href: `/shop/country/${country.slug}/${c.slug}`,
              label: `${c.name} from ${country.name}`,
            }))}
          />

          <CrossLinkChips
            title={`${category.name} from other African countries`}
            hint={`Compare ${category.name.toLowerCase()} sourced across the continent.`}
            chips={otherCountries.map((c) => ({
              href: `/shop/country/${c.slug}/${category.slug}`,
              label: `${category.name} from ${c.name}`,
              prefix: c.flag,
            }))}
          />
        </div>
      </main>
    </>
  );
}
