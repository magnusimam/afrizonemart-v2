import Link from 'next/link';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';

interface FemaleProduct {
  id: string;
  name: string;
  price: number;
  origin?: string;
}

const products: FemaleProduct[] = [
  { id: 'fp1', name: 'Fanda Lipstick', price: 1000, origin: 'NG' },
  { id: 'fp2', name: 'Bi Bi Doll Browpencil', price: 800, origin: 'NG' },
  { id: 'fp3', name: 'Tara Half-Dual Powder Palette', price: 4500, origin: 'EG' },
  { id: 'fp4', name: 'Opera Silky Pressed Powder', price: 3500, origin: 'KE' },
  { id: 'fp5', name: 'Tara Bronzer', price: 3200, origin: 'EG' },
  { id: 'fp6', name: 'Snow Total Coverage Foundation', price: 4800, origin: 'ZA' },
];

export function FemaleProductsSection() {
  return (
    <section>
      <div className="w-full bg-pink py-3 text-center">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Be Style. Be You.
        </h2>
      </div>

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {products.map((p) => (
            <ProductCardPlaceholder key={p.id} {...p} buttonVariant="pink" />
          ))}
        </div>

        <div className="mt-6 flex justify-center px-4 md:mt-8">
          <Link
            href="/shop/female"
            className="rounded-full bg-amber px-8 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-pink hover:text-white md:text-sm lg:px-12"
          >
            View More — Female Products ›
          </Link>
        </div>
      </div>
    </section>
  );
}
