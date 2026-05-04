import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { HeroLiveStats } from '@/components/sections/HeroLiveStats';
import { ProductGridFromQuery } from '@/components/product/ProductGridFromQuery';
import { PlacementShelf } from '@/components/product/PlacementShelf';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Special Discounts | Afrizonemart',
  description:
    'Get special discounts on everything Made in Africa. Beauty, fashion, food, electronics, home & decor — discounted across the board.',
};

interface Shelf {
  /** Section title shown in the coloured band. */
  title: string;
  /** Tag/eyebrow above the title. */
  eyebrow: string;
  /** Tailwind classes for the band. */
  bandClass: string;
  /** Category slug feeding the API filter. */
  category?: string;
  /** Number of cards per shelf. */
  limit?: number;
  /** "Shop more" link href. */
  shopAllHref: string;
}

const SHELVES_TOP: Shelf[] = [
  {
    title: 'Beauty',
    eyebrow: 'Up to 50% OFF',
    bandClass: 'bg-[#E11D74] text-white',
    category: 'beauty',
    shopAllHref: '/shop/beauty',
  },
  {
    title: 'Fashion',
    eyebrow: 'Up to 40% OFF',
    bandClass: 'bg-[#7C3AED] text-white',
    category: 'fashion',
    shopAllHref: '/shop/fashion',
  },
  {
    title: 'Food & Groceries',
    eyebrow: 'Up to 30% OFF',
    bandClass: 'bg-[#16A34A] text-white',
    category: 'groceries',
    shopAllHref: '/shop/groceries',
  },
];

const SHELVES_BOTTOM: Shelf[] = [
  {
    title: 'Home & Decor',
    eyebrow: 'Up to 35% OFF',
    bandClass: 'bg-[#0EA5E9] text-white',
    category: 'interior-decor',
    shopAllHref: '/shop/interior-decor',
  },
  {
    title: 'Books & Media',
    eyebrow: 'Up to 25% OFF',
    bandClass: 'bg-[#F59E0B] text-navy',
    category: 'books',
    shopAllHref: '/shop/books',
  },
  {
    title: 'All Specials',
    eyebrow: 'Hand-picked deals',
    bandClass: 'bg-navy text-white',
    shopAllHref: '/shop',
  },
];

