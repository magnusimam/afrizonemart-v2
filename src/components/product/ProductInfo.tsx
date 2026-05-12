'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Check,
  Gem,
  Globe2,
  Heart,
  Leaf,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import type { FeatureIcon, ProductDetail } from '@/lib/products';
import { BundleSelector } from './BundleSelector';
import { ShareProductButton } from './ShareProductButton';
import { ShareAsImageButton } from './ShareAsImageButton';
import { ProductAccordion } from './ProductAccordion';
import { QuantitySelector } from './QuantitySelector';
import { DisplayPrice } from './DisplayPrice';
import { AnimatedAddToCartButton } from './AnimatedAddToCartButton';
import { StaticAddToCartButton } from './StaticAddToCartButton';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { useFlag } from '@/lib/useFlag';

const featureIconMap: Record<FeatureIcon, LucideIcon> = {
  sparkles: Sparkles,
  leaf: Leaf,
  globe: Globe2,
  shield: ShieldCheck,
  heart: Heart,
  check: Check,
  gem: Gem,
};

interface ProductInfoProps {
  product: ProductDetail;
}

export function ProductInfo({ product }: ProductInfoProps) {
  // Imported / partially-filled products may not have any bundles. We
  // synthesize a single "default" bundle from the product price so the
  // BundleSelector + add-to-cart flow keeps working.
  const bundles = product.bundles.length > 0
    ? product.bundles
    : [
        {
          label: '1 unit',
          price: product.price,
          units: 1,
          comparePrice: product.comparePrice ?? product.price,
        },
      ];
  const initialBundle = Math.max(0, bundles.findIndex((b) => b.popular));
  const [variant, setVariant] = useState(product.variants?.default ?? '');
  const [bundleIndex, setBundleIndex] = useState(initialBundle);
  const [quantity, setQuantity] = useState(1);
  const [wished, setWished] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  /// Phase 12 — animated PDP Add-to-Cart kill-switch. Default true so
  /// the animation ships visible. Admin flips it to false in
  /// /admin/feature-flags for an instant disable — customers
  /// immediately see the plain "Add to Cart" button instead, no
  /// redeploy needed. Registry entry lives at
  /// afrizonemart-api/src/modules/feature-flags/registry.ts.
  const animationEnabled = useFlag('animated_pdp_add_to_cart_button', true);

  const selectedBundle = bundles[bundleIndex] ?? bundles[0];
  const totalPrice = selectedBundle.price * quantity;

  const handleAddToCart = () => {
    const variantLabel = [selectedBundle.label, variant].filter(Boolean).join(' · ');
    addItem(
      {
        productId: `${product.slug}-${selectedBundle.label}-${variant}`,
        slug: product.slug,
        name: product.name,
        price: selectedBundle.price,
        comparePrice: selectedBundle.comparePrice,
        discountPercent: selectedBundle.savings ?? product.discountPercent,
        image: product.images[0]?.src ?? '',
        origin: product.origin,
        variant: variantLabel,
      },
      quantity,
    );
  };

  const fullStars = Math.floor(product.rating);
  const hasHalfStar = product.rating - fullStars >= 0.5;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber">
            {[1, 2, 3, 4, 5].map((i) => {
              const filled = i <= fullStars || (i === fullStars + 1 && hasHalfStar);
              return (
                <Star
                  key={i}
                  size={16}
                  fill={filled ? 'currentColor' : 'none'}
                  aria-hidden
                />
              );
            })}
          </div>
          <span className="font-sans text-sm text-muted">
            <span className="font-bold text-charcoal">{product.rating}</span> (
            {product.reviewCount.toLocaleString()} Reviews)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShareProductButton
            slug={product.slug}
            productName={product.name}
            brand={product.brand}
            shortDescription={product.shortDescription}
          />
          <ShareAsImageButton
            slug={product.slug}
            productName={product.name}
            brand={product.brand}
            shortDescription={product.shortDescription}
          />
          <button
            type="button"
            onClick={() => setWished((w) => !w)}
            aria-pressed={wished}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-danger hover:text-danger"
          >
            <Heart
              size={18}
              fill={wished ? 'currentColor' : 'none'}
              className={wished ? 'text-danger' : ''}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
          {product.brand}
        </p>
        <h1 className="font-raleway text-3xl font-bold leading-tight text-navy md:text-4xl">
          {product.name}
        </h1>
        <p className="font-sans text-base leading-snug text-muted">
          {product.shortDescription}
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <DisplayPrice
          amountNgn={product.price}
          originCountry={product.origin}
          className="font-raleway text-3xl font-bold text-navy md:text-4xl"
        />
        {product.comparePrice ? (
          <DisplayPrice
            amountNgn={product.comparePrice}
            originCountry={product.origin}
            compact
            className="font-sans text-lg text-muted line-through"
          />
        ) : null}
        {product.discountPercent ? (
          <span className="rounded-input bg-amber px-2.5 py-1 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
            Save {product.discountPercent}%
          </span>
        ) : null}
      </div>

      <ul className="flex flex-col gap-2">
        {product.features.map((f) => {
          const Icon = featureIconMap[f.icon];
          return (
            <li
              key={f.text}
              className="flex items-start gap-2.5 font-sans text-sm leading-snug text-charcoal"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber/15 text-navy">
                <Icon size={12} strokeWidth={2.5} aria-hidden />
              </span>
              {f.text}
            </li>
          );
        })}
      </ul>

      {product.variants ? (
        <div className="flex flex-col gap-2">
          <p className="font-raleway text-sm font-bold text-navy">
            {product.variants.type}:{' '}
            <span className="font-semibold text-charcoal">{variant}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.options.map((opt) => {
              const selected = opt === variant;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVariant(opt)}
                  aria-pressed={selected}
                  className={`rounded-btn border-2 px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn transition-colors md:text-sm ${
                    selected
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-navy hover:border-navy'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <BundleSelector
        bundles={bundles}
        selectedIndex={bundleIndex}
        onSelect={setBundleIndex}
        originCountry={product.origin}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-raleway text-sm font-bold text-navy">Quantity:</span>
          <QuantitySelector value={quantity} onChange={setQuantity} />
          <span className="font-sans text-sm text-muted">
            Subtotal:{' '}
            <DisplayPrice
              amountNgn={totalPrice}
              originCountry={product.origin}
              compact
              className="font-raleway font-bold text-navy"
            />
          </span>
        </div>

        {animationEnabled ? (
          /* Animated cart button. Wrapped in SafeBoundary (Rule B8) —
           * if the GSAP timeline regresses, the CSS module fails to
           * load, or any other render-time error happens, the boundary
           * catches it (Sentry-tagged `boundary:pdp:add-to-cart`) and
           * renders the static button so the customer can still buy. */
          <SafeBoundary
            name="pdp:add-to-cart"
            fallback={
              <StaticAddToCartButton
                priceNgn={totalPrice}
                originCountry={product.origin}
                disabled={!product.inStock}
                onAdd={handleAddToCart}
              />
            }
          >
            <AnimatedAddToCartButton
              label="Add to Cart"
              disabled={!product.inStock}
              onAdd={handleAddToCart}
            />
          </SafeBoundary>
        ) : (
          /* Admin flipped the kill-switch — same button this PDP used
           * before the animated upgrade. */
          <StaticAddToCartButton
            priceNgn={totalPrice}
            originCountry={product.origin}
            disabled={!product.inStock}
            onAdd={handleAddToCart}
          />
        )}

        <button
          type="button"
          className="w-full rounded-btn border-2 border-navy bg-white py-3.5 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
        >
          Buy Now
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-card border border-border bg-page p-3 md:gap-3 md:p-4">
        <TrustBadge Icon={Truck} title="Free Shipping" caption="Over NGN10,000" />
        <TrustBadge Icon={RotateCcw} title="30-Day Returns" caption="No questions asked" />
        <TrustBadge Icon={BadgeCheck} title="Authentic" caption="100% Made in Africa" />
      </div>

      <ProductAccordion
        sections={[
          {
            title: 'Description',
            body: product.longDescription,
          },
          {
            title: 'Specifications',
            body: (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {product.specifications.map((s) => (
                  <div key={s.label} className="flex justify-between gap-3 border-b border-border py-1.5">
                    <dt className="font-raleway text-xs font-semibold text-muted">
                      {s.label}
                    </dt>
                    <dd className="font-sans text-xs font-medium text-charcoal text-right">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ),
          },
          {
            title: 'Shipping & Returns',
            body: product.shipping,
          },
          ...(product.ingredients
            ? [{ title: 'Ingredients', body: product.ingredients }]
            : []),
        ]}
      />
    </div>
  );
}

function TrustBadge({
  Icon,
  title,
  caption,
}: {
  Icon: LucideIcon;
  title: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Icon size={22} strokeWidth={1.75} className="text-navy" aria-hidden />
      <p className="font-raleway text-[11px] font-bold leading-tight text-navy md:text-xs">
        {title}
      </p>
      <p className="font-sans text-[9px] leading-tight text-muted md:text-[10px]">
        {caption}
      </p>
    </div>
  );
}
