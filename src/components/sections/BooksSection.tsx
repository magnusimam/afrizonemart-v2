import Link from 'next/link';
import { PlacementOrFallbackGrid } from '@/components/product/PlacementOrFallbackGrid';

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
          <PlacementOrFallbackGrid
            placement="shelf_books"
            fallbackQuery={{ category: 'books' }}
            limit={12}
          />
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
