'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Split-background slider hero, modelled on the "Car Slider" reference
 * the user shared. 40% accent panel on the left, 60% navy panel on
 * the right; giant model name floats behind the car; "AfriZone"
 * cursive kicker top-left; specs row + pill CTA at the bottom;
 * vertical numbered pagination on the right edge.
 *
 * Hardcoded slides for now — moves to the CMS in Phase 12. The shape
 * mirrors what the CMS will emit so swapping the source is a one-line
 * change in the data fetcher.
 */
interface AutomobileSlide {
  id: string;
  brand: string;
  model: string;
  /** Hex accent — drives the left panel, the active pagination
   *  border, the CTA outline, and the spec values. Picked from a
   *  curated palette below; tied loosely to the car body colour. */
  accent: string;
  imageUrl: string;
  productHref: string;
  stats: {
    year: number;
    mileageKm: number;
    engineCc: number;
  };
}

const SLIDES: AutomobileSlide[] = [
  {
    id: 'lamborghini-aventador',
    brand: 'Lamborghini',
    model: 'Aventador',
    accent: '#EFCA29', // matches the yellow body
    imageUrl: '/images/automobile/car-1.png',
    productHref: '/shop/automobile',
    stats: { year: 2022, mileageKm: 5400, engineCc: 6500 },
  },
  {
    id: 'opel-kapitan',
    brand: 'Opel',
    model: 'Kapitän',
    accent: '#D23F3D', // matches the vintage red body
    imageUrl: '/images/automobile/car-2.png',
    productHref: '/shop/automobile',
    stats: { year: 1958, mileageKm: 89000, engineCc: 2500 },
  },
  {
    id: 'bugatti-chiron',
    brand: 'Bugatti',
    model: 'Chiron',
    accent: '#00D2FA', // matches the blue body
    imageUrl: '/images/automobile/car-3.png',
    productHref: '/shop/automobile',
    stats: { year: 2021, mileageKm: 2800, engineCc: 7993 },
  },
];

const NAVY = '#0D1F4E';
const AUTO_ADVANCE_MS = 8000;

export function AutomobileHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[active];

  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      AUTO_ADVANCE_MS,
    );
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured automobiles"
      className="relative flex w-full flex-col overflow-hidden text-white"
      style={{ minHeight: '640px' }}
    >
      {/* SPLIT BACKGROUND — accent panel left (40%) + navy panel
          right (60%). Both transition smoothly between slides. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-0 transition-colors duration-700"
        style={{ width: '40%', background: slide.accent }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0"
        style={{ width: '60%', background: NAVY }}
      />
      {/* On mobile we collapse the split to a single navy panel and
          let the accent show through as a top strip — keeps the
          layout readable on narrow screens. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-0 h-1.5 md:hidden"
        style={{ background: slide.accent }}
      />
      <div aria-hidden className="absolute inset-0 z-0 bg-navy md:hidden" />

      {/* GIANT MODEL NAME — floats behind everything as a watermark.
          Tracks each letter so we can stagger their entrance. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
      >
        <span
          key={`big-${slide.id}`}
          className="select-none whitespace-nowrap font-raleway font-extrabold uppercase tracking-tighter text-white/[0.08]"
          style={{
            fontSize: 'clamp(120px, 22vw, 280px)',
            lineHeight: 0.85,
            paddingBottom: '80px',
            animation: 'azm-hero-bigtext-in 700ms ease-out',
          }}
        >
          {slide.model}
        </span>
      </div>

      {/* CURSIVE KICKER — small Kaushan Script word top-left, sits
          near the top edge of the section. */}
      <span
        aria-hidden
        className="absolute left-6 top-6 z-10 select-none text-white/95 md:left-10 md:top-8"
        style={{
          fontFamily: '"Kaushan Script", cursive',
          fontSize: 'clamp(28px, 3.4vw, 44px)',
          textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        Afrizonemart
      </span>

      {/* CAR ZONE — flex-1 fills the available vertical space MINUS
          the specs zone below. The image is height-capped so it can
          never bleed into the specs row no matter the source aspect
          ratio. */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pt-20 md:pt-24">
        <div
          key={`img-${slide.id}`}
          className="relative flex h-full w-full items-center justify-center"
          style={{
            animation:
              'azm-hero-car-in 800ms cubic-bezier(0.4,-0.2,0.1,1.4) both',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl}
            alt={`${slide.brand} ${slide.model}`}
            className="max-h-[340px] w-auto max-w-[88%] object-contain md:max-h-[400px] md:max-w-[70%] lg:max-h-[440px] lg:max-w-[62%]"
            style={{ filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.45))' }}
          />
        </div>
      </div>

      {/* SPECS ZONE — sits at the bottom of the flex column, never
          overlaps the car. Self-contained padding + responsive layout. */}
      <div
        className="relative z-10 shrink-0 border-t border-white/5 bg-black/20 px-4 py-5 backdrop-blur-[2px] md:px-10 md:py-6"
        style={{ animation: 'azm-hero-text-in 800ms 200ms ease-out both' }}
      >
        <div
          className="mx-auto flex max-w-site flex-wrap items-center justify-center gap-x-6 gap-y-3 md:flex-nowrap md:justify-start md:gap-x-12 md:pl-[36%] md:pr-20"
          style={{ color: slide.accent }}
        >
          <SpecValue
            label={String(slide.stats.year)}
            unit="Year"
            accent={slide.accent}
          />
          <SpecValue
            label={slide.stats.mileageKm.toLocaleString()}
            unit="km"
            accent={slide.accent}
          />
          <SpecValue
            label={slide.stats.engineCc.toLocaleString()}
            unit="cc"
            accent={slide.accent}
          />
          <Link
            href={slide.productHref}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2 font-sans text-xs font-semibold transition-colors hover:bg-white hover:text-navy md:px-8 md:py-2.5 md:text-sm"
            style={{
              border: `1.5px solid ${slide.accent}`,
              color: slide.accent,
              background: 'transparent',
            }}
          >
            Discover Now
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>

      {/* VERTICAL NUMBERED PAGINATION — right edge, stacked. Active
          number gets a circle border + brighter type. */}
      <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex md:right-6 lg:right-10">
        {SLIDES.map((s, i) => {
          const isActive = i === active;
          const num = String(i + 1).padStart(2, '0');
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1} — ${s.brand} ${s.model}`}
              aria-current={isActive ? 'true' : undefined}
              className="grid h-12 w-12 place-content-center rounded-full font-raleway text-sm font-semibold transition-all"
              style={{
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                fontSize: isActive ? 18 : 14,
                border: isActive
                  ? `1.5px solid ${s.accent}`
                  : '1.5px solid transparent',
              }}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* MOBILE PAGINATION — horizontal pill dots near the top right. */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 md:hidden">
        {SLIDES.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={isActive ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${
                isActive ? 'w-6' : 'w-1.5 bg-white/40'
              }`}
              style={isActive ? { background: s.accent } : undefined}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes azm-hero-bigtext-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 0.08; transform: translateY(0); }
        }
        @keyframes azm-hero-car-in {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes azm-hero-text-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="azm-hero-"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

/** Spec value — large bold number + small lowercase label inline. */
function SpecValue({
  label,
  unit,
  accent,
}: {
  label: string;
  unit: string;
  accent: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span
        className="font-raleway text-xl font-bold tabular-nums md:text-2xl"
        style={{ color: accent }}
      >
        {label}
      </span>
      <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-white/65 md:text-xs">
        {unit}
      </span>
    </span>
  );
}
