import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { ApiPageSection, RewardsTiersSectionConfig } from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Loyalty tier ladder. The 'ladder' layout matches the legacy
/// /continental-rewards page exactly: each tier renders as a wide
/// banner with a coloured header, the tier image on the left, and the
/// intro paragraph + perks list on the right. The 'cards' layout
/// arranges them in a grid for compact pages.
export function BuilderRewardsTiersSection({ section }: Props) {
  const config = section.config as RewardsTiersSectionConfig;
  const tiers = config.tiers ?? [];
  if (tiers.length === 0) return null;

  return (
    <section className="bg-page py-10 md:py-14">
      <div className="mx-auto max-w-site px-4">
        {section.headline && (
          <header className="mb-6 text-center">
            <div
              className="mx-auto h-1 w-12 rounded-full"
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

        {config.layout === 'ladder' ? (
          <div className="flex flex-col gap-6 md:gap-8">
            {tiers.map((tier, i) => (
              <article
                key={`${tier.name}-${i}`}
                className="overflow-hidden rounded-card border border-border bg-white shadow-card"
              >
                <header
                  className="flex items-center justify-between gap-3 px-5 py-3 font-raleway text-lg font-bold uppercase tracking-btn text-white md:text-xl"
                  style={{ backgroundColor: resolveAccentColor(tier.accentColor) }}
                >
                  <span>{tier.name}</span>
                  <span className="text-xs font-sans opacity-90">
                    {tier.minPoints.toLocaleString()}+ pts
                  </span>
                </header>
                <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-12 md:gap-8 md:p-6">
                  {tier.imageUrl && (
                    <div className="md:col-span-7">
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card border border-border">
                        <Image
                          src={tier.imageUrl}
                          alt={tier.imageAlt ?? `${tier.name} loyalty card`}
                          fill
                          sizes="(min-width: 768px) 60vw, 100vw"
                          priority={i === 0}
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex flex-col gap-3 ${
                      tier.imageUrl ? 'md:col-span-5' : 'md:col-span-12'
                    }`}
                  >
                    {tier.intro && (
                      <p className="font-sans text-sm leading-relaxed text-charcoal md:text-base">
                        {tier.intro}
                      </p>
                    )}
                    {tier.perks.length > 0 && (
                      <ul className="flex flex-col gap-2">
                        {tier.perks.map((perk) => (
                          <li
                            key={perk}
                            className="flex items-start gap-2 font-sans text-sm text-charcoal"
                          >
                            <Check
                              size={16}
                              className="mt-0.5 shrink-0"
                              style={{ color: resolveAccentColor(tier.accentColor) }}
                              aria-hidden
                            />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {tier.readMoreHref && tier.readMoreLabel && (
                      <p className="mt-1 font-sans text-xs text-muted">
                        <Link
                          href={tier.readMoreHref}
                          className="font-semibold text-navy hover:underline"
                        >
                          {tier.readMoreLabel} →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {tiers.map((tier, i) => (
              <div
                key={`${tier.name}-${i}`}
                className="flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-sm"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 text-white"
                  style={{ backgroundColor: resolveAccentColor(tier.accentColor) }}
                >
                  <span className="font-raleway text-base font-bold uppercase tracking-btn">
                    {tier.name}
                  </span>
                  <span className="ml-auto font-sans text-xs opacity-90">
                    {tier.minPoints.toLocaleString()}+ pts
                  </span>
                </div>
                {tier.imageUrl && (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={tier.imageUrl}
                      alt={tier.imageAlt ?? `${tier.name} tier`}
                      fill
                      sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {tier.intro && (
                    <p className="font-sans text-sm leading-relaxed text-charcoal">
                      {tier.intro}
                    </p>
                  )}
                  {tier.perks.length > 0 && (
                    <ul className="flex flex-col gap-2 font-sans text-sm text-charcoal">
                      {tier.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <Check
                            size={14}
                            className="mt-1 shrink-0"
                            style={{ color: resolveAccentColor(tier.accentColor) }}
                            aria-hidden
                          />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
