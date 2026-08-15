import { fetchTrendingNearYou } from '@/lib/api/recommendations';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';

/**
 * Recommendations & Personalization Phase 0 — "Trending near you"
 * module (Section 11: Home/category surface, geo + recency
 * popularity). See `afrizonemart-api/src/modules/recommendations`.
 *
 * Server component — fetches at request time (`no-store`, same as the
 * `/search` page's `fetchSearch` call) rather than going through the
 * admin-curated Placement/Shelf system the rest of Home uses: this
 * section is behaviour-driven (view counts, deliverability), not
 * merchandiser-curated content, so it's a distinct data source by
 * design, not a naive duplicate of the placement grids.
 *
 * No viewer-country resolution exists on the web frontend yet (no
 * geo/shipping-country cookie), so `country` is omitted here — the API
 * degrades gracefully to unfiltered-by-deliverability in that case.
 * Wire a real country once that context-resolution piece exists.
 */
export async function TrendingNearYouSection() {
  let items: Awaited<ReturnType<typeof fetchTrendingNearYou>>['items'] = [];
  try {
    const r = await fetchTrendingNearYou({ limit: 12, surface: 'home' });
    items = r.items;
  } catch {
    // Best-effort — hide the section rather than break the home page.
  }
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-site px-4">
        <div className="mb-6 text-center md:mb-8">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Popular Right Now
          </p>
          <h2 className="mt-1 font-raleway text-2xl font-bold text-navy md:text-3xl">
            Trending Near You
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {items.map((p) => (
            <ProductCardPlaceholder
              key={p.id}
              id={p.id}
              slug={p.slug}
              name={p.name}
              price={p.price}
              comparePrice={p.comparePrice ?? undefined}
              discountPercent={p.discountPercent ?? undefined}
              origin={p.origin ?? undefined}
              sellableCountries={p.sellableCountries}
              imageSrc={p.images?.[0]}
              imageAlt={p.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
