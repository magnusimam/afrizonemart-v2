import { ProductGridFromQuery } from '@/components/product/ProductGridFromQuery';
import { FeatureCategoryCard } from '@/components/category/FeatureCategoryCard';

const featuredCategories = [
  { name: 'For Her', image: '/images/featured/for-her.jpg', href: '/shop/for-her' },
  { name: 'For Him', image: '/images/featured/for-him.jpg', href: '/shop/for-him' },
  {
    name: 'Home Essentials',
    image: '/images/featured/home-essentials.jpg',
    href: '/shop/home-essentials',
  },
];

export function DealsSection() {
  return (
    <section>
      <div className="w-full bg-navy py-3 text-center">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Today&apos;s Deals Just For You!
        </h2>
      </div>

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          <ProductGridFromQuery query={{ onSale: true, limit: 6 }} delivery="2hrs" />
        </div>
      </div>

      <div className="bg-white pb-8 md:pb-12">
        <div className="mx-auto grid max-w-site grid-cols-1 gap-4 px-4 md:grid-cols-3 md:gap-6">
          {featuredCategories.map((c) => (
            <FeatureCategoryCard key={c.name} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
