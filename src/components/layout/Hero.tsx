import Image from 'next/image';
import Link from 'next/link';
import { HeroSlider } from '@/components/layout/HeroSlider';

export function Hero() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto grid max-w-site gap-y-3 gap-x-4 px-4 py-3 md:grid-cols-12 md:gap-y-4 md:gap-x-10">
        <div className="md:col-span-9">
          <HeroSlider />
        </div>

        <div className="flex flex-col gap-3 md:col-span-3 md:gap-4">
          <div className="flex flex-1 flex-col items-center justify-center rounded-card bg-navy p-5 text-center shadow-card">
            <h3 className="font-raleway text-lg font-bold leading-tight text-white md:text-xl">
              Welcome to Afrizonemart!
            </h3>
            <p className="mt-1 font-sans text-xs text-white/80 md:text-sm">
              For best shopping experience
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-btn bg-amber px-8 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-white"
            >
              Sign Up!
            </Link>
          </div>

          <Link
            href="/account/rewards"
            className="group flex flex-1 items-center gap-3 overflow-hidden rounded-card bg-white p-4 shadow-card"
          >
            <div className="flex flex-col">
              <span className="font-sans text-sm text-charcoal">Get our</span>
              <span className="font-raleway text-xl font-bold leading-tight text-navy md:text-2xl">
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
              className="ml-auto h-auto w-32 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 md:w-40"
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
