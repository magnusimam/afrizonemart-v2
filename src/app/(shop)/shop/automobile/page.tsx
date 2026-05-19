import Link from 'next/link';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { FiltersSidebar } from '@/components/shop/FiltersSidebar';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { AutomobileHero } from '@/components/sections/AutomobileHero';
import { SafeBoundary } from '@/components/common/SafeBoundary';

export const metadata = {
  title: 'Automobile · Shop | Afrizonemart',
  description:
    'African-imported and locally-sourced cars. Sedans, SUVs, and more — verified by Afrizonemart.',
};

export default function AutomobilePage() {
  return (
    <main className="bg-page pb-12">
      <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
        <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
          <li>
            <Link href="/" className="flex items-center gap-1 hover:text-navy">
              <HomeIcon size={14} aria-hidden /> Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight size={12} className="text-border" />
          </li>
          <li>
            <Link href="/shop" className="hover:text-navy">
              Shop
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight size={12} className="text-border" />
          </li>
          <li>
            <span className="font-medium text-charcoal">Automobile</span>
          </li>
        </ol>
      </nav>

      {/* Hero — featured automobile slider. Hardcoded slides for now;
          the CMS will index this hero in Phase 12 and let admins swap
          the cars without touching code. */}
      <SafeBoundary name="automobile:hero" fallback={null}>
        <AutomobileHero />
      </SafeBoundary>

      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <header className="mb-6 flex flex-col gap-2 md:mb-8">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            African-imported · Locally-sourced
          </p>
          <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
            Automobile
          </h1>
          <p className="font-sans text-sm text-muted md:text-base">
            Sedans, SUVs, and more — every listing verified by Afrizonemart
            before it reaches you.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Mobile: hide the sidebar (it stacks unreachable below
              the empty-state and only adds noise to a "listings
              open soon" page). */}
          <div className="hidden lg:col-span-3 lg:block">
            <SafeBoundary name="automobile:filters" fallback={null}>
              <FiltersSidebar />
            </SafeBoundary>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
            <SafeBoundary name="automobile:toolbar" fallback={null}>
              <ShopToolbar total={0} />
            </SafeBoundary>

            <div className="rounded-card border border-border bg-white px-6 py-16 text-center">
              <p className="font-raleway text-lg font-bold text-navy">
                Listings open soon
              </p>
              <p className="mt-2 font-sans text-sm text-muted">
                We&apos;re onboarding verified dealers across the continent.
                Check back shortly — or browse the featured cars above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
