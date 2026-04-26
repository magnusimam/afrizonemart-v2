'use client';

import { ProductCardPlaceholder } from './ProductCardPlaceholder';
import type { ApiProduct } from '@/lib/api/types';

/**
 * Adapter from the API DTO to the ProductCardPlaceholder props.
 *
 * Keeps the existing card component as the single source of truth for
 * card visuals. We just translate `ApiProduct` → the props shape.
 */
interface Props {
  product: ApiProduct;
  buttonVariant?: 'navy' | 'pink';
  delivery?: string;
}

export function ApiProductCard({ product, buttonVariant, delivery }: Props) {
  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100,
        )
      : undefined;

  return (
    <ProductCardPlaceholder
      id={product.id}
      name={product.name}
      price={product.price}
      comparePrice={product.comparePrice ?? undefined}
      discountPercent={discountPercent}
      origin={product.origin ?? undefined}
      outOfStock={!product.inStock}
      buttonVariant={buttonVariant}
      delivery={delivery}
    />
  );
}
