import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

interface ShopByCategoryCardProps {
  name: string;
  description: string;
  image: string;
  href: string;
  buttonText?: string;
  imageClassName?: string;
}

export function ShopByCategoryCard({
  name,
  description,
  image,
  href,
  buttonText = 'Shop Now',
  imageClassName = 'object-cover',
}: ShopByCategoryCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <div className="aspect-[15/8] overflow-hidden bg-page">
        <Image
          src={image}
          alt={name}
          width={1200}
          height={640}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${imageClassName}`}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2 md:p-3">
        <h3 className="line-clamp-2 font-raleway text-[11px] font-bold leading-tight text-charcoal md:text-base">
          {name}
        </h3>
        {/* Description hidden on mobile — too cramped at 3-col widths.
            Reads on tablet+ where there's room. */}
        <p className="hidden flex-1 font-sans text-[11px] leading-snug text-muted md:block md:text-xs">
          {description}
        </p>
        <Link
          href={href}
          className="mt-auto inline-flex items-center justify-center gap-1 self-start rounded-btn bg-navy px-2 py-1 font-raleway text-[9px] font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy md:gap-1.5 md:px-3.5 md:py-1.5 md:text-xs"
        >
          <ShoppingCart size={12} aria-hidden className="md:hidden" />
          <ShoppingCart size={14} aria-hidden className="hidden md:inline-block" />
          <span className="md:inline">{buttonText}</span>
        </Link>
      </div>
    </article>
  );
}
