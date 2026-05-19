'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { DisplayPrice } from './DisplayPrice';

/**
 * Mobile-only sticky bottom CTA bar for PDPs.
 *
 * Industry-standard pattern (Amazon, Shopify storefronts, Apple,
 * etc): once the customer has scrolled past the inline Add-to-Cart
 * block, the page replaces it with a fixed bottom action bar so
 * the conversion CTA is always one thumb-tap away. Below md: only
 * — desktop keeps the inline CTA which is always visible in the
 * right column anyway.
 *
 * Implementation notes:
 *  - The bar appears only after the customer scrolls past ~320px
 *    (the top of the inline CTA on a typical PDP). Before that,
 *    showing both the inline and sticky CTA is just visual noise.
 *  - We honour `pb-safe` so the bar doesn't hide under iOS' home
 *    indicator on the X/14/15-series.
 *  - The Buy Now button stays full-width-ish even on the narrowest
 *    Android (360px Galaxy S8). Add to Cart icon-only at <380px
 *    is a deliberate compactness call so both CTAs survive.
 *
 * Owned by ProductInfo so the same handlers + state (selected
 * bundle/quantity/price) drive both inline and sticky CTAs —
 * the customer can't get them out of sync.
 */
interface StickyMobileBuyBarProps {
  priceNgn: number;
  originCountry?: string;
  disabled: boolean;
  buyingNow: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

/// Reveal threshold. Picked so the bar appears once the inline
/// add-to-cart row is roughly off-screen on a typical PDP. Tuned
/// for the median product (one image + title + price + ~5 features
/// + bundle selector ~ 600px of content above the CTA).
const REVEAL_AFTER_PX = 320;

export function StickyMobileBuyBar({
  priceNgn,
  originCountry,
  disabled,
  buyingNow,
  onAddToCart,
  onBuyNow,
}: StickyMobileBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > REVEAL_AFTER_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-col">
          <span className="font-raleway text-[10px] font-semibold uppercase tracking-btn text-muted">
            Subtotal
          </span>
          <DisplayPrice
            amountNgn={priceNgn}
            originCountry={originCountry}
            compact
            className="font-raleway text-base font-bold text-navy"
          />
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={disabled}
          aria-label="Add to cart"
          className="ml-auto inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-btn border-2 border-navy bg-white px-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white active:bg-navy/90 active:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart size={16} aria-hidden />
          <span className="hidden xs:inline">Add</span>
        </button>

        <button
          type="button"
          onClick={onBuyNow}
          disabled={disabled || buyingNow}
          className="inline-flex h-11 items-center justify-center rounded-btn bg-amber px-4 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-amber/90 active:bg-amber/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buyingNow ? '…' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
