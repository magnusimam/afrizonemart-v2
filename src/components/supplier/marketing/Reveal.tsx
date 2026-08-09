'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Calm scroll-reveal: fades + lifts its content in the first time it enters
 * the viewport. Honours prefers-reduced-motion (renders fully visible). Use
 * `delay` to stagger siblings. It renders a plain block, so pass the card's
 * own classes via `className` and use it as the element itself.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transform: shown ? 'none' : `translateY(${y}px)`,
      }}
      className={`transition-all duration-700 ease-out ${
        shown ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** A progress bar that grows from 0 to `to`% the first time it's in view. */
export function GrowBar({ to, className = '' }: { to: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setW(to);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setW(to);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <div ref={ref} className={`h-2 w-full overflow-hidden rounded-full bg-page ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber to-amber-dark transition-[width] duration-1000 ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}
