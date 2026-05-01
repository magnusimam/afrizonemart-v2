import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { COUNTRY_CODES } from '@/lib/countries';
import { listCategories } from '@/lib/api/categories';
import { SITE_NAME, absUrl } from '@/lib/seo';
import type { Metadata } from 'next';

interface PageProps {
  params: { category: string; subcategory: string };
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

const SAMPLE_NAMES = [
  'Tara Bronzer', 'Fanda Lipstick', 'Maya Himalaya Facial Scrub',
  'Snow Total Coverage Foundation', 'Bi Bi Doll Browpencil', 'Opera Silky Pressed Powder',
  'ZeeZom Henna Hair Gloss', 'Luscious Black Soap', 'We Naturals Honey Detangler',
];

const SAMPLE_PRODUCTS = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sub-${i + 1}`,
    name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
    price: 800 + i * 1300,
    comparePrice: i % 3 === 0 ? 1500 + i * 1500 : undefined,
    discountPercent: i % 3 === 0 ? 20 + (i % 4) * 5 : undefined,
    outOfStock: i % 14 === 0,
    origin: COUNTRY_CODES[i % COUNTRY_CODES.length],
  }));

export default async function SubcategoryPage({ params }: PageProps) {
  const pair = await resolvePair(params.category, params.subcategory);
  if (!pair) notFound();

  const products = SAMPLE_PRODUCTS(16);

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
                <ShopToolbar total={products.length} />
              </SafeBoundary>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
                {products.map((p) => (
                  <SafeBoundary key={p.id} name="subcategory:card" fallback={null}>
                    <ProductCardPlaceholder {...p} />
                  </SafeBoundary>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
