'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ApiPageSection, HeroSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

const TRANSITION_MS = 700;

/// Hero carousel rendered from a builder section. Each slide has its
/// own image + headline + optional CTA. Falls back to a static first
/// slide when there's only one (no autoplay, no dots).
export function BuilderHeroSection({ section }: Props) {
  const config = section.config as HeroSectionConfig;
  const slides = config.slides ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length <= 1 || (config.autoplayMs ?? 0) <= 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), config.autoplayMs);
    return () => clearInterval(t);
  }, [paused, slides.length, config.autoplayMs]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-label={section.headline ?? 'Hero'}
      className="relative w-full overflow-hidden bg-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-[420px] transition-transform md:h-[520px] lg:h-[600px]"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(100 / slides.length) * index}%)`,
          transitionDuration: `${TRANSITION_MS}ms`,
        }}
      >
        {slides.map((slide, i) => {
          const align =
            slide.textAlign === 'center'
              ? 'items-center text-center'
              : slide.textAlign === 'right'
                ? 'items-end text-right'
                : 'items-start text-left';
          return (
            <div
              key={`${slide.imageUrl}-${i}`}
              className="relative h-full"
              style={{ width: `${100 / slides.length}%` }}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.imageAlt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
              <div
                className={`relative z-10 mx-auto flex h-full max-w-site flex-col justify-center gap-3 px-6 ${align}`}
              >
                {slide.eyebrow && (
                  <span className="font-raleway text-xs font-bold uppercase tracking-btn text-amber">
                    {slide.eyebrow}
                  </span>
                )}
                <h2 className="font-raleway text-3xl font-extrabold leading-tight text-white drop-shadow md:text-4xl lg:text-5xl">
                  {slide.headline}
                </h2>
                {slide.subheadline && (
                  <p className="max-w-2xl font-sans text-sm text-white/90 md:text-base">
                    {slide.subheadline}
                  </p>
                )}
                {slide.ctaLabel && slide.ctaHref && (
                  <Link
                    href={slide.ctaHref}
                    className="mt-2 inline-flex items-center justify-center self-start rounded-btn bg-amber px-5 py-2.5 font-raleway text-sm font-bold uppercase tracking-btn text-navy hover:bg-white"
                  >
                    {slide.ctaLabel}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {config.showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1} of ${slides.length}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-amber' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
