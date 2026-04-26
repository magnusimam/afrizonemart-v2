import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { FeatureCategoryCard } from '@/components/category/FeatureCategoryCard';

interface DealProduct {
  id: string;
  name: string;
  price: number;
  comparePrice: number;
  discountPercent: number;
  outOfStock?: boolean;
  origin?: string;
}

const deals: DealProduct[] = [
  {
    id: 'd1',
    name: 'Cway Nutri-Yo Sweetened Yoghurt 500ml × 12',
    price: 5700,
    comparePrice: 6000,
    discountPercent: 5,
    origin: 'NG',
  },
  {
    id: 'd2',
    name: 'Ground Fenugreek 1kg',
    price: 3500,
    comparePrice: 3608,
    discountPercent: 3,
    origin: 'ET',
  },
  {
    id: 'd3',
    name: 'Nescafe Dolce Gusto Latte Vanilla Coffee Pods',
    price: 3650,
    comparePrice: 3967,
    discountPercent: 8,
    outOfStock: true,
    origin: 'CM',
  },
  {
    id: 'd4',
    name: 'Coffee Mate Rich Brown Chocolate Coffee 1.5kg',
    price: 8500,
    comparePrice: 9239,
    discountPercent: 8,
    outOfStock: true,
    origin: 'KE',
  },
  {
    id: 'd5',
    name: '5Alive Pulpy Orange Drink 30cl × 12',
    price: 2520,
    comparePrice: 5040,
    discountPercent: 50,
    origin: 'NG',
  },
  {
    id: 'd6',
    name: 'Smoked CatFish 250g',
    price: 1100,
    comparePrice: 1294,
    discountPercent: 15,
    origin: 'GH',
  },
];

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
          {deals.map((p) => (
            <ProductCardPlaceholder key={p.id} {...p} delivery="2hrs" />
          ))}
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
