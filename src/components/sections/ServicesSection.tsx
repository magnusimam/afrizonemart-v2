import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, GraduationCap, ShieldCheck, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Service {
  name: string;
  href: string;
  Icon: LucideIcon;
}

const services: Service[] = [
  { name: 'Trade Assurance', href: '/services/trade-assurance', Icon: ShieldCheck },
  { name: 'AfWBM Program', href: '/services/afwbm-program', Icon: GraduationCap },
  { name: 'Product Monitoring', href: '/services/product-monitoring', Icon: BarChart3 },
  { name: 'Logistics Services', href: '/services/logistics', Icon: Truck },
];

export function ServicesSection() {
  return (
    <section className="bg-white py-6 md:py-8">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-4 px-4 md:grid-cols-12 md:gap-6">
        <Link
          href="/gift-cards"
          aria-label="Gift Cards Available"
          className="group block aspect-[16/9] overflow-hidden rounded-card shadow-card transition-shadow hover:shadow-card-hover md:col-span-4 md:aspect-auto"
        >
          <Image
            src="/images/services/gift-cards.jpg"
            alt="Gift Cards Available — for corporate customers, anniversaries, birthdays, weddings, house openings"
            width={1536}
            height={960}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="grid grid-cols-2 gap-4 md:col-span-8 md:grid-cols-4 md:gap-6">
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
