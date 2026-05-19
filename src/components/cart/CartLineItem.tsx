'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Package, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { getCountry } from '@/lib/countries';
import { Flag } from '@/components/common/Flag';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { DisplayPrice } from '@/components/product/DisplayPrice';
import type { CartItem } from '@/types';

interface CartLineItemProps {
  item: CartItem;
}

/**
 * Cart line item — distinct layouts per breakpoint.
 *
 * **Mobile (< md)**: flex layout. Three regions side-by-side at the
 * top: [remove] [image] [content], where `content` is a vertical
 * stack of name → variant/origin meta → inline price-row
 * (price · qty · subtotal). Avoids the previous bug where a single
 * 12-col grid wrapped items to 2 rows that visually misaligned, and
 * where QuantitySelector (128px min-width) overflowed its 105px
 * grid cell on small phones.
 *
 * **Desktop (md+)**: 12-col grid, columns aligned with the
 * `Product | Price | Quantity | Subtotal` header row above.
 *
 * Image fallback chain: if `item.image` is empty OR Next/Image's
 * onError fires (stale URL after the product's hero was replaced
 * in admin / R2 cleanup, etc.), the `<Package>` placeholder icon
 * renders in its place. Without this, dead-URL images would leave
 * a blank 64px hole next to the product name.
 */
export function CartLineItem({ item }: CartLineItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const country = getCountry(item.origin);
  const subtotal = item.price * item.quantity;
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = Boolean(item.image) && !imageBroken;

  const imageBox = (
    <Link
      href={`/product/${item.slug}`}
      className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-card bg-page md:h-20 md:w-20"
    >
      {showImage ? (
        <Image
          src={item.image}
          alt={item.name}
          width={120}
          height={120}
          className="h-full w-full object-cover"
          onError={() => setImageBroken(true)}
        />
      ) : (
        <Package size={28} strokeWidth={1.25} className="text-border" aria-hidden />
      )}
    </Link>
  );

  const removeButton = (
    <button
      type="button"
      onClick={() => removeItem(item.productId)}
      aria-label={`Remove ${item.name} from cart`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger active:bg-danger/15 active:text-danger md:h-9 md:w-9"
    >
      <X size={20} aria-hidden />
    </button>
  );

  const nameBlock = (
    <div className="flex min-w-0 flex-col gap-1">
      <Link
        href={`/product/${item.slug}`}
        className="line-clamp-2 font-raleway text-sm font-semibold leading-snug text-navy transition-colors hover:text-amber md:text-base"
      >
        {item.name}
      </Link>
      {item.variant ? (
        <span className="font-sans text-xs text-muted">{item.variant}</span>
      ) : null}
      {country ? (
        <span className="inline-flex items-center gap-1 font-sans text-xs text-muted">
          <Flag code={country.code} title={country.name} size="sm" />
          Product Of {country.name}
        </span>
      ) : null}
    </div>
  );

  return (
    <article className="border-b border-border py-4 last:border-b-0 md:py-5">
      {/* ============================================================
       * Mobile layout (default; hidden ≥ md)
       * ============================================================ */}
      <div className="flex items-start gap-3 md:hidden">
        {removeButton}
        {imageBox}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {nameBlock}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <DisplayPrice
              amountNgn={item.price}
              compact
              className="font-raleway text-sm font-bold text-navy"
            />
            <QuantitySelector
              value={item.quantity}
              onChange={(q) => updateQuantity(item.productId, q)}
            />
            <DisplayPrice
              amountNgn={subtotal}
              compact
              className="font-raleway text-base font-bold text-navy"
            />
          </div>
        </div>
      </div>

      {/* ============================================================
       * Desktop layout (md+) — 12-col grid aligned with the header
       * row in `cart/page.tsx`. Unchanged from the original layout
       * since the original problem was mobile-specific.
       * ============================================================ */}
      <div className="hidden grid-cols-12 items-center gap-4 md:grid">
        <div className="col-span-1">{removeButton}</div>
        <div className="col-span-5 flex min-w-0 items-center gap-3">
          {imageBox}
          {nameBlock}
        </div>
        <div className="col-span-2 flex flex-col items-center">
          {item.comparePrice && item.comparePrice > item.price ? (
            <DisplayPrice
              amountNgn={item.comparePrice}
              compact
              className="font-sans text-xs text-muted line-through"
            />
          ) : null}
          <DisplayPrice
            amountNgn={item.price}
            compact
            className="font-raleway text-base font-bold text-navy"
          />
          {item.discountPercent ? (
            <span className="rounded-input bg-amber px-1.5 py-0.5 font-raleway text-[10px] font-bold uppercase text-navy">
              {item.discountPercent}% OFF
            </span>
          ) : null}
        </div>
        <div className="col-span-2 flex justify-center">
          <QuantitySelector
            value={item.quantity}
            onChange={(q) => updateQuantity(item.productId, q)}
          />
        </div>
        <div className="col-span-2 text-right">
          <DisplayPrice
            amountNgn={subtotal}
            compact
            className="font-raleway text-lg font-bold text-navy"
          />
        </div>
      </div>
    </article>
  );
}
