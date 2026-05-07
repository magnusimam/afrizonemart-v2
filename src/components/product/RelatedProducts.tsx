import { ProductCardPlaceholder } from './ProductCardPlaceholder';
import type { RelatedProduct } from '@/lib/products';

interface RelatedProductsProps {
  products: RelatedProduct[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <section className="bg-amber/15 py-12 md:py-16">
      <div className="mx-auto max-w-site px-4">
        <div className="mb-6 text-center md:mb-8">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            More from Africa
          </p>
          <h2 className="mt-1 font-raleway text-2xl font-bold text-navy md:text-3xl">
            You May Also Like
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
