import Link from 'next/link';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';

interface Book {
  id: string;
  name: string;
  price?: number;
  outOfStock?: boolean;
  origin?: string;
}

const books: Book[] = [
  // Row 1
  { id: 'bk1', name: 'You Must Set Forth At Dawn: A Memoir by Wole Soyinka, 2006', price: 2150, origin: 'NG' },
  { id: 'bk2', name: "Why Don't You Carve Other Animals by Yvonne Vera", price: 22000, origin: 'ZW' },
  {
    id: 'bk3',
    name: 'Native Life In South Africa Before And Since The European Boer Rebellion by Solomon Tshekisho Plaatje',
    price: 24250,
    origin: 'ZA',
  },
  { id: 'bk4', name: 'Destiny Formula by Ayodeji Awosika', price: 16150, origin: 'NG' },
  {
    id: 'bk5',
    name: 'Season Of Crimson Blossom (2015) by Abubakar Adam Ibrahim',
    price: 10540,
    origin: 'NG',
  },
  { id: 'bk6', name: 'No Longer At Ease by Chinua Achebe', price: 36480, origin: 'NG' },
  // Row 2
  { id: 'bk7', name: 'Author House Of The Crazy Nigerian', price: 2000, origin: 'NG' },
  { id: 'bk8', name: 'The Ultimate Nigeria Cookbook by Chef Chiebadanwa', price: 27800, origin: 'NG' },
  {
    id: 'bk9',
    name: 'Daughters Female Husbands by Ifi Amadiume',
    price: 19000,
    origin: 'NG',
  },
  {
    id: 'bk10',
    name: 'Use Your Difference To Make A Difference by Tayo Rockson',
    price: 24600,
    origin: 'NG',
  },
  { id: 'bk11', name: 'Constitution Of The Republic Of Mali', origin: 'ML' },
  {
    id: 'bk12',
    name: 'Known And Strange Things by Teju Cole',
    price: 19950,
    origin: 'NG',
  },
];

export function BooksSection() {
  return (
    <section>
      <div className="w-full bg-navy py-3 text-center">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Come For The Book, Leave With The Knowledge
        </h2>
      </div>

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {books.map((b) => (
            <ProductCardPlaceholder key={b.id} {...b} />
          ))}
        </div>

        <div className="mt-6 flex justify-center px-4 md:mt-8">
          <Link
            href="/shop/books"
            className="rounded-full bg-amber px-8 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm lg:px-12"
          >
            View — All Books ›
          </Link>
        </div>
      </div>
    </section>
  );
}
