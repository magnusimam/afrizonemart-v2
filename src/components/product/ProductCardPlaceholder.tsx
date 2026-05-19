'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, Heart, Package } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { getCountry } from '@/lib/countries';
import { Flag } from '@/components/common/Flag';
import { DisplayPrice } from '@/components/product/DisplayPrice';
import { AnimatedAddToCartButton } from '@/components/product/AnimatedAddToCartButton';
import { CardCartStepper } from '@/components/product/CardCartStepper';
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
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  /// Tracker #51 — current quantity of THIS product in the cart.
  /// When > 0 the Add-to-Cart button swaps for the in-place stepper.
  /// Reads from the same productId convention used by addItem below
  /// (the product's cuid for cards, not the variant key the PDP uses).
  const cartQuantity = useCartStore(
    (s) => s.items.find((i) => i.productId === id)?.quantity ?? 0,
  );
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

  /// Tracker #51 — when the customer just clicked Add to Cart on the
  /// animated branch, defer the stepper swap until the truck animation
  /// has run. Without the delay the parent re-renders the moment qty
  /// flips 0 → 1, unmounting the animated button mid-flight (GSAP's
  /// onInterrupt then snaps it idle and nobody sees the truck).
  ///
  /// 2200ms covers the ~2s timeline + a small buffer for elastic
  /// settle. If the page mounts with qty already > 0 (refresh, came
  /// back from cart), we skip the delay and show the stepper
  /// immediately — there was no animation to wait for.
  const ANIMATED_BUTTON_RUNTIME_MS = 2200;
  const willUseAnimation =
    animationEnabled && buttonVariant === 'navy' && !showReadMore;
  const [stepperVisible, setStepperVisible] = useState(cartQuantity > 0);
  const prevQtyRef = useRef(cartQuantity);
  useEffect(() => {
    const prev = prevQtyRef.current;
    const cur = cartQuantity;
    prevQtyRef.current = cur;
    if (cur === 0) {
      setStepperVisible(false);
      return;
    }
    if (prev === 0 && willUseAnimation) {
      const t = setTimeout(() => setStepperVisible(true), ANIMATED_BUTTON_RUNTIME_MS);
      return () => clearTimeout(t);
    }
    setStepperVisible(true);
  }, [cartQuantity, willUseAnimation]);

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

  /// Stepper handlers. Decrement uses updateQuantity which auto-removes
  /// the line when quantity hits 0 — the next render flips the slot
  /// back to the Add-to-Cart button. Increment just calls addItem
  /// (it merges into the existing line by productId). Same hasPrice
  /// guard as handleAdd so the stepper can't accidentally be wired
  /// onto an info-only card.
  const handleIncrement = handleAdd;
  const handleDecrement = () => updateQuantity(id, cartQuantity - 1);

  const btn = buttonClasses[buttonVariant];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <button
        type="button"
        aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        aria-pressed={wished}
        onClick={() => setWished((w) => !w)}
        /* h-9 w-9 (36px) on mobile is the secondary-action middle
           ground — bigger than the previous 28px finger-flub size,
           tighter than 44px which would crowd the card image at
           360px viewport widths. Desktop keeps the compact 28px. */
        className={`absolute z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-sm transition-colors hover:text-danger active:scale-95 md:h-7 md:w-7 ${
          isDeal ? 'left-2 top-2' : 'right-2 top-2'
        }`}
      >
        <Heart
          size={18}
          fill={wished ? 'currentColor' : 'none'}
          className={`md:!h-4 md:!w-4 ${wished ? 'text-danger' : ''}`}
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
            className={`absolute z-10 flex items-center gap-1 rounded-input bg-amber px-2 py-0.5 font-raleway text-[11px] font-bold leading-tight text-navy md:text-[10px] ${
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
            className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-input bg-white/95 px-1.5 py-0.5 font-sans text-[11px] font-semibold leading-tight text-charcoal shadow-sm backdrop-blur md:text-[10px]"
            title={`Product Of ${country.name}`}
          >
            <Flag code={country.code} title={country.name} size="sm" />
            <span>Product Of {country.name}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {/* Title bumped to text-xs (12px) on mobile so product
            names are actually legible at 360px — text-[11px] was on
            the readability floor for body copy. min-h pinned in em
            so the cards stay aligned regardless of one-line vs
            two-line names. */}
        <h3 className="line-clamp-2 min-h-[2.5em] font-raleway text-xs font-semibold leading-snug text-charcoal md:text-xs">
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
                className="font-sans text-[11px] text-muted line-through md:text-xs"
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
           * the pre-stage-3 button behaviour. min-h-9 (36px) keeps
           * the OOS button visually consistent with the active
           * Add-to-Cart button below — cards stay aligned in a grid. */
          <button
            type="button"
            disabled
            className={`mt-auto inline-flex min-h-[36px] items-center justify-center rounded-btn px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${btn.oos}`}
          >
            Read More
          </button>
        ) : cartQuantity > 0 && stepperVisible ? (
          /* Tracker #51 — once at least 1 of this product is in the
           * cart AND the deferred-animation timer has elapsed, swap
           * the Add-to-Cart slot for the in-place stepper. The defer
           * lets the truck animation play through; without it the
           * animated button unmounts mid-frame on the very first
           * click and customers never see the truck. Tapping − at
           * qty 1 drops to 0 and the next render flips the slot
           * back to the Add-to-Cart button below. */
          <CardCartStepper
            productName={name}
            quantity={cartQuantity}
            variant={buttonVariant}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
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
           * card used pre-stage-3. min-h-9 (36px) is the floor for
           * card-button tap targets — bigger than that would
           * over-balance the small card art. */
          <button
            type="button"
            onClick={handleAdd}
            className={`mt-auto inline-flex min-h-[36px] items-center justify-center rounded-btn px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn transition-colors active:scale-[0.98] ${btn.base}`}
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
