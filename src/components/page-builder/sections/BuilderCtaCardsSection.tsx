import Link from 'next/link';
import type { ApiPageSection, CtaCardsSectionConfig } from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Pair (or trio) of full-width action cards. Each card has a bold
/// headline + supporting line + CTA href, on a coloured background.
/// Used as a "next step" prompt — Continental Rewards uses two:
/// "New customer? Register now" + "Already a customer? Sign in".
export function BuilderCtaCardsSection({ section }: Props) {
  const config = section.config as CtaCardsSectionConfig;
  const cards = config.cards ?? [];
  if (cards.length === 0) return null;

  const colsClass =
    cards.length === 1
      ? 'md:grid-cols-1'
      : cards.length === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-3';

  return (
    <section className="bg-page py-8 md:py-12">
      <div className="mx-auto max-w-site px-4">
        {section.headline && (
          <h2 className="mb-6 text-center font-raleway text-2xl font-bold text-navy md:text-3xl">
            {section.headline}
          </h2>
        )}
        <div className={`grid grid-cols-1 gap-4 ${colsClass} md:gap-6`}>
          {cards.map((c, i) => {
            // Default: first card amber (primary), the rest navy.
            const bgKey = c.background ?? (i === 0 ? 'amber' : 'navy');
            const bg = resolveAccentColor(bgKey);
            // Pick foreground color based on background — amber gets navy
            // text, dark navy/charcoal gets white. Hex falls back to white.
            const textWhite =
              bgKey === 'navy' || bgKey === 'charcoal' || bgKey?.startsWith('#');
            const fg = textWhite ? 'text-white' : 'text-navy';
            const subFg = textWhite ? 'text-white/80' : 'text-navy/80';
            return (
              <Link
                key={`${c.href}-${i}`}
                href={c.href}
                className="flex flex-col items-center gap-1 rounded-card px-6 py-6 text-center font-raleway font-bold shadow-card transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: bg }}
              >
                <span
                  className={`text-xl uppercase tracking-btn md:text-2xl ${fg}`}
                >
                  {c.headline}
                </span>
                {c.subheadline && (
                  <span className={`font-sans text-xs font-normal ${subFg}`}>
                    {c.subheadline}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
