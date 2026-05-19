import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { COUNTRIES, COUNTRY_CODES, FEATURED_COUNTRY_CODES, type CountryCode } from '@/lib/countries';

export const metadata: Metadata = {
  title: 'Shop by Country — All 54 African Nations | Afrizonemart',
  description:
    'Browse authentic, locally-made products from every African nation. ' +
    'From Algeria to Zimbabwe, discover what each country brings to the continental marketplace.',
};

const FEATURED_SET = new Set<CountryCode>(FEATURED_COUNTRY_CODES);

/**
 * /shop/countries — full directory of every African nation we ship from.
 *
 * The homepage marquee teases ~18 featured nations to keep the visual
 * balanced; this page is where customers come to find the long tail.
 * Tiles are alphabetised by name and split into "Featured" + "All 54"
 * sections so the eye lands on familiar markets first.
 */
export default function CountriesIndexPage() {
  const all = COUNTRY_CODES
    .map((code) => COUNTRIES[code])
    .sort((a, b) => a.name.localeCompare(b.name));

  const featured = all.filter((c) => FEATURED_SET.has(c.code as CountryCode));

  return (
    <main className="bg-page pb-12">
      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1.5 font-sans text-xs text-muted md:text-sm"
        >
          <Link href="/" className="flex items-center gap-1 hover:text-navy">
            <HomeIcon size={14} aria-hidden />
            Home
          </Link>
          <ChevronRight size={12} aria-hidden />
          <span className="text-charcoal">Shop by country</span>
        </nav>

        <header className="mb-8 flex flex-col gap-2 md:mb-10">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Continental marketplace
          </p>
          <h1 className="font-raleway text-2xl font-bold text-navy md:text-4xl">
            Shop by country
          </h1>
          <p className="font-sans text-sm text-muted md:max-w-2xl md:text-base">
            All {COUNTRY_CODES.length} African nations, one marketplace. Tap a
            flag to see what each country is bringing to the table — verified
            sellers, locally-made goods, delivered worldwide.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="mb-4 font-raleway text-base font-bold uppercase tracking-btn text-navy md:text-lg">
            Featured nations
          </h2>
          <CountryGrid codes={featured.map((c) => c.code as CountryCode)} variant="featured" />
        </section>

        <section>
          <h2 className="mb-4 font-raleway text-base font-bold uppercase tracking-btn text-navy md:text-lg">
            All {COUNTRY_CODES.length} countries
          </h2>
          <CountryGrid codes={all.map((c) => c.code as CountryCode)} variant="compact" />
        </section>
      </div>
    </main>
  );
}

function CountryGrid({
  codes,
  variant,
}: {
  codes: CountryCode[];
  variant: 'featured' | 'compact';
}) {
  // Featured row gets bigger, photo-led tiles. The full directory uses
  // a denser 3-/4-col grid so 54 entries fit without endless scroll.
  const cls =
    variant === 'featured'
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
      : 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
  return (
    <div className={cls}>
      {codes.map((code) => (
        <CountryTile key={code} code={code} variant={variant} />
      ))}
    </div>
  );
}

function CountryTile({
  code,
  variant,
}: {
  code: CountryCode;
  variant: 'featured' | 'compact';
}) {
  const c = COUNTRIES[code];
  const flagSrc = `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
  return (
    <Link
      href={`/shop/country/${c.slug}`}
      className="group flex flex-col items-center gap-2 rounded-card border border-border bg-white p-3 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-navy hover:shadow-card-hover md:p-4"
    >
      <span
        className={`relative overflow-hidden rounded ${
          variant === 'featured' ? 'h-12 w-16 md:h-14 md:w-20' : 'h-9 w-12 md:h-10 md:w-14'
        }`}
      >
        <Image
          src={flagSrc}
          alt={`${c.name} flag`}
          width={160}
          height={108}
          sizes="80px"
          className="h-full w-full object-cover"
        />
      </span>
      <span className="font-raleway text-xs font-bold leading-tight text-navy group-hover:text-amber md:text-sm">
        {c.name}
      </span>
      <span className="font-sans text-[10px] uppercase tracking-btn text-muted md:text-xs">
        {c.code} · {c.currency}
      </span>
    </Link>
  );
}
