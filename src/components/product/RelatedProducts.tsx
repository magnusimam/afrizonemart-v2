import { ProductCardPlaceholder } from './ProductCardPlaceholder';
import type { RelatedProduct } from '@/lib/products';

interface RelatedProductsProps {
  products: RelatedProduct[];
  /// Small uppercase label above the heading. Defaults to the
  /// original "You May Also Like" copy so existing callers (PDP,
  /// cart) don't need changes.
  kicker?: string;
  heading?: string;
}

export function RelatedProducts({
  products,
  kicker = 'More from Africa',
  heading = 'You May Also Like',
}: RelatedProductsProps) {
  return (
    <section className="bg-amber/15 py-12 md:py-16">
      <div className="mx-auto max-w-site px-4">
        <div className="mb-6 text-center md:mb-8">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            {kicker}
          </p>
          <h2 className="mt-1 font-raleway text-2xl font-bold text-navy md:text-3xl">
            {heading}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {products.map((p) => (
            <ProductCardPlaceholder
              key={p.id}
              id={p.id}
              slug={p.slug}
              name={p.name}
              price={p.price}
              comparePrice={p.comparePrice}
              discountPercent={p.discountPercent}
              origin={p.origin}
              imageSrc={p.imageSrc}
              imageAlt={p.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
