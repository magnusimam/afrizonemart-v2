import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { PlacementShelf } from '@/components/product/PlacementShelf';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Continental Rewards — Afrizonemart',
  description:
    'Earn points on every purchase, redeem for vouchers and gift cards, and climb the Continental tiers — Blue, Gold, VIP, Ambassador and Dorime.',
};

interface Tier {
  id: 'blue' | 'gold' | 'vip' | 'ambassador' | 'dorime';
  name: string;
  /** Tailwind classes for the coloured header bar. */
  bandClass: string;
  /** Tailwind classes for the tier-specific accent (icon colour). */
  accentClass: string;
  image: string;
  intro: string;
  benefits: string[];
}

const TIERS: Tier[] = [
  {
    id: 'blue',
    name: 'Continental Blue',
    bandClass: 'bg-navy text-white',
    accentClass: 'text-navy',
    image: '/images/loyalty/blue.jpg',
    intro:
      'Sign up now and enjoy exclusive Continental Blue benefits:',
    benefits: [
      '5% discount on your first 3 purchases',
      'Free shipping on your first 5 purchases',
      'An AfrizoneMart souvenir',
    ],
  },
  {
    id: 'gold',
    name: 'Continental Gold',
    bandClass: 'bg-amber text-navy',
    accentClass: 'text-amber',
    image: '/images/loyalty/gold.jpg',
    intro:
      'Shop ₦50,000+ in a year and unlock Continental Gold status with the following benefits:',
    benefits: [
      'Birthday souvenirs',
      'Anniversary packages',
      'Plus all Continental Blue benefits',
    ],
  },
  {
    id: 'vip',
    name: 'Continental VIP',
    bandClass: 'bg-[#9CA3AF] text-navy',
    accentClass: 'text-[#6B7280]',
    image: '/images/loyalty/vip.jpg',
    intro:
      'Shop ₦100,000+ in a year and enjoy Continental VIP status with benefits like:',
    benefits: [
      'Dinner for two',
      'Plus all Continental Blue and Gold incentives',
    ],
  },
  {
    id: 'ambassador',
    name: 'Continental Ambassador',
    bandClass: 'bg-[#5B2A86] text-white',
    accentClass: 'text-[#5B2A86]',
    image: '/images/loyalty/ambassador.jpg',
    intro:
      'Shop ₦500,000+ in a year and enjoy Continental Ambassador status with benefits like:',
    benefits: [
      'Goat or Turkey or Ram festive package',
      'Plus all Continental Blue, Gold and VIP benefits',
    ],
  },
  {
    id: 'dorime',
    name: 'Continental Dorime',
    bandClass: 'bg-charcoal text-amber',
    accentClass: 'text-amber',
    image: '/images/loyalty/dorime.jpg',
    intro:
      'Shop ₦1,000,000+ in a year and earn Continental Dorime — our top tier — with all-access perks:',
    benefits: [
      'Personal account concierge',
      'Exclusive limited-edition gift drops',
      'Plus all Continental Blue, Gold, VIP and Ambassador benefits',
    ],
  },
];

export default function ContinentalRewardsPage() {
  return (
    <>
      <Header />
      <main className="bg-page pb-12">
        {/* Intro */}
        <section className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h1 className="font-raleway text-3xl font-bold text-amber md:text-5xl">
              Continental Rewards
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-base leading-relaxed text-charcoal md:text-lg">
              As a continental reward member, you will experience shopping with
              customer service at its finest. The more you shop here on
              Afrizonemart.com, the faster you earn sufficient points to redeem
              for a shopping voucher or gift card and advance to the next level.
            </p>
          </div>
        </section>

        {/* Tiers */}
        <section className="mx-auto flex max-w-site flex-col gap-6 px-4 pt-2 md:gap-8">
          {TIERS.map((tier) => (
            <TierBlock key={tier.id} tier={tier} />
          ))}
        </section>

        {/* Member-exclusive picks */}
        <section className="mx-auto mt-10 max-w-site px-4">
          <PlacementShelf
            placement="continental_rewards_featured"
            title="Member exclusives"
            subtitle="Reward-tier products curated for Continental members."
            delivery="Member"
          />
        </section>

        {/* CTAs */}
        <section className="mx-auto mt-10 grid max-w-site grid-cols-1 gap-4 px-4 md:grid-cols-2 md:gap-6">
          <Link
            href="/register"
            className="flex flex-col items-center gap-1 rounded-card bg-amber px-6 py-6 text-center font-raleway font-bold text-navy shadow-card transition-transform hover:-translate-y-0.5"
          >
            <span className="text-xl uppercase tracking-btn md:text-2xl">
              New customer? Register now
            </span>
            <span className="font-sans text-xs font-normal text-navy/80">
              Start earning Continental Blue benefits in seconds.
            </span>
          </Link>
          <Link
            href="/login"
            className="flex flex-col items-center gap-1 rounded-card bg-navy px-6 py-6 text-center font-raleway font-bold text-white shadow-card transition-transform hover:-translate-y-0.5"
          >
            <span className="text-xl uppercase tracking-btn md:text-2xl">
              Already a customer? Sign in
            </span>
            <span className="font-sans text-xs font-normal text-white/80">
              Track your tier, points and redemptions.
            </span>
          </Link>
        </section>

        <div className="mt-12">
          <TrustBarSection />
        </div>
      </main>
      <Footer />
      <ChatBubble />
    </>
  );
}

function TierBlock({ tier }: { tier: Tier }) {
  return (
    <article className="overflow-hidden rounded-card border border-border bg-white shadow-card">
      <header
        className={`px-5 py-3 font-raleway text-lg font-bold uppercase tracking-btn md:text-xl ${tier.bandClass}`}
      >
        {tier.name}
      </header>

      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-12 md:gap-8 md:p-6">
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-card border border-border">
            <Image
              src={tier.image}
              alt={`${tier.name} loyalty card`}
              width={1050}
              height={600}
              className="h-auto w-full"
              priority={tier.id === 'blue'}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:col-span-5">
          <p className="font-sans text-sm leading-relaxed text-charcoal md:text-base">
            {tier.intro}
          </p>
          <ul className="flex flex-col gap-2">
            {tier.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 font-sans text-sm text-charcoal">
                <Check size={16} className={`mt-0.5 shrink-0 ${tier.accentClass}`} aria-hidden />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 font-sans text-xs text-muted">
            <Link
              href={`/continental-rewards#${tier.id}`}
              className="font-semibold text-navy hover:underline"
            >
              Read full {tier.name} benefits →
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}
