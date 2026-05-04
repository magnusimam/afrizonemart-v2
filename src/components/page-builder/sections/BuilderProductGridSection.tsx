import Link from 'next/link';
import { fetchProducts } from '@/lib/api/products';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import type { ApiPageSection, ProductGridSectionConfig } from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Server component — fetches products based on the section's source
/// config. The grid layout uses Tailwind classes that map columns to
/// the configured count; mobile always halves to keep cards readable.
export async function BuilderProductGridSection({ section }: Props) {
  const config = section.config as ProductGridSectionConfig;
  const limit = (config.columns ?? 4) * (config.rows ?? 2);

  /// Each source kind maps to query params on /api/products. Manual
  /// (handpicked product slugs) is the odd one out — we fetch each
  /// individually because the list endpoint doesn't support an OR-on-
  /// slug filter.
  let products: Awaited<ReturnType<typeof fetchProducts>>['items'] = [];
  try {
    switch (config.source.kind) {
      case 'category':
        products = (
          await fetchProducts({ category: config.source.categorySlug, limit })
        ).items;
        break;
      case 'subcategory':
        products = (
          await fetchProducts({ category: config.source.subcategorySlug, limit })
        ).items;
        break;
      case 'placement':
        products = (
          await fetchProducts({ placement: config.source.placementKey, limit })
        ).items;
        break;
      case 'on-sale':
        products = (await fetchProducts({ onSale: true, limit })).items;
        break;
      case 'new-arrivals':
        products = (await fetchProducts({ sort: 'newest', limit })).items;
        break;
      case 'manual': {
        // Fetch a wider window from the API and filter in-process —
        // catalog is small enough that this is cheaper than N requests.
        const all = await fetchProducts({ limit: 100 });
        const order = new Map(config.source.productSlugs.map((s, i) => [s, i]));
        products = all.items
          .filter((p) => order.has(p.slug))
          .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
          .slice(0, limit);
        break;
      }
    }
  } catch {
    // Fail-soft: render nothing rather than 500 the whole page when
    // the API hiccups on one shelf.
    return null;
  }

  if (products.length === 0) return null;

  const cols = Math.min(Math.max(config.columns ?? 4, 2), 6);
  const desktopColsClass =
    cols === 2
      ? 'lg:grid-cols-2'
      : cols === 3
        ? 'lg:grid-cols-3'
        : cols === 5
          ? 'lg:grid-cols-5'
          : cols === 6
            ? 'lg:grid-cols-6'
            : 'lg:grid-cols-4';

  return (
    <section className="bg-page py-10 md:py-14">
      <div className="mx-auto max-w-site px-4">
        {section.headline && (
          <header className="mb-6">
            <div
              className="h-1 w-12 rounded-full"
              style={{ backgroundColor: resolveAccentColor(section.accentColor) }}
              aria-hidden
            />
            <h2 className="mt-3 font-raleway text-2xl font-bold text-navy md:text-3xl">
              {section.headline}
            </h2>
            {section.subheadline && (
              <p className="mt-1 font-sans text-sm text-muted md:text-base">
                {section.subheadline}
              </p>
            )}
          </header>
        )}

        <div
          className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 ${desktopColsClass}`}
        >
          {products.map((p) => (
            <ApiProductCard key={p.id} product={p} />
          ))}
        </div>

        {config.viewAllHref && config.viewAllLabel && (
          <div className="mt-6 flex justify-center">
            <Link
              href={config.viewAllHref}
              className="inline-flex items-center justify-center rounded-btn border border-navy px-5 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
            >
              {config.viewAllLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
