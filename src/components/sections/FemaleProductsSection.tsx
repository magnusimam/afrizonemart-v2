import Link from 'next/link';
import { ProductGridFromQuery } from '@/components/product/ProductGridFromQuery';

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
          <ProductGridFromQuery query={{ category: 'beauty', limit: 6 }} buttonVariant="pink" />
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
