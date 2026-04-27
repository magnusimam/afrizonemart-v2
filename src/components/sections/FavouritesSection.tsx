import Link from 'next/link';
import { PlacementOrFallbackGrid } from '@/components/product/PlacementOrFallbackGrid';

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
          <PlacementOrFallbackGrid
            placement="staff_picks"
            fallbackQuery={{ sort: 'newest' }}
            limit={24}
            skeletonCount={12}
            delivery="1hr"
          />
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
