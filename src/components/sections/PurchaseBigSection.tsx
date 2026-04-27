import { ProductGridFromQuery } from '@/components/product/ProductGridFromQuery';

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
          <ProductGridFromQuery query={{ category: 'interior-decor', limit: 6 }} />
        </div>
      </div>
    </section>
  );
}
