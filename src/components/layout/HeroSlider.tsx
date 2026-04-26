'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Slide {
  src: string;
  alt: string;
}

const slides: Slide[] = [
  { src: '/images/hero/slide-world-map.jpg', alt: 'From Africa to the rest of the world' },
  { src: '/images/hero/slide-just-for-you.jpg', alt: 'Just For You — featured African fashion' },
  { src: '/images/hero/slide-member-benefits.jpg', alt: 'Special Member-Only Benefits — Earn points every time you shop' },
  { src: '/images/hero/slide-gift-cards.jpg', alt: 'Gift Cards Available — for corporate customers, anniversaries, birthdays, weddings' },
  { src: '/images/hero/slide-for-her.jpg', alt: 'For Her — Get everything for females at amazing discounts' },
  { src: '/images/hero/slide-for-him.jpg', alt: 'For Him — Maintain class without breaking the bank' },
  { src: '/images/hero/slide-everything-africa.jpg', alt: 'Buy everything made in Africa' },
  { src: '/images/hero/slide-groceries.jpg', alt: 'Groceries & Beverages' },
  { src: '/images/hero/slide-afcfta.webp', alt: 'We support the African Continental Free Trade Agreement — 100% Made in Africa' },
  { src: '/images/hero/slide-shop-now.jpg', alt: 'AfriZoneMart — Shop Now' },
];

const ADVANCE_MS = 5000;
const TRANSITION_MS = 700;

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  // Duplicate first 2 slides at the end for seamless wrap
  const display = [...slides, slides[0], slides[1]];
  const itemPctOfTrack = 100 / display.length;

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, ADVANCE_MS);
    return () => clearTimeout(t);
  }, [index, paused]);

  useEffect(() => {
    if (index === slides.length) {
      const t = setTimeout(() => {
        setAnimate(false);
        setIndex(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setAnimate(true));
        });
      }, TRANSITION_MS);
      return () => clearTimeout(t);
    }
  }, [index]);

  const goTo = (i: number) => {
    setAnimate(true);
    setIndex(i);
  };

  const activeDot = index % slides.length;

  return (
    <div
      className="relative overflow-hidden rounded-card shadow-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Afrizonemart promotions"
    >
      <div
        className="flex"
        style={{
          width: `${display.length * 50}%`,
          transform: `translateX(-${index * itemPctOfTrack}%)`,
          transition: animate ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
        }}
      >
        {display.map((slide, i) => (
          <div
            key={i}
            className="shrink-0 px-1.5"
            style={{ width: `${itemPctOfTrack}%` }}
            aria-hidden={i >= slides.length}
          >
            <div className="overflow-hidden rounded-card">
              <Image
                src={slide.src}
                alt={slide.alt}
                width={1200}
                height={750}
                priority={i < 2}
                sizes="(min-width: 768px) 33vw, 50vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => {
          const active = activeDot === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1} of ${slides.length}`}
              aria-current={active}
              className={`h-2 rounded-full transition-all duration-300 ${
                active ? 'w-6 bg-navy' : 'w-2 bg-white/80 hover:bg-white'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
