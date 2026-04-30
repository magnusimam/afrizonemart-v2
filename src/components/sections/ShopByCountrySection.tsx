import Image from 'next/image';
import Link from 'next/link';
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from '@/lib/countries';
import { SafeBoundary } from '@/components/common/SafeBoundary';

/**
 * Shop By Country — twin counter-scrolling marquee rows.
 *
 * Row 1 slides left, Row 2 slides right. Each row duplicates its tiles
 * inline so the translate-X animation loops seamlessly (when the first
 * copy reaches the edge, the second copy is already visible at the
 * starting position — no visible jump).
 *
 * Pure-CSS keyframes via a <style jsx> block — no JS runtime, works
 * in server components, no client bundle cost.
 */
export function ShopByCountrySection() {
  const half = Math.ceil(COUNTRY_CODES.length / 2);
  const rowA = COUNTRY_CODES.slice(0, half);
  const rowB = COUNTRY_CODES.slice(half);

  return (
    <section>
      <div className="w-full bg-navy py-3 text-center md:py-4">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Shop By Country
        </h2>
      </div>

      <div className="bg-white py-8 md:py-10">
        <div className="mx-auto max-w-site px-4">
          <p className="mx-auto mb-6 max-w-2xl text-center font-sans text-sm leading-relaxed text-muted md:mb-8 md:text-base">
            Discover authentic, locally-made products from {COUNTRY_CODES.length}+
            African nations — each verified by Afrizonemart and delivered worldwide.
          </p>
        </div>

        {/* Marquee rows live edge-to-edge — no max-width — so flags
            can drift in/out of the viewport. */}
        <div className="flex flex-col gap-3 md:gap-4">
          <SafeBoundary name="home:country-marquee:a" fallback={null}>
            <CountryMarqueeRow codes={rowA} direction="left" />
          </SafeBoundary>
          <SafeBoundary name="home:country-marquee:b" fallback={null}>
            <CountryMarqueeRow codes={rowB} direction="right" />
          </SafeBoundary>
        </div>

        <div className="mx-auto max-w-site px-4">
          <div className="mt-6 flex justify-center md:mt-8">
            <Link
              href="/shop"
              className="rounded-full border-2 border-navy bg-white px-6 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
            >
              Explore All Products Across Africa →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

interface CountryMarqueeRowProps {
  codes: CountryCode[];
  direction: 'left' | 'right';
}

function CountryMarqueeRow({ codes, direction }: CountryMarqueeRowProps) {
  // Duplicate the list inline so the keyframe loop (0 → -50%) lands
  // back on a flag at exactly the same x-position — visually seamless.
  const tiles = [...codes, ...codes];
  const animationName =
    direction === 'left' ? 'azm-marquee-left' : 'azm-marquee-right';

  return (
    <div
      // overflow-hidden clips the marquee on all sides, but py-3 reserves
      // vertical room INSIDE the box so a hovered pill's lift + shadow
      // stays inside the visible region instead of being clipped at the
      // top/bottom edge. Setting overflow-y to "visible" doesn't help —
      // browsers compute it as `auto` whenever overflow-x is `hidden`.
      className="group/marquee relative overflow-hidden py-3 md:py-4"
      // Edge fade — flags fade in/out at the viewport edges so they
      // don't pop in/out abruptly.
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)',
        maskImage:
          'linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)',
      }}
    >
      <div
        className="flex w-max gap-3 md:gap-4"
        style={{
          animation: `${animationName} 60s linear infinite`,
        }}
      >
        {tiles.map((code, i) => (
          <CountryPill key={`${code}-${i}`} code={code} />
        ))}
      </div>

      {/* Hover-pause + reduced-motion handled in globals.css — moving
          the rules into a server-rendered <style> block triggered a
          hydration mismatch (the `>` selector char gets HTML-encoded
          on the server but raw on the client). Static CSS in
          globals.css avoids this entirely. */}
    </div>
  );
}

function CountryPill({ code }: { code: CountryCode }) {
  const c = COUNTRIES[code];
  const flagSrc = `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  return (
    <Link
      href={`/shop/country/${c.slug}`}
      className="group/pill flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 shadow-card transition-all hover:-translate-y-0.5 hover:border-navy hover:shadow-card-hover md:gap-2.5 md:px-4 md:py-2"
    >
      <span className="relative h-5 w-7 overflow-hidden rounded-sm md:h-6 md:w-8">
        <Image
          src={flagSrc}
          alt=""
          width={80}
          height={54}
          sizes="32px"
          className="h-full w-full object-cover"
        />
      </span>
      <span className="font-raleway text-xs font-bold text-navy md:text-sm">
        {c.name}
      </span>
    </Link>
  );
}
