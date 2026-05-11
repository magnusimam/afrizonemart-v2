'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Check, Heart, Package } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { getCountry } from '@/lib/countries';
import { Flag } from '@/components/common/Flag';
import { DisplayPrice } from '@/components/product/DisplayPrice';
import { AnimatedAddToCartButton } from '@/components/product/AnimatedAddToCartButton';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { useFlag } from '@/lib/useFlag';

type ButtonVariant = 'navy' | 'pink';

interface ProductCardPlaceholderProps {
  id: string;
  slug?: string;
  name: string;
  price?: number;
  comparePrice?: number;
  delivery?: string;
  outOfStock?: boolean;
  discountPercent?: number;
  buttonVariant?: ButtonVariant;
  origin?: string;
  imageSrc?: string;
  imageAlt?: string;
}

const buttonClasses: Record<ButtonVariant, { base: string; oos: string }> = {
  navy: {
    base: 'bg-navy text-white hover:bg-amber hover:text-navy',
    oos: 'border border-navy bg-white text-navy hover:bg-navy hover:text-white',
  },
  pink: {
    base: 'bg-pink text-white hover:bg-pink-dark',
    oos: 'border border-pink bg-white text-pink hover:bg-pink hover:text-white',
  },
};

export function ProductCardPlaceholder({
  id,
  slug,
  name,
  price,
  comparePrice,
  delivery,
  outOfStock = false,
  discountPercent,
  buttonVariant = 'navy',
  origin,
  imageSrc,
  imageAlt,
}: ProductCardPlaceholderProps) {
  const [wished, setWished] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const country = getCountry(origin);
  const isDeal = typeof discountPercent === 'number';
  const showDelivery = typeof delivery === 'string' && delivery.length > 0;
  const hasPrice = typeof price === 'number' && price > 0;
  const isInfoOnly = !hasPrice && !outOfStock;
  const showReadMore = outOfStock || isInfoOnly;

  /// Phase 12 — animated card Add-to-Cart kill-switch (separate from
  /// the PDP one). Default true. Admin flips
  /// `animated_card_add_to_cart_button` to false in
  /// /admin/feature-flags for an instant disable across every shelf
  /// — customers immediately see the plain button on cards while the
  /// PDP animation keeps working independently. Registry entry lives
  /// at afrizonemart-api/src/modules/feature-flags/registry.ts.
  const animationEnabled = useFlag('animated_card_add_to_cart_button', true);

  const productSlug = slug ?? id;

  const handleAdd = () => {
    if (!hasPrice) return;
    addItem({
      productId: id,
      slug: productSlug,
      name,
      price,
      comparePrice,
      discountPercent,
      image: '',
      origin,
    });
  };

  const btn = buttonClasses[buttonVariant];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <button
        type="button"
        aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        aria-pressed={wished}
        onClick={() => setWished((w) => !w)}
        className={`absolute z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-sm transition-colors hover:text-danger ${
          isDeal ? 'left-2 top-2' : 'right-2 top-2'
        }`}
      >
        <Heart
          size={16}
          fill={wished ? 'currentColor' : 'none'}
          className={wished ? 'text-danger' : ''}
          aria-hidden
        />
      </button>

      {isDeal ? (
        <div className="absolute right-0 top-0 z-20 rounded-bl-card bg-amber px-2 py-1 font-raleway text-xs font-bold text-navy">
          -{discountPercent}%
        </div>
      ) : null}

      <Link
        href={`/product/${productSlug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-page"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Package size={48} strokeWidth={1.25} className="text-border" aria-hidden />
        )}

        {showDelivery && (
          <div
            className={`absolute z-10 flex items-center gap-1 rounded-input bg-amber px-2 py-0.5 font-raleway text-[9px] font-bold text-navy md:text-[10px] ${
              isDeal ? 'left-2 top-12' : 'left-2 top-2'
            }`}
          >
            <Check size={10} strokeWidth={3} aria-hidden />
            Delivers in {delivery}
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <span className="rounded-input bg-danger px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-white">
              Out of Stock
            </span>
          </div>
        )}

        {country && (
          <div
            className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-input bg-white/95 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-charcoal shadow-sm backdrop-blur md:text-[10px]"
            title={`Product Of ${country.name}`}
          >
            <Flag code={country.code} title={country.name} size="sm" />
            <span>Product Of {country.name}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.5em] font-raleway text-[11px] font-semibold leading-snug text-charcoal md:text-xs">
          <Link
            href={`/product/${productSlug}`}
            className="transition-colors hover:text-navy"
          >
            {name}
          </Link>
        </h3>

        {hasPrice ? (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {comparePrice ? (
              <DisplayPrice
                amountNgn={comparePrice}
                originCountry={origin}
                compact
                className="font-sans text-[10px] text-muted line-through md:text-xs"
              />
            ) : null}
            <DisplayPrice
              amountNgn={price}
              originCountry={origin}
              compact
              className="font-raleway text-sm font-bold text-navy md:text-base"
            />
          </div>
        ) : null}

        {showReadMore ? (
          /* "Read More" / out-of-stock branch — no animation; the
           * card has nothing to add to cart from here. Identical to
           * the pre-stage-3 button behaviour. */
          <button
            type="button"
            disabled
            className={`mt-auto rounded-btn py-2 font-raleway text-[10px] font-bold uppercase tracking-btn transition-colors md:text-xs ${btn.oos}`}
          >
            Read More
          </button>
        ) : animationEnabled && buttonVariant === 'navy' ? (
          /* Animated "Add to Cart" — only for the navy variant (the
           * common case). The pink variant falls through to the
           * plain button below; we don't ship a pink-themed
           * animation in stage 3.
           *
           * Wrapped in SafeBoundary (Rule B8) — if the GSAP timeline
           * regresses, the CSS module fails to load, or any other
           * render-time error happens, the boundary catches it
           * (Sentry-tagged `boundary:card:add-to-cart`) and renders
           * the static button so the customer can still buy. */
          <div className="mt-auto">
            <SafeBoundary
              name="card:add-to-cart"
              fallback={
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`w-full rounded-btn py-2 font-raleway text-[10px] font-bold uppercase tracking-btn transition-colors md:text-xs ${btn.base}`}
                >
                  Add to Cart
                </button>
              }
            >
              <AnimatedAddToCartButton
                label="Add to Cart"
                onAdd={handleAdd}
                compact
              />
            </SafeBoundary>
          </div>
        ) : (
          /* Flag-off path OR pink variant — same plain button this
           * card used pre-stage-3. */
          <button
            type="button"
            onClick={handleAdd}
            className={`mt-auto rounded-btn py-2 font-raleway text-[10px] font-bold uppercase tracking-btn transition-colors md:text-xs ${btn.base}`}
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
