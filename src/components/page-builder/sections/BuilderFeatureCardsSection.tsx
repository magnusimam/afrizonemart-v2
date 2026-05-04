import Image from 'next/image';
import Link from 'next/link';
import type { ApiPageSection, FeatureCardsSectionConfig } from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Large-card grid with image + name + description + CTA. Admin sets
/// cardsPerRow (1–4) and the card list. Used for both Shop-By-Category
/// and Mixed-Categories on the homepage; lets admins build any similar
/// "feature shelf" without a new section type.
export function BuilderFeatureCardsSection({ section }: Props) {
  const config = section.config as FeatureCardsSectionConfig;
  const cards = config.cards ?? [];
  if (cards.length === 0) return null;

  const cols = Math.min(Math.max(config.cardsPerRow ?? 3, 1), 4);
  const desktopColsClass =
    cols === 1
      ? 'lg:grid-cols-1'
      : cols === 2
        ? 'lg:grid-cols-2'
        : cols === 4
          ? 'lg:grid-cols-4'
          : 'lg:grid-cols-3';

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="mx-auto max-w-site px-4">
        {section.headline && (
          <header className="mb-6">
            <div
              className="h-1 w-12 rounded-full"
              style={{ backgroundColor: resolveAccentColor(section.accentColor) }}
              aria-hidden
            />
            <h2 className="mt-3 font-raleway text-2xl font-bold text-navy md:text-3xl">
              {section.headline}
            </h2>
            {section.subheadline && (
              <p className="mt-1 font-sans text-sm text-muted md:text-base">
                {section.subheadline}
              </p>
            )}
          </header>
        )}

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${desktopColsClass}`}>
          {cards.map((c, i) => (
            <Link
              key={`${c.href}-${i}`}
              href={c.href}
              className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-sm transition-shadow hover:shadow-card"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={c.imageUrl}
                  alt={c.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="font-raleway text-lg font-bold text-navy group-hover:text-amber">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="line-clamp-3 font-sans text-sm text-muted">{c.description}</p>
                )}
                {c.ctaLabel && (
                  <span className="mt-auto inline-flex items-center justify-center self-start rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white group-hover:bg-amber group-hover:text-navy">
                    {c.ctaLabel}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
