import Link from 'next/link';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { COUNTRY_CODES } from '@/lib/countries';
import { SafeBoundary } from '@/components/common/SafeBoundary';

const SAMPLE_NAMES = [
  'Maya Himalaya Facial Scrub', 'Tara Bronzer', 'Fanda Lipstick',
  'Glynn Day Bed Chaise Lounge', 'Tastic Long Grain Rice 5kg', 'Smoked CatFish 250g',
  'CT 24 Wrist Watch', 'Maya Curly Hair Kit', 'Genuine White Leather Couch',
  'Big Bites Lemon 60cl', 'Ground Fenugreek 1kg', 'Ann Chair 20',
  'AvanGuard Freedom 2', 'Mayo Herbal Shampoo', 'We Naturals Moringa Powder',
  'Two Piece Native', 'TV Stand 109', 'Recals Jacket Unisex',
  'Bridie Day Bed', 'Five Crowns Sparkling Brut', 'Coffee Mate Rich Brown',
  'Cway Nutri-Yo Yoghurt', 'Spectra Cocoa Powder', 'Trendy Shoes For Men',
];

const SAMPLE_PRODUCTS = Array.from({ length: 24 }, (_, i) => {
  const origins = COUNTRY_CODES;
  const origin = origins[i % origins.length];
  return {
    id: `s${i + 1}`,
    name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
    price: 1200 + i * 850 + (i % 3) * 1000,
    comparePrice: i % 4 === 0 ? 2000 + i * 1100 : undefined,
    discountPercent: i % 4 === 0 ? 15 + (i % 3) * 5 : undefined,
    outOfStock: i % 11 === 0,
    origin,
  };
});

export default function ShopPage() {
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
                <ShopToolbar total={SAMPLE_PRODUCTS.length} />
              </SafeBoundary>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
                {SAMPLE_PRODUCTS.map((p) => (
                  <SafeBoundary key={p.id} name="shop:card" fallback={null}>
                    <ProductCardPlaceholder {...p} />
                  </SafeBoundary>
                ))}
              </div>

              <nav aria-label="Pagination" className="flex items-center justify-center gap-1 pt-4">
                <button className="rounded-input border border-border bg-white px-3 py-2 font-raleway text-xs font-bold text-navy hover:border-navy">
                  ←
                </button>
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    className={`h-9 w-9 rounded-input font-raleway text-xs font-bold ${
                      p === 1 ? 'bg-navy text-white' : 'border border-border bg-white text-navy hover:border-navy'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <span className="px-2 font-sans text-xs text-muted">...</span>
                <button className="h-9 w-9 rounded-input border border-border bg-white font-raleway text-xs font-bold text-navy hover:border-navy">
                  12
                </button>
                <button className="rounded-input border border-border bg-white px-3 py-2 font-raleway text-xs font-bold text-navy hover:border-navy">
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
