import Image from 'next/image';
import Link from 'next/link';
import { Globe2 } from 'lucide-react';
import { COUNTRIES, COUNTRY_CODES } from '@/lib/countries';

const COUNTRY_PRODUCT_COUNTS: Record<string, number> = {
  NG: 12480, KE: 6230, ZA: 9180, EG: 4420, GH: 3870, MA: 2950,
  ET: 1840, TZ: 1620, UG: 1340, RW: 980, ZW: 720, CI: 880,
  SN: 740, CM: 1100, ML: 540, DZ: 1240, TN: 1450, AO: 620,
  BW: 410, NA: 380, MZ: 510,
};

export function ShopByCountrySection() {
  return (
    <section>
      <div className="w-full bg-navy py-3 text-center md:py-4">
        <h2 className="flex items-center justify-center gap-2 font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          <Globe2 size={18} aria-hidden className="text-amber" />
          Shop By Country
        </h2>
      </div>

      <div className="bg-white py-8 md:py-10">
        <div className="mx-auto max-w-site px-4">
          <p className="mx-auto mb-6 max-w-2xl text-center font-sans text-sm leading-relaxed text-muted md:mb-8 md:text-base">
            Discover authentic, locally-made products from {COUNTRY_CODES.length}+
            African nations — each verified by Afrizonemart and delivered worldwide.
          </p>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 md:gap-3 lg:grid-cols-7">
            {COUNTRY_CODES.map((code) => {
              const c = COUNTRIES[code];
              const count = COUNTRY_PRODUCT_COUNTS[code] ?? 0;
              const flagSrc = `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
              return (
                <Link
                  key={code}
                  href={`/shop/country/${c.slug}`}
                  className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-navy hover:shadow-card-hover"
                >
                  <div className="relative aspect-[3/2] overflow-hidden bg-page">
                    <Image
                      src={flagSrc}
                      alt={`${c.name} flag`}
                      width={160}
                      height={107}
                      sizes="(min-width: 1024px) 12vw, (min-width: 768px) 16vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-0 px-1.5 py-1.5 text-center">
                    <span className="font-raleway text-[10px] font-bold leading-tight text-navy md:text-[11px]">
                      {c.name}
                    </span>
                    <span className="font-sans text-[9px] text-muted md:text-[10px]">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center md:mt-6">
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
