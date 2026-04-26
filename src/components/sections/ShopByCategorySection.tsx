import Link from 'next/link';
import { ShopByCategoryCard } from '@/components/category/ShopByCategoryCard';

interface CardData {
  name: string;
  description: string;
  image: string;
  href: string;
  buttonText?: string;
  imageClassName?: string;
}

const rowOne: CardData[] = [
  {
    name: 'Home Essentials',
    description:
      'Stock up your home with quality home furniture and appliances.',
    image: '/images/shop-by-category/home-essentials.jpeg',
    href: '/shop/home-essentials',
    buttonText: 'Explore',
  },
  {
    name: 'Electrical & Electronic Appliances',
    description: 'Purchase durable electrical appliances for your pleasure.',
    image: '/images/shop-by-category/electrical.png',
    href: '/shop/electrical-electronic',
    imageClassName: 'object-contain p-4',
  },
  {
    name: 'Automobile & Accessories',
    description: 'Automobiles made in Africa for the rest of the world.',
    image: '/images/shop-by-category/automobile.jpg',
    href: '/shop/automobile',
  },
];

const rowTwo: CardData[] = [
  {
    name: 'Raw Materials & Industrial Goods',
    description:
      'Get raw materials for your industrial use both for small & large scale production.',
    image: '/images/shop-by-category/raw-materials.jpg',
    href: '/shop/raw-materials',
  },
  {
    name: 'Construction & Building Materials',
    description: 'Build with confidence, certainty and quality!',
    image: '/images/shop-by-category/construction.jpg',
    href: '/shop/construction',
  },
  {
    name: 'Books',
    description:
      'Stay aware & discover profound insights in the pages of well authored books.',
    image: '/images/shop-by-category/books.jpg',
    href: '/shop/books',
  },
];

const rowThree: CardData[] = [
  {
    name: 'For Her',
    description:
      'Never lose your sense of royalty. Get everything for females at amazing discounts.',
    image: '/images/shop-by-category/for-her.jpg',
    href: '/shop/for-her',
  },
  {
    name: 'For Him',
    description:
      'Maintain class without breaking the bank! Shop all male products available in our store.',
    image: '/images/shop-by-category/for-him.jpg',
    href: '/shop/for-him',
  },
];

export function ShopByCategorySection() {
  return (
    <section>
      <div className="h-2 w-full bg-amber" aria-hidden />

      <div className="w-full bg-navy py-3 text-center">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Shop By Category
        </h2>
      </div>

      <div className="bg-page py-6 md:py-8">
        <div className="mx-auto flex max-w-site flex-col gap-4 px-4 md:gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {rowOne.map((c) => (
              <ShopByCategoryCard key={c.name} {...c} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {rowTwo.map((c) => (
              <ShopByCategoryCard key={c.name} {...c} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {rowThree.map((c) => (
              <ShopByCategoryCard key={c.name} {...c} />
            ))}
          </div>
        </div>
      </div>

      <div className="h-2 w-full bg-amber" aria-hidden />

      <Link
        href="/quotation"
        className="block w-full bg-navy py-3 text-center transition-colors hover:bg-navy-dark"
      >
        <span className="font-raleway text-sm font-bold uppercase tracking-btn text-white md:text-base">
          Request For Quotation —{' '}
          <span className="text-amber">Order In Bulk</span>
        </span>
      </Link>
    </section>
  );
}
