'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Check,
  Gem,
  Globe2,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useCheckoutStore, type ShippingAddress } from '@/stores/checkoutStore';
import { useAuthStore } from '@/stores/authStore';
import { listAddresses, type SavedAddress } from '@/lib/api/addresses';
import { fetchShippingQuotes } from '@/lib/api/shipping';
import type { FeatureIcon, ProductDetail } from '@/lib/products';
import { BundleSelector } from './BundleSelector';
import { ShareProductButton } from './ShareProductButton';
import { ShareAsImageButton } from './ShareAsImageButton';
import { ProductAccordion } from './ProductAccordion';
import { QuantitySelector } from './QuantitySelector';
import { DisplayPrice } from './DisplayPrice';
import { AnimatedAddToCartButton } from './AnimatedAddToCartButton';
import { PayWithCoinButton } from './PayWithCoinButton';
import { StaticAddToCartButton } from './StaticAddToCartButton';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { useFlag } from '@/lib/useFlag';

/// Maps a SavedAddress (compact API shape, single fullName +
/// addressLine) to the richer ShippingAddress the checkoutStore +
/// payment page expect. Missing fields stay empty — the payment
/// page renders the address read-only and order create accepts
/// empty region / postalCode for now. Best-effort only; the
/// fallback to /checkout/shipping kicks in on any failure.
function savedToShippingAddress(
  a: SavedAddress,
  email: string,
): ShippingAddress {
  const parts = (a.fullName ?? '').trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
    email,
    phone: a.phone ?? '',
    country: a.country ?? '',
    region: '',
    city: a.city ?? '',
    street: a.addressLine ?? '',
    apartment: '',
    postalCode: '',
    instructions: '',
  };
}

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
  /// Tracker #45 — Imported / partially-filled products may not have any
  /// bundles. We synthesize a single "default" bundle from the product
  /// price so the BundleSelector + add-to-cart flow keeps working, and
  /// we point it at the product's default ProductVariant (defaultVariantId)
  /// so the cart sync endpoint accepts the line.
  const bundles = product.bundles.length > 0
    ? product.bundles
    : [
        {
          variantId: product.defaultVariantId,
          label: '1 unit',
          price: product.price,
          units: 1,
          comparePrice: product.comparePrice ?? product.price,
        },
      ];
  /// Prefer an admin-flagged "popular" bundle, else default to the
  /// smallest pack (typically the 1-unit single) so customers who
  /// just want one aren't silently forced into a multi-pack.
  const popularIdx = bundles.findIndex((b) => b.popular);
  const smallestIdx = bundles.reduce(
    (best, b, i) => (b.units < bundles[best].units ? i : best),
    0,
  );
  const initialBundle = popularIdx >= 0 ? popularIdx : smallestIdx;
  const [variant, setVariant] = useState(product.variants?.default ?? '');
  const [bundleIndex, setBundleIndex] = useState(initialBundle);
  const [quantity, setQuantity] = useState(1);
  const [wished, setWished] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setShipping = useCheckoutStore((s) => s.setShipping);
  const setSelectedQuote = useCheckoutStore((s) => s.setSelectedQuote);
  const setShippingRateId = useCheckoutStore((s) => s.setShippingRateId);
  const router = useRouter();

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
    const displayVariant = [selectedBundle.label, variant].filter(Boolean).join(' · ');
    /// Tracker #45 — productId is the slug used by the local store as a
    /// uniqueness key. The server-side cart key is productVariantId.
    /// We compose the local key from the variantId + freeform variant so
    /// "Carton (12) · Red" and "Carton (12) · Blue" become separate
    /// cart lines locally even though the server-side variant row is
    /// the same.
    const variantId = selectedBundle.variantId ?? product.defaultVariantId ?? '';
    const localKey = variant ? `${variantId}::${variant}` : variantId;
    addItem(
      {
        productId: localKey || product.slug,
        productVariantId: variantId || undefined,
        bundleLabel: selectedBundle.label,
        variantLabel: variant || undefined,
        slug: product.slug,
        name: product.name,
        price: selectedBundle.price,
        comparePrice: selectedBundle.comparePrice,
        discountPercent: selectedBundle.savings ?? product.discountPercent,
        image: product.images[0]?.src ?? '',
        origin: product.origin,
        variant: displayVariant,
      },
      quantity,
    );
  };

  /// "Buy Now" fast-buy prep. Tries to land the customer straight on
  /// /checkout/payment by hydrating the checkoutStore from their
  /// default saved address and auto-picking the cheapest shipping
  /// quote for the just-added bundle. Returns true on success — caller
  /// then routes to /payment. Any failure (anonymous, no default,
  /// no quotes for the destination, API down) returns false and the
  /// caller falls back to /checkout/shipping where the customer fills
  /// the gap in by hand.
  const prepFastBuy = async (): Promise<boolean> => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return false;
    try {
      const { items: addresses } = await listAddresses(accessToken);
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (!def) return false;
      const shipping = savedToShippingAddress(def, useAuthStore.getState().user?.email ?? '');
      /// Use the freshly-mutated cart from the store getter; the
      /// useCartStore hook above gives a reactive `items` snapshot
      /// that lags one render behind the addItem we just did.
      const cartItems = useCartStore.getState().items.map((i) => ({
        productId: i.productId,
        qty: i.quantity,
      }));
      const dest = {
        country: def.country.toUpperCase(),
        city: def.city || undefined,
        addressLine: def.addressLine || undefined,
      };
      const { quotes } = await fetchShippingQuotes(dest, cartItems);
      if (!quotes.length) return false;
      /// Cheapest first. The customer can change it on the payment
      /// page later if they want to upgrade to express, but the
      /// default keeps the price low and matches what most users want.
      const cheapest = [...quotes].sort((a, b) => a.amountNgn - b.amountNgn)[0];
      setShipping(shipping);
      setSelectedQuote(cheapest);
      setShippingRateId(cheapest.rateId ?? undefined);
      return true;
    } catch {
      return false;
    }
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
          disabled={!product.inStock || buyingNow}
          onClick={async () => {
            handleAddToCart();
            setBuyingNow(true);
            /// "Buy Now" intent: jump as far into checkout as we can.
            /// For signed-in customers with a saved address we can
            /// land them on /checkout/payment with the cheapest
            /// shipping quote pre-selected. Otherwise fall back to
            /// /checkout/shipping (same place the cart's Proceed to
            /// Checkout link sends them — never /checkout, which is
            /// a 404 page).
            const fastBuyReady = await prepFastBuy();
            setBuyingNow(false);
            router.push(fastBuyReady ? '/checkout/payment' : '/checkout/shipping');
          }}
          className="w-full rounded-btn border-2 border-navy bg-white py-3.5 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-navy"
        >
          {buyingNow ? 'Preparing…' : 'Buy Now'}
        </button>

        <PayWithCoinButton
          productPriceNgn={totalPrice}
          onAdd={handleAddToCart}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-card border border-border bg-page p-3 md:gap-3 md:p-4">
        <TrustBadge Icon={Truck} title="Free Shipping" caption="Over NGN10,000" />
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
