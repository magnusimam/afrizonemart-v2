import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Globe2, Home as HomeIcon } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import {
  COUNTRIES,
  COUNTRY_CODES,
  getCountryBySlug,
  type CountryCode,
} from '@/lib/countries';

interface PageProps {
  params: { code: string };
}

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

const COUNTRY_PRODUCTS = (count: number, origin: CountryCode) =>
  Array.from({ length: count }, (_, i) => ({
    id: `country-${origin}-${i + 1}`,
    name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
    price: 1200 + i * 1100,
    comparePrice: i % 3 === 0 ? 2400 + i * 1300 : undefined,
    discountPercent: i % 3 === 0 ? 15 + (i % 4) * 5 : undefined,
    outOfStock: i % 13 === 0,
    origin,
  }));

const SAMPLE_NAMES = [
  'Premium Local Coffee 250g', 'Handwoven Tote Bag', 'Artisan Honey Jar',
  'Cotton Print Dress', 'Hand-carved Wooden Bowl', 'Spiced Tea Pack',
  'Beaded Bracelet Set', 'Leather Sandals', 'Hibiscus Drink 1L',
  'Wax Print Headwrap', 'Nut Butter 200g', 'Hand Soap Bar',
];

export default function ShopByCountryPage({ params }: PageProps) {
  const country = getCountryBySlug(params.code);
  if (!country) notFound();

  const code = country.code as CountryCode;
  const highlight = COUNTRY_HIGHLIGHTS[code] ?? `Authentic products from ${country.name}.`;
  const products = COUNTRY_PRODUCTS(16, code);
  const otherCountries = COUNTRY_CODES.filter((c) => c !== code).slice(0, 8);

  return (
    <>
      <Header />
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
              <span className="text-6xl md:text-8xl" aria-hidden>
                {country.flag}
              </span>
              <div className="flex flex-col gap-1">
                <h1 className="font-raleway text-3xl font-bold leading-tight md:text-5xl">
                  Made in {country.name}
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
              <FiltersSidebar />
            </div>

            <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
              <ShopToolbar total={products.length} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCardPlaceholder key={p.id} {...p} />
                ))}
              </div>
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
                    <span className="text-3xl" aria-hidden>{cc.flag}</span>
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
      <Footer />
      <ChatBubble />
    </>
  );
}
