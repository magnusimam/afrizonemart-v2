import {
  BadgeCheck,
  Globe2,
  Headphones,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TrustItem {
  Icon: LucideIcon;
  title: string;
  description: string;
}

const items: TrustItem[] = [
  {
    Icon: PackageSearch,
    title: 'Track Your Package',
    description: 'Watch your order travel from the seller to your doorstep in real time.',
  },
  {
    Icon: Globe2,
    title: 'World Wide Delivery',
    description: 'With sites in 80+ Languages, we ship to over 200 Countries and Regions.',
  },
  {
    Icon: ShieldCheck,
    title: 'Safe Payment',
    description: 'Pay with BitCOIN, 30+ currencies and other World popular payment methods.',
  },
  {
    Icon: BadgeCheck,
    title: 'Shop With Confidence',
    description: 'Our buyer protection covers your purchase from Click to Delivery.',
  },
  {
    Icon: Headphones,
    title: '24/7 Help Center',
    description: 'Round-the-clock assistance for a secure shopping experience.',
  },
];

export function TrustBarSection() {
  return (
    <section className="bg-navy py-8 md:py-12">
      <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
        {items.map(({ Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-3 rounded-card bg-white p-4 text-center shadow-card md:p-5"
          >
            <Icon
              size={40}
              strokeWidth={1.5}
              className="text-navy"
              aria-hidden
            />
            <h3 className="font-raleway text-sm font-bold text-navy md:text-base">
              {title}
            </h3>
            <p className="font-sans text-[11px] leading-snug text-muted md:text-xs">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
