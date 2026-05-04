import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ApiPageSection, FinalCtaSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Highlighted "next step" panel — eyebrow + bold headline + body +
/// 1-2 CTA buttons. Renders as a bordered card on a contrasting
/// background. Used as the closer at the bottom of landing pages.
export function BuilderFinalCtaSection({ section }: Props) {
  const config = section.config as FinalCtaSectionConfig;
  const bg = config.background ?? 'navy';

  // Background style + foreground color picking. Hex is treated like
  // navy (assume dark). 'amber' gets navy text; everything else white.
  const isDark = bg !== 'amber';
  const bgClass =
    bg === 'gradient-navy'
      ? 'bg-gradient-to-br from-navy via-navy to-[#1f2d6c]'
      : '';
  const bgStyle =
    !bgClass && bg.startsWith('#')
      ? { backgroundColor: bg }
      : !bgClass && bg !== 'amber'
        ? { backgroundColor: 'var(--color-navy, #0D1F4E)' }
        : !bgClass
          ? { backgroundColor: 'var(--color-amber, #F5A623)' }
          : {};

  return (
    <section className="mx-auto mt-12 max-w-site px-4">
      <div
        className={`overflow-hidden rounded-card p-1 shadow-card ${bgClass}`}
        style={bgStyle}
      >
        <div
          className="rounded-[10px] px-6 py-10 text-center md:px-12 md:py-14"
          style={{
            backgroundColor: isDark ? 'rgba(13, 31, 78, 0.95)' : undefined,
          }}
        >
          {config.eyebrow && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn ${
                isDark ? 'bg-amber/20 text-amber' : 'bg-navy/20 text-navy'
              }`}
            >
              <Sparkles size={12} aria-hidden />
              {config.eyebrow}
            </span>
          )}
          <h2
            className={`mt-3 font-raleway text-2xl font-bold leading-tight md:text-4xl ${
              isDark ? 'text-white' : 'text-navy'
            }`}
          >
            {config.headline}
          </h2>
          {config.body && (
            <p
              className={`mx-auto mt-3 max-w-xl font-sans text-sm md:text-base ${
                isDark ? 'text-white/80' : 'text-navy/80'
              }`}
            >
              {config.body}
            </p>
          )}
          {(config.primaryCta || config.secondaryCta) && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {config.primaryCta && (
                <Link
                  href={config.primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-btn bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-transform hover:-translate-y-0.5"
                >
                  {config.primaryCta.label} <ArrowRight size={14} aria-hidden />
                </Link>
              )}
              {config.secondaryCta && (
                <Link
                  href={config.secondaryCta.href}
                  className={`inline-flex items-center gap-2 rounded-btn border px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn transition-colors ${
                    isDark
                      ? 'border-white/30 text-white hover:bg-white hover:text-navy'
                      : 'border-navy/30 text-navy hover:bg-navy hover:text-white'
                  }`}
                >
                  {config.secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
