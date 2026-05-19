import Image from 'next/image';
import Link from 'next/link';
import { HeroSlider } from '@/components/layout/HeroSlider';

interface Slide {
  src: string;
  alt: string;
}

interface Props {
  /// Optional override fed from /admin/content. Empty/undefined falls
  /// back to HeroSlider's hardcoded default list.
  slides?: Slide[];
}

export function Hero({ slides }: Props = {}) {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto grid max-w-site gap-y-3 gap-x-4 px-4 py-3 md:grid-cols-12 md:gap-y-4 md:gap-x-10">
        <div className="md:col-span-9">
          <HeroSlider slides={slides} />
        </div>

        {/* On mobile the two cards sit SIDE BY SIDE under the slider
            (matches the design spec). On desktop they stack vertically
            in the right rail of the 12-col grid. Cards share a target
            min-height so the Sign Up CTA never collapses below the
            44px tap-target threshold. */}
        <div className="grid grid-cols-2 gap-3 md:col-span-3 md:flex md:flex-col md:gap-4">
          <div className="flex flex-col items-center justify-center gap-2 rounded-card bg-navy p-4 text-center shadow-card md:flex-1 md:p-5">
            <h3 className="font-raleway text-sm font-bold leading-tight text-white md:text-xl">
              Welcome to Afrizonemart!
            </h3>
            <p className="font-sans text-[11px] leading-snug text-white/80 md:text-sm">
              For best shopping experience
            </p>
            <Link
              href="/register"
              className="mt-1 inline-flex min-h-[44px] items-center justify-center rounded-btn bg-amber px-5 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-white active:bg-white/90 md:mt-2 md:px-8 md:text-sm"
            >
              Sign Up
            </Link>
          </div>

          <Link
            href="/continental-rewards"
            className="group flex items-center gap-2 overflow-hidden rounded-card bg-white p-3 shadow-card md:flex-1 md:gap-3 md:p-4"
          >
            <div className="flex min-w-0 flex-col">
              <span className="font-sans text-[11px] leading-tight text-charcoal md:text-sm">
                Get our
              </span>
              <span className="font-raleway text-sm font-bold leading-tight text-navy md:text-2xl">
                Continental
                <br />
                Rewards
              </span>
            </div>
            <Image
              src="/images/hero/continental-rewards.png"
              alt="Continental Rewards loyalty cards"
              width={400}
              height={260}
              className="ml-auto h-auto w-20 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 md:w-40"
            />
          </Link>
        </div>
      </div>

      <div className="w-full bg-amber py-3 text-center">
        <p className="font-raleway text-base font-bold uppercase tracking-btn text-navy md:text-lg">
          Everything Made In Africa
        </p>
      </div>
    </section>
  );
}
