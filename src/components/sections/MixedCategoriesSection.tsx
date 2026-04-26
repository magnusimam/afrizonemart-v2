import { ShopByCategoryCard } from '@/components/category/ShopByCategoryCard';

const cards = [
  {
    name: 'For Babies',
    description:
      'A healthy child is a second future. Keep your baby healthy with our safe-to-use baby products.',
    image: '/images/services/baby.jpg',
    href: '/shop/babies',
    buttonText: 'Shop Now',
  },
  {
    name: 'Hair & Accessories',
    description:
      'Give your hair the best treatment with our wide range of hair products and accessories.',
    image: '/images/services/hair.jpg',
    href: '/shop/hair-accessories',
    buttonText: 'Shop Now',
  },
  {
    name: 'Digital Content',
    description:
      'Games, Stock Images, Audio Books, Templates, Music and many more.',
    image: '/images/services/digital.jpg',
    href: '/shop/digital',
    buttonText: 'Explore',
  },
  {
    name: 'Phone Accessories',
    description:
      'Shop for affordable phone accessories and ensure your smart phone is never found wanting.',
    image: '/images/services/phone.png',
    href: '/shop/phone-accessories',
    buttonText: 'Shop Now',
    imageClassName: 'object-contain p-4',
  },
];

export function MixedCategoriesSection() {
  return (
    <section className="bg-white pb-6 md:pb-10">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {cards.map((c) => (
          <ShopByCategoryCard key={c.name} {...c} />
        ))}
      </div>
    </section>
  );
}
