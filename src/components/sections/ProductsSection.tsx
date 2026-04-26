import Link from 'next/link';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';

interface PlaceholderProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  outOfStock?: boolean;
  origin?: string;
}

const products: PlaceholderProduct[] = [
  // Row 1
  { id: 'p1', name: 'Big Bites Lemon 60cl', price: 150, origin: 'NG' },
  { id: 'p2', name: 'On Ice Tea Lemon 1 Litre', price: 435, origin: 'KE' },
  { id: 'p3', name: 'CN Olivita 100% Lychee Fruit Juice 1L', price: 350, outOfStock: true, origin: 'EG' },
  { id: 'p4', name: 'Golden Penny Choc-Oh Spread', price: 450, origin: 'NG' },
  { id: 'p5', name: 'Malta Guinness', price: 500, origin: 'NG' },
  { id: 'p6', name: 'Tastic Long Grain Rice 2kg', price: 2200, origin: 'ZA' },
  // Row 2
  { id: 'p7', name: 'Apple Wholesome Foods Moringa Leaf Powder 100g', price: 6200, origin: 'KE' },
  { id: 'p8', name: 'Spectra Cocoa Powder', price: 500, outOfStock: true, origin: 'GH' },
  { id: 'p9', name: 'Mattanis 25cl', price: 450, origin: 'NG' },
  { id: 'p10', name: 'Five Crowns Natural Sweet Rose Aperitif 75cl', price: 5974, origin: 'ZA' },
  { id: 'p11', name: 'Golden Penny Semovita 4kg', price: 2000, origin: 'NG' },
  { id: 'p12', name: 'Golden Penny Classic Flour 4kg', price: 3500, origin: 'NG' },
  // Row 3
  { id: 'p13', name: 'Nestle Cerelac Maize-Mai with Milk 6kg', price: 1499, origin: 'CM' },
  { id: 'p14', name: 'Four Cousins Sparkling Brut 750ml × 6', price: 5974, origin: 'ZA' },
  { id: 'p15', name: 'Infinity Instant Puff Puff Mix 90g × 6', price: 1750, origin: 'NG' },
  { id: 'p16', name: 'Big Ginger Lemon 60cl × 6', price: 1500, origin: 'NG' },
  { id: 'p17', name: 'Golden Penny Granulated Sugar 500g', price: 500, origin: 'NG' },
  { id: 'p18', name: 'Power Pasta Spaghetti — Regular 500g', price: 1100, origin: 'NG' },
  // Row 4
  { id: 'p19', name: 'Big Reserved 60cl × 12 (3 pack)', price: 1500, origin: 'NG' },
  { id: 'p20', name: 'Smoked Catfish 25g', price: 500, comparePrice: 1200, origin: 'GH' },
  { id: 'p21', name: 'Pepsi-Cola 60cl × 12', price: 1500, origin: 'NG' },
  { id: 'p22', name: 'Life Continental Lager 60cl × 4 pack', price: 1800, origin: 'NG' },
  { id: 'p23', name: 'Today Decaf', price: 700, comparePrice: 999, outOfStock: true, origin: 'ET' },
  { id: 'p24', name: 'Tastic Long Grain Rice 5kg', price: 6700, origin: 'ZA' },
];

export function ProductsSection() {
  return (
    <section>
      <div className="w-full bg-navy py-3 text-center">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Groceries, Beverages &amp; Drinks
        </h2>
      </div>

      <div className="w-full bg-amber py-2.5 text-center">
        <p className="mx-auto max-w-site px-4 font-sans text-xs leading-snug text-navy md:text-sm">
          All deliveries are made between 30mins to 3hrs from time of order, from
          6am to 6pm daily including <strong>SUNDAYS!</strong>
        </p>
      </div>

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {products.map((p) => (
            <ProductCardPlaceholder key={p.id} {...p} />
          ))}
        </div>

        <div className="mt-6 flex justify-center px-4 md:mt-8">
          <Link
            href="/shop/groceries"
            className="rounded-full bg-amber px-8 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm lg:px-12"
          >
            View More — Groceries, Beverages &amp; Drinks ›
          </Link>
        </div>
      </div>
    </section>
  );
}
