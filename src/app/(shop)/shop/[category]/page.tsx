import Link from 'next/link';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { COUNTRY_CODES } from '@/lib/countries';
import { SITE_NAME, absUrl } from '@/lib/seo';
import type { Metadata } from 'next';

interface PageProps {
  params: { category: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = CATEGORY_TITLES[params.category] ?? {
    title: params.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Browse African-made ${params.category.replace(/-/g, ' ')} on Afrizonemart — verified products from across the continent.`,
  };
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

const CATEGORY_TITLES: Record<string, { title: string; description: string }> = {
  beauty: { title: 'Beauty & Personal Care', description: 'Skincare, makeup, and grooming from across the continent.' },
  'for-her': { title: 'For Her', description: 'Curated picks for women — fashion, beauty, accessories.' },
  'for-him': { title: 'For Him', description: 'Curated picks for men — apparel, grooming, gadgets.' },
  groceries: { title: 'Groceries, Food & Beverages', description: 'African pantry essentials, drinks, and snacks.' },
  books: { title: 'Books', description: 'Stories, knowledge, and culture from African authors.' },
  'home-essentials': { title: 'Home Essentials', description: 'Cleaning, kitchenware, and household basics.' },
};

const CATEGORY_PRODUCTS = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `cat-${i + 1}`,
    name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
    price: 800 + i * 1300,
    comparePrice: i % 3 === 0 ? 1500 + i * 1500 : undefined,
    discountPercent: i % 3 === 0 ? 20 + (i % 4) * 5 : undefined,
    outOfStock: i % 14 === 0,
    origin: COUNTRY_CODES[i % COUNTRY_CODES.length],
  }));

const SAMPLE_NAMES = [
  'Tara Bronzer', 'Fanda Lipstick', 'Maya Himalaya Facial Scrub',
  'Snow Total Coverage Foundation', 'Bi Bi Doll Browpencil', 'Opera Silky Pressed Powder',
  'ZeeZom Henna Hair Gloss', 'Luscious Black Soap', 'We Naturals Honey Detangler',
  'Bridie Day Bed', 'Two Piece Native', 'Genuine Leather Couch',
];

export default function CategoryPage({ params }: PageProps) {
  const cat = CATEGORY_TITLES[params.category] ?? {
    title: params.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: 'Browse this category on AfriZoneMart.',
  };

  const products = CATEGORY_PRODUCTS(20);

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
                <ShopToolbar total={products.length} />
              </SafeBoundary>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
                {products.map((p) => (
                  <SafeBoundary key={p.id} name="category:card" fallback={null}>
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
