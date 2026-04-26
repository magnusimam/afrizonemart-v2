import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';

interface BigProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  origin?: string;
}

const products: BigProduct[] = [
  {
    id: 'bp1',
    name: 'Chest Of Drawers',
    price: 75000,
    comparePrice: 95000,
    discountPercent: 21,
    origin: 'NG',
  },
  { id: 'bp2', name: 'Eboin Chaise Lounge', price: 110000, origin: 'KE' },
  { id: 'bp3', name: 'Glynn Z Master Stone Mosaic Oil Painting', price: 15000, origin: 'MA' },
  { id: 'bp4', name: 'CT 24', price: 85000, origin: 'KE' },
  { id: 'bp5', name: 'Bridie Day Bed - Chaise Lounge', price: 250000, origin: 'ZA' },
  { id: 'bp6', name: 'Maya Multipurpose Liquid Soap', price: 800, origin: 'NG' },
];

export function PurchaseBigSection() {
  return (
    <section>
      <div className="w-full bg-navy py-3 text-center">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Purchase Big. Save Big.
        </h2>
      </div>

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {products.map((p) => (
            <ProductCardPlaceholder key={p.id} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
