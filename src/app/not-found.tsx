import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Home, ShoppingBag } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { EmptyStallIllustration } from '@/components/common/EmptyStallIllustration';

/// Custom 404 (Next App Router convention: app/not-found.tsx).
/// Renders the storefront chrome directly since the root layout
/// doesn't include Header/Footer (those live in (shop)/layout.tsx).
///
/// Designed 2026-05-19 per Magnus: "wandered off the map" copy + an
/// empty market stall illustration with a small BACK SOON sign,
/// matching the "no content here for now, come back soon" tone.
///
/// Pure server component — no client hooks, no API calls, no JS
/// beyond what the shared chrome ships. The stall's canopy sway is
/// pure CSS keyframes that respect prefers-reduced-motion.

export const metadata: Metadata = {
  title: 'Page not found',
  /// Next will inherit follow/index from the root layout; explicitly
  /// tell crawlers not to index this URL even when it gets surfaced
  /// from a bad link.
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <>
      <SafeBoundary name="chrome:header">
        <Header />
      </SafeBoundary>

      <main className="bg-page py-12 md:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center md:gap-8">
          <h1 className="font-raleway text-7xl font-bold leading-none text-navy md:text-9xl">
            404
          </h1>

          <div className="w-full max-w-md">
            <EmptyStallIllustration className="h-auto w-full" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-raleway text-2xl font-bold leading-tight text-navy md:text-3xl">
              Looks like you&apos;ve wandered off the map.
            </p>
            <p className="font-sans text-base text-muted md:text-lg">
              No content here for now — come back soon.
            </p>
          </div>

          <div className="mt-2 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-btn bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-navy hover:text-white"
            >
              <Home size={16} aria-hidden />
              Go to Home
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-btn border-2 border-navy bg-white px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
            >
              <ShoppingBag size={16} aria-hidden />
              Browse Shop
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </main>

      <SafeBoundary name="chrome:footer">
        <Footer />
      </SafeBoundary>
      <SafeBoundary name="chrome:chat" fallback={null}>
        <ChatBubble />
      </SafeBoundary>
    </>
  );
}
