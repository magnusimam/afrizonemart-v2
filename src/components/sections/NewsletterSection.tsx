'use client';

import { type FormEvent, useState } from 'react';
import { Apple, Play } from 'lucide-react';

export function NewsletterSection() {
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <section className="bg-amber py-10 md:py-14">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-8 px-4 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col gap-4">
          <h3 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            Don&apos;t Miss Out!
          </h3>
          <p className="font-sans text-sm leading-snug text-navy md:text-base">
            Subscribe to our newsletter to get updates on our latest offers,
            discounts and customer rewards!
          </p>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row"
            aria-label="Subscribe to newsletter"
          >
            <input
              required
              type="email"
              name="email"
              placeholder="Your email address"
              className="flex-1 rounded-input border border-border bg-white px-4 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-btn bg-navy px-6 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark md:text-sm"
            >
              {subscribed ? 'Subscribed ✓' : 'Subscribe'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            Get Exclusive Offers
          </h3>
          <p className="font-sans text-sm leading-snug text-navy md:text-base">
            Download AfrizoneMart APP for <strong>FREE</strong> and get app{' '}
            <strong>ONLY</strong> bonuses.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              aria-label="Get it on Google Play"
              className="flex items-center gap-3 rounded-btn bg-navy px-4 py-2 text-white transition-colors hover:bg-navy-dark"
            >
              <Play size={28} strokeWidth={1.5} fill="currentColor" aria-hidden />
              <span className="flex flex-col text-left leading-tight">
                <span className="font-sans text-[10px]">GET IT ON</span>
                <span className="font-raleway text-base font-bold">Google Play</span>
              </span>
            </a>
            <a
              href="#"
              aria-label="Download on the App Store"
              className="flex items-center gap-3 rounded-btn bg-navy px-4 py-2 text-white transition-colors hover:bg-navy-dark"
            >
              <Apple size={28} strokeWidth={1.5} fill="currentColor" aria-hidden />
              <span className="flex flex-col text-left leading-tight">
                <span className="font-sans text-[10px]">Download on the</span>
                <span className="font-raleway text-base font-bold">App Store</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
