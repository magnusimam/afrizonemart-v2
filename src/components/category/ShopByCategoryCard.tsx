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

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="font-raleway text-sm font-bold text-charcoal md:text-base">
          {name}
        </h3>
        <p className="flex-1 font-sans text-[11px] leading-snug text-muted md:text-xs">
          {description}
        </p>
        <Link
          href={href}
          className="mt-1.5 inline-flex items-center gap-1.5 self-start rounded-btn bg-navy px-3.5 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy md:text-xs"
        >
          <ShoppingCart size={14} aria-hidden />
          {buttonText}
        </Link>
      </div>
    </article>
  );
}
