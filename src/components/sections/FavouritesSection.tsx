import Link from 'next/link';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';

interface FavouriteProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  outOfStock?: boolean;
  origin?: string;
}

const favourites: FavouriteProduct[] = [
  // Row 1
  { id: 'fv1', name: 'Fluxe Mini', price: 5000, origin: 'NG' },
  {
    id: 'fv2',
    name: 'Blue Suede Slippers For Men With Gold Plated Chain',
    price: 68000,
    comparePrice: 80000,
    discountPercent: 15,
    origin: 'MA',
  },
  { id: 'fv3', name: 'Ann Chair 20', price: 140000, origin: 'ZA' },
  { id: 'fv4', name: 'AvanGuard Freedom 2', price: 49000, origin: 'KE' },
  {
    id: 'fv5',
    name: 'Trendy Shoes For Men Of Style',
    price: 24000,
    comparePrice: 30000,
    discountPercent: 20,
    origin: 'NG',
  },
  {
    id: 'fv6',
    name: 'TV Stand 109',
    price: 255000,
    comparePrice: 300000,
    discountPercent: 15,
    origin: 'ZA',
  },
  // Row 2
  { id: 'fv7', name: 'We Naturals Honey Nuts Detangler', price: 1300, origin: 'NG' },
  { id: 'fv8', name: 'Vinn Cami Lush', price: 15000, origin: 'NG' },
  { id: 'fv9', name: 'Glynn Day Bed Chaise Lounge', price: 250000, origin: 'KE' },
  { id: 'fv10', name: 'ZeeZom Henna Hair Gloss', price: 2600, origin: 'EG' },
  { id: 'fv11', name: 'Maya Himalaya Facial Scrub', price: 3800, origin: 'NG' },
  { id: 'fv12', name: 'Bi Bi Doll Maroon Lip Pencil', price: 2500, origin: 'NG' },
  // Row 3
  { id: 'fv13', name: 'Luscious We Naturals Peppermint Black Soap (300ml)', price: 3300, origin: 'GH' },
  { id: 'fv14', name: 'Tara Precision Liquid Liner', price: 830, origin: 'NG' },
  { id: 'fv15', name: 'Run Around Freedom 2', price: 49000, origin: 'NG' },
  { id: 'fv16', name: 'Fanda Lipstick', price: 1000, origin: 'NG' },
  { id: 'fv17', name: 'CT 24', price: 85000, origin: 'KE' },
  { id: 'fv18', name: 'We Naturals Moringa Powder Tin', price: 6800, origin: 'NG' },
  // Row 4
  { id: 'fv19', name: 'Maya Curly Hair Kit', price: 8800, origin: 'NG' },
  {
    id: 'fv20',
    name: 'Genuine White Leather Couch',
    price: 215000,
    comparePrice: 280000,
    discountPercent: 23,
    origin: 'MA',
  },
  {
    id: 'fv21',
    name: 'Two Piece Native With White And Vintage Detailing',
    price: 27000,
    comparePrice: 35000,
    discountPercent: 23,
    origin: 'NG',
  },
  { id: 'fv22', name: 'Mayo Herbal Shampoo', price: 7800, origin: 'KE' },
  {
    id: 'fv23',
    name: 'Recals Jacket Unisex',
    price: 4000,
    outOfStock: true,
    origin: 'NG',
  },
  {
    id: 'fv24',
    name: 'Shoes',
    price: 22000,
    comparePrice: 30000,
    discountPercent: 27,
    origin: 'MA',
  },
];

export function FavouritesSection() {
  return (
    <section>
      <div className="w-full bg-amber py-3 text-center">
        <p className="font-raleway text-sm font-bold text-danger md:text-base">
          Don&apos;t Wait!
        </p>
        <p className="font-raleway text-sm font-bold text-navy md:text-base">
          The Time Will Never Be Just Right!
        </p>
      </div>

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {favourites.map((p) => (
            <ProductCardPlaceholder key={p.id} {...p} delivery="1hr" />
          ))}
        </div>

        <div className="mt-6 flex justify-center px-4 md:mt-8">
          <Link
            href="/shop/favourites"
            className="rounded-full bg-amber px-8 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm lg:px-12"
          >
            View All Your Favourite Products Made Affordable For You ›
          </Link>
        </div>
      </div>
    </section>
  );
}
