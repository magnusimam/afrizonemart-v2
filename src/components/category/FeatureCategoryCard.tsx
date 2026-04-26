import Image from 'next/image';
import Link from 'next/link';

interface FeatureCategoryCardProps {
  name: string;
  image: string;
  href: string;
}

export function FeatureCategoryCard({ name, image, href }: FeatureCategoryCardProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover"
      aria-label={`Shop ${name}`}
    >
      <Image
        src={image}
        alt={name}
        width={1024}
        height={1024}
        className="h-auto w-full transition-transform duration-500 group-hover:scale-105"
      />
    </Link>
  );
}
