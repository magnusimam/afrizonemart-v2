import Link from 'next/link';
import { PlacementOrFallbackGrid } from '@/components/product/PlacementOrFallbackGrid';

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
          <PlacementOrFallbackGrid
            placement="shelf_groceries"
            fallbackQuery={{ category: 'groceries' }}
            limit={24}
            skeletonCount={12}
          />
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
