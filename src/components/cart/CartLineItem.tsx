'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatPriceNGN } from '@/lib/format';
import { getCountry } from '@/lib/countries';
import { Flag } from '@/components/common/Flag';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import type { CartItem } from '@/types';

interface CartLineItemProps {
  item: CartItem;
}

export function CartLineItem({ item }: CartLineItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const country = getCountry(item.origin);
  const subtotal = item.price * item.quantity;

  return (
    <article className="grid grid-cols-12 items-center gap-3 border-b border-border py-4 last:border-b-0 md:gap-4 md:py-5">
      <button
        type="button"
        onClick={() => removeItem(item.productId)}
        aria-label={`Remove ${item.name} from cart`}
        className="col-span-1 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <X size={18} aria-hidden />
      </button>

      <div className="col-span-11 flex items-center gap-3 md:col-span-5">
        <Link
          href={`/product/${item.slug}`}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-card bg-page md:h-20 md:w-20"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={120}
              height={120}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={28} strokeWidth={1.25} className="text-border" aria-hidden />
          )}
        </Link>

        <div className="flex flex-col gap-1">
          <Link
            href={`/product/${item.slug}`}
            className="font-raleway text-sm font-semibold leading-snug text-navy transition-colors hover:text-amber md:text-base"
          >
            {item.name}
          </Link>
          {item.variant ? (
            <span className="font-sans text-xs text-muted">{item.variant}</span>
          ) : null}
          {country ? (
            <span className="inline-flex items-center gap-1 font-sans text-xs text-muted">
              <Flag code={country.code} title={country.name} size="sm" />
              Made in {country.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="col-span-4 flex flex-col items-start md:col-span-2 md:items-center">
        {item.comparePrice && item.comparePrice > item.price ? (
          <span className="font-sans text-xs text-muted line-through">
            {formatPriceNGN(item.comparePrice)}
          </span>
        ) : null}
        <span className="font-raleway text-sm font-bold text-navy md:text-base">
          {formatPriceNGN(item.price)}
        </span>
        {item.discountPercent ? (
          <span className="rounded-input bg-amber px-1.5 py-0.5 font-raleway text-[10px] font-bold uppercase text-navy">
            {item.discountPercent}% OFF
          </span>
        ) : null}
      </div>

      <div className="col-span-4 md:col-span-2 md:flex md:justify-center">
        <QuantitySelector
          value={item.quantity}
          onChange={(q) => updateQuantity(item.productId, q)}
        />
      </div>

      <div className="col-span-4 text-right md:col-span-2">
        <span className="font-raleway text-base font-bold text-navy md:text-lg">
          {formatPriceNGN(subtotal)}
        </span>
      </div>
    </article>
  );
}
