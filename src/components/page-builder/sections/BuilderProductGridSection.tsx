import Link from 'next/link';
import { fetchProducts } from '@/lib/api/products';
import { ApiProductCard } from '@/components/product/ApiProductCard';
import type { ApiPageSection, ProductGridSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Renders a product grid using the homepage's signature visual
/// pattern: navy band headline → optional amber delivery sub-band →
/// product grid → amber rounded CTA. This mirrors the existing
/// ProductsSection / DealsSection / FavouritesSection / etc. styling
/// 1:1 so an admin Publish never visually disrupts the page.
///
/// All copy + filters are admin-controlled via the `config` blob; the
/// design is owned here in code so the builder can never accidentally
/// rearrange the homepage.
export async function BuilderProductGridSection({ section }: Props) {
  const config = section.config as ProductGridSectionConfig;
  const limit = (config.columns ?? 6) * (config.rows ?? 1);

  let products: Awaited<ReturnType<typeof fetchProducts>>['items'] = [];
  try {
    switch (config.source.kind) {
      case 'category':
        products = (await fetchProducts({ category: config.source.categorySlug, limit })).items;
        break;
      case 'subcategory':
        products = (await fetchProducts({ category: config.source.subcategorySlug, limit })).items;
        break;
      case 'placement':
        products = (await fetchProducts({ placement: config.source.placementKey, limit })).items;
        break;
      case 'on-sale':
        products = (await fetchProducts({ onSale: true, limit })).items;
        break;
      case 'new-arrivals':
        products = (await fetchProducts({ sort: 'newest', limit })).items;
        break;
      case 'manual': {
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
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section>
      {/* Navy band — section heading */}
      {section.headline && (
        <div className="w-full bg-navy py-3 text-center">
          <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
            {section.headline}
          </h2>
        </div>
      )}

      {/* Optional amber sub-band — admin can use subheadline as the
          delivery / promo strip the homepage typically shows under
          shelf headlines. */}
      {section.subheadline && (
        <div className="w-full bg-amber py-2.5 text-center">
          <p
            className="mx-auto max-w-site px-4 font-sans text-xs leading-snug text-navy md:text-sm"
            // Allow inline emphasis (e.g. <strong>SUNDAYS!</strong>) for
            // parity with the hardcoded ProductsSection delivery message.
            dangerouslySetInnerHTML={{ __html: section.subheadline }}
          />
        </div>
      )}

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {products.map((p) => (
            <ApiProductCard key={p.id} product={p} />
          ))}
        </div>

        {config.viewAllHref && config.viewAllLabel && (
          <div className="mt-6 flex justify-center px-4 md:mt-8">
            <Link
              href={config.viewAllHref}
              className="rounded-full bg-amber px-8 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm lg:px-12"
            >
              {config.viewAllLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
