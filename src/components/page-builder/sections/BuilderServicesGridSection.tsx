import Image from 'next/image';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ApiPageSection, ServicesGridSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Services strip with optional left-side hero card (gift-cards style)
/// + a row of icon+label service tiles. Mirrors the homepage's
/// existing ServicesSection layout.
export function BuilderServicesGridSection({ section }: Props) {
  const config = section.config as ServicesGridSectionConfig;
  const services = config.services ?? [];

  const resolveIcon = (name: string): LucideIcon => {
    const pascal = name
      .split(/[-_\s]/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join('');
    const lib = Icons as unknown as Record<string, LucideIcon>;
    return lib[pascal] ?? Icons.Circle;
  };

  return (
    <section className="bg-white py-6 md:py-8">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-4 px-4 md:grid-cols-12 md:gap-6">
        {config.heroCard && (
          <Link
            href={config.heroCard.href}
            aria-label={config.heroCard.imageAlt}
            className="group block aspect-[16/9] overflow-hidden rounded-card shadow-card transition-shadow hover:shadow-card-hover md:col-span-4 md:aspect-auto"
          >
            <div className="relative h-full w-full">
              <Image
                src={config.heroCard.imageUrl}
                alt={config.heroCard.imageAlt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
          </Link>
        )}
        <div
          className={`grid grid-cols-2 gap-4 md:gap-6 ${
            config.heroCard ? 'md:col-span-8 md:grid-cols-4' : 'md:col-span-12 md:grid-cols-4'
          }`}
        >
          {services.map((s, i) => {
            const Icon = resolveIcon(s.icon);
            return (
              <Link
                key={`${s.href}-${i}`}
                href={s.href}
                className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-card border border-border bg-white p-4 text-center transition-shadow hover:shadow-card md:aspect-[4/3]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/10 text-amber">
                  <Icon size={24} aria-hidden />
                </span>
                <span className="font-raleway text-sm font-bold text-navy group-hover:text-amber">
                  {s.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
