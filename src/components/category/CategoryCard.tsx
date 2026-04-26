import Image from 'next/image';
import Link from 'next/link';

interface CategoryCardProps {
  name: string;
  image: string;
  href: string;
}

export function CategoryCard({ name, image, href }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="aspect-[5/4] overflow-hidden bg-page">
        <Image
          src={image}
          alt={name}
          width={500}
          height={400}
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 items-center justify-center bg-navy px-2 py-1.5 text-center">
        <p className="font-raleway text-[10px] font-bold uppercase leading-tight text-white md:text-[11px] lg:text-xs">
          {name}
        </p>
      </div>
    </Link>
  );
}
