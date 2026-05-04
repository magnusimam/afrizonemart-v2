import Image from 'next/image';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { BarChart3, GraduationCap, ShieldCheck, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Service {
  name: string;
  href: string;
  Icon: LucideIcon;
}

interface ServiceInput {
  name: string;
  href: string;
  /// lucide-react icon name in kebab-case ("shield-check", "truck",
  /// etc.). Resolved to the matching LucideIcon component below.
  icon?: string;
}

const DEFAULT_SERVICES: Service[] = [
  { name: 'Trade Assurance', href: '/services/trade-assurance', Icon: ShieldCheck },
  { name: 'AfWBM Program', href: '/services/afwbm-program', Icon: GraduationCap },
  { name: 'Product Monitoring', href: '/services/product-monitoring', Icon: BarChart3 },
  { name: 'Logistics Services', href: '/services/logistics', Icon: Truck },
];

const DEFAULT_HERO = {
  src: '/images/services/gift-cards.jpg',
  alt: 'Gift Cards Available — for corporate customers, anniversaries, birthdays, weddings, house openings',
  href: '/gift-cards',
};

interface Props {
  services?: ServiceInput[];
  heroCard?: { src: string; alt: string; href: string } | null;
}

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Icons.Circle;
  const pascal = name
    .split(/[-_\s]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join('');
  const lib = Icons as unknown as Record<string, LucideIcon>;
  return lib[pascal] ?? Icons.Circle;
}

export function ServicesSection({ services: servicesProp, heroCard = DEFAULT_HERO }: Props = {}) {
  const services: Service[] =
    servicesProp && servicesProp.length > 0
      ? servicesProp.map((s) => ({ name: s.name, href: s.href, Icon: resolveIcon(s.icon) }))
      : DEFAULT_SERVICES;
  return (
    <section className="bg-white py-6 md:py-8">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-4 px-4 md:grid-cols-12 md:gap-6">
        {heroCard && (
          <Link
            href={heroCard.href}
            aria-label={heroCard.alt}
            className="group block aspect-[16/9] overflow-hidden rounded-card shadow-card transition-shadow hover:shadow-card-hover md:col-span-4 md:aspect-auto"
          >
            <Image
              src={heroCard.src}
              alt={heroCard.alt}
              width={1536}
              height={960}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        )}

        <div
          className={`grid grid-cols-2 gap-4 md:gap-6 ${
            heroCard ? 'md:col-span-8 md:grid-cols-4' : 'md:col-span-12 md:grid-cols-4'
          }`}
        >
          {services.map(({ name, href, Icon }) => (
            <Link
              key={name}
              href={href}
              className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-card bg-[#111F32] p-4 text-center text-white shadow-card transition-colors hover:bg-navy md:aspect-auto"
            >
              <Icon
                size={36}
                strokeWidth={1.5}
                aria-hidden
                className="text-amber transition-transform duration-300 group-hover:scale-110"
              />
              <p className="font-raleway text-[11px] font-bold uppercase tracking-btn md:text-xs">
                {name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
