'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryCard } from '@/components/category/CategoryCard';

interface CategoryItem {
  name: string;
  image: string;
  href: string;
}

/// Default category strip. Page builder may override via `categories`
/// prop without changing the section layout/scroll behaviour.
const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: 'For Her', image: '/images/categories/for-her.jpg', href: '/shop/for-her' },
  { name: 'For Him', image: '/images/categories/for-him.jpg', href: '/shop/for-him' },
  { name: 'Beer, Wines & Spirit', image: '/images/categories/beer.jpg', href: '/shop/beer-wines-spirit' },
  { name: 'Interior Decor', image: '/images/categories/interior-decor.jpg', href: '/shop/interior-decor' },
  { name: 'Groceries, Food & Beverages', image: '/images/categories/groceries.jpg', href: '/shop/groceries' },
  { name: 'Art & Collectibles', image: '/images/categories/art.jpg', href: '/shop/art-collectibles' },
  { name: 'Beauty & Personal Care', image: '/images/categories/beauty.jpg', href: '/shop/beauty' },
];

interface Props {
  categories?: CategoryItem[];
}

export function CategoriesSection({ categories: categoriesProp }: Props = {}) {
  const categories =
    categoriesProp && categoriesProp.length > 0 ? categoriesProp : DEFAULT_CATEGORIES;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('a');
    const cardWidth = card instanceof HTMLElement ? card.offsetWidth : 220;
    el.scrollBy({ left: dir === 'left' ? -(cardWidth + 16) : cardWidth + 16, behavior: 'smooth' });
  };

  return (
    <section className="bg-white py-6 md:py-8">
      {/* On mobile the chevrons are hidden — touch scroll + snap is
          the native gesture. They reappear on md+ where mouse users
          can't fling the strip. Without this the chevrons hog ~88px
          of horizontal space on small phones and squeeze the cards. */}
      <div className="mx-auto flex max-w-site items-stretch gap-2 px-2 md:gap-3 md:px-4">
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Previous categories"
          className="hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full bg-navy/5 text-navy transition-colors hover:bg-navy hover:text-white md:flex"
        >
          <ChevronLeft size={28} strokeWidth={2.5} aria-hidden />
        </button>

        <div
          ref={scrollRef}
          className="grid flex-1 auto-cols-[42%] grid-flow-col gap-3 overflow-x-auto scroll-smooth pb-1 [scroll-snap-type:x_mandatory] [&>a]:[scroll-snap-align:start] sm:auto-cols-[30%] md:auto-cols-[22%] md:gap-4 lg:auto-cols-fr lg:grid-cols-7 lg:grid-flow-row"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map((c) => (
            <CategoryCard key={c.name} {...c} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Next categories"
          className="hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full bg-navy/5 text-navy transition-colors hover:bg-navy hover:text-white md:flex"
        >
          <ChevronRight size={28} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </section>
  );
}