export default function ChristmasMarketPage() {
  return (
    <>
      <main className="bg-page pb-16">
        {/* Hero — "Premium Vault" treatment.
            • Rotating amber/gold gradient ring around the card (CSS @property
              + conic-gradient — falls back to a static gold ring on browsers
              that don't animate custom props).
            • Two physical-feeling stickers floating off the corners: a
              circular "Up to 50% OFF" medallion top-left, a scalloped BNPL
              note bottom-right.
            • Soft amber radial glow underneath for depth. */}
        <section className="relative bg-page pt-6 md:pt-10">
          {/* faint dotted pattern peeking around the card edges */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.06]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #0D1F4E 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />

          <div className="relative mx-auto max-w-site px-4 pb-2">
            {/* Outer glow ring */}
            <div className="hero-shine relative rounded-[18px] p-[3px]">
              {/* Inner card */}
              <div className="relative overflow-hidden rounded-[15px] bg-navy">
                <Image
                  src="/images/discount/hero-2026.jpg"
                  alt="Get special discounts today"
                  width={2400}
                  height={650}
                  priority
                  className="h-auto w-full object-cover"
                />
                {/* subtle vignette so corners don't compete with stickers */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    boxShadow: 'inset 0 0 80px rgba(13, 31, 78, 0.35)',
                  }}
                />
              </div>

              {/* Sticker 1 — discount medallion (top-left, peeks off corner) */}
              <div
                className="pointer-events-none absolute -left-3 -top-4 z-10 md:-left-6 md:-top-6"
                aria-hidden
              >
                <div
                  className="flex h-20 w-20 -rotate-12 items-center justify-center rounded-full bg-amber shadow-card md:h-28 md:w-28"
                  style={{ boxShadow: '0 8px 24px rgba(251, 172, 52, 0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
                >
                  <div className="flex h-[88%] w-[88%] flex-col items-center justify-center rounded-full border-[2px] border-dashed border-navy/40">
                    <span className="font-raleway text-[8px] font-bold uppercase leading-none tracking-btn text-navy md:text-[10px]">
                      Up to
                    </span>
                    <span className="font-raleway text-2xl font-extrabold leading-none text-navy md:text-4xl">
                      50%
                    </span>
                    <span className="font-raleway text-[8px] font-bold uppercase leading-none tracking-btn text-navy md:text-[10px]">
                      Off
                    </span>
                  </div>
                </div>
              </div>

              {/* Sticker 2 — BNPL scalloped note (bottom-right) */}
              <div
                className="pointer-events-none absolute -bottom-5 right-2 z-10 rotate-[6deg] md:-bottom-6 md:right-6"
                aria-hidden
              >
                <div
                  className="bg-white px-3 py-1.5 shadow-card md:px-4 md:py-2"
                  style={{
                    // Wavy scalloped edges via radial-gradient mask
                    WebkitMaskImage:
                      'radial-gradient(circle at 6px 50%, transparent 5px, black 6px), radial-gradient(circle at calc(100% - 6px) 50%, transparent 5px, black 6px)',
                    WebkitMaskComposite: 'source-in',
                    maskImage:
                      'radial-gradient(circle at 6px 50%, transparent 5px, black 6px), radial-gradient(circle at calc(100% - 6px) 50%, transparent 5px, black 6px)',
                    maskComposite: 'intersect',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-[#dc2626] px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-white md:text-xs">
                      Buy Now
                    </span>
                    <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-charcoal md:text-xs">
                      Pay Later
                    </span>
                    <span className="font-sans text-[9px] text-muted md:text-[10px]">at checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live stats row */}
          <SafeBoundary name="special:hero-stats" fallback={null}>
            <HeroLiveStats />
          </SafeBoundary>

          {/* Soft floating glow below the hero */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-8 mx-auto h-24 max-w-3xl rounded-[100%] bg-amber/30 blur-3xl"
          />

          <style>{`
            @property --hero-angle {
              syntax: '<angle>';
              initial-value: 0deg;
              inherits: false;
            }
            .hero-shine {
              background:
                conic-gradient(from var(--hero-angle, 0deg),
                  #FBAC34 0deg,
                  #FFE6A8 90deg,
                  #B58308 180deg,
                  #FBAC34 270deg,
                  #FFE6A8 360deg);
              animation: hero-spin 9s linear infinite;
            }
            @keyframes hero-spin {
              to { --hero-angle: 360deg; }
            }
            /* Browsers without @property animation just see a static gold border */
            @supports not (background: conic-gradient(from 0deg, red, red)) {
              .hero-shine {
                background: linear-gradient(135deg, #FBAC34, #FFE6A8 50%, #B58308);
                animation: none;
              }
            }
            /* Respect reduced-motion */
            @media (prefers-reduced-motion: reduce) {
              .hero-shine { animation: none; }
            }
          `}</style>
        </section>

        {/* Marquee-style discount strip */}
        <SafeBoundary name="special:marquee" fallback={null}>
          <DiscountMarquee />
        </SafeBoundary>

        {/* Editor-pinned top picks */}
        <SafeBoundary name="special:curator-picks" fallback={null}>
          <div className="mx-auto max-w-site px-4 pt-8 md:pt-12">
            <PlacementShelf
              placement="special_discount_top"
              title="Curators&rsquo; picks"
              subtitle="The deals our team thinks are the best buys this week."
              delivery="Top pick"
            />
          </div>
        </SafeBoundary>

        {/* Top shelves */}
        <div className="mx-auto flex max-w-site flex-col gap-8 px-4 pt-8 md:gap-12 md:pt-12">
          {SHELVES_TOP.map((shelf) => (
            <SafeBoundary key={shelf.title} name={`special:shelf:${shelf.title}`} fallback={null}>
              <ProductShelf shelf={shelf} />
            </SafeBoundary>
          ))}
        </div>

        {/* "Made in Africa" banner */}
        <BannerCard
          src="/images/discount/made-in-africa.png"
          alt="Remember, if it is made in Africa, it is made for you!"
        />

        {/* Bottom shelves */}
        <div className="mx-auto flex max-w-site flex-col gap-8 px-4 md:gap-12">
          {SHELVES_BOTTOM.map((shelf) => (
            <SafeBoundary key={shelf.title} name={`special:shelf:${shelf.title}`} fallback={null}>
              <ProductShelf shelf={shelf} />
            </SafeBoundary>
          ))}
        </div>

        {/* "Buy Now Pay Later" banner */}
        <BannerCard
          src="/images/discount/bnpl.webp"
          alt="Don't forget — you can just Buy Now Pay Later when checking out"
          href="/checkout"
        />

        {/* Final CTA */}
        <section className="mx-auto mt-12 max-w-site px-4">
          <div className="overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy to-[#1f2d6c] p-1 shadow-card">
            <div className="rounded-[10px] bg-navy/95 px-6 py-10 text-center md:px-12 md:py-14">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                <Sparkles size={12} aria-hidden />
                Limited time
              </span>
              <h2 className="mt-3 font-raleway text-2xl font-bold leading-tight text-white md:text-4xl">
                Stack savings with Continental Rewards
              </h2>
              <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-white/80 md:text-base">
                Members earn extra points on every discounted purchase — climb
                from Continental Blue all the way to Dorime and unlock
                exclusive perks.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/continental-rewards"
                  className="inline-flex items-center gap-2 rounded-btn bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-transform hover:-translate-y-0.5"
                >
                  See reward tiers <ArrowRight size={14} aria-hidden />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-btn border border-white/30 px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white transition-colors hover:bg-white hover:text-navy"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </section>

        <SafeBoundary name="special:trust" fallback={null}>
          <div className="mt-12">
            <TrustBarSection />
          </div>
        </SafeBoundary>
      </main>
    </>
  );
}

/* -------------------- pieces -------------------- */

function DiscountMarquee() {
  const items = [
    'Up to 50% off Beauty',
    '🎁 Free shipping over ₦15,000',
    'Up to 40% off Fashion',
    '⚡ Buy Now, Pay Later at checkout',
    'Up to 35% off Home & Decor',
    '⭐ Earn double Continental points',
  ];
  return (
    <div className="overflow-hidden border-b border-border bg-amber py-3">
      <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
        {[...items, ...items].map((it, i) => (
          <span
            key={i}
            className="font-raleway text-sm font-bold uppercase tracking-btn text-navy"
          >
            {it}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function ProductShelf({ shelf }: { shelf: Shelf }) {
  return (
    <section className="overflow-hidden rounded-card bg-white shadow-card">
      {/* Coloured band */}
      <header
        className={`flex items-center justify-between gap-3 px-5 py-3 ${shelf.bandClass}`}
      >
        <div className="flex flex-col leading-tight">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn opacity-90">
            {shelf.eyebrow}
          </span>
          <h2 className="font-raleway text-lg font-bold uppercase tracking-btn md:text-xl">
            {shelf.title}
          </h2>
        </div>
        <Link
          href={shelf.shopAllHref}
          className="hidden items-center gap-1 rounded-full bg-white/15 px-4 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn transition-colors hover:bg-white/25 sm:inline-flex"
        >
          Shop all <ArrowRight size={12} aria-hidden />
        </Link>
      </header>

      {/* Cards */}
      <div className="bg-white px-3 py-5 md:px-5 md:py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          <ProductGridFromQuery
            query={{
              onSale: true,
              limit: 6,
              ...(shelf.category ? { category: shelf.category } : {}),
            }}
            delivery="Sale"
          />
        </div>
      </div>

      {/* Mobile shop-all */}
      <div className="border-t border-border bg-page px-5 py-3 sm:hidden">
        <Link
          href={shelf.shopAllHref}
          className="flex items-center justify-center gap-1 font-raleway text-xs font-bold uppercase tracking-btn text-navy"
        >
          Shop all {shelf.title} <ArrowRight size={12} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function BannerCard({
  src,
  alt,
  href,
}: {
  src: string;
  alt: string;
  href?: string;
}) {
  const inner = (
    <div className="mx-auto mt-10 max-w-site overflow-hidden rounded-card border border-border bg-white shadow-card md:mt-14">
      <Image
        src={src}
        alt={alt}
        width={2400}
        height={400}
        className="h-auto w-full"
      />
    </div>
  );
  return href ? (
    <Link href={href} className="block px-4">
      {inner}
    </Link>
  ) : (
    <div className="px-4">{inner}</div>
  );
}
