'use client';

import { ShoppingCart } from 'lucide-react';
import { DisplayPrice } from './DisplayPrice';

interface StaticAddToCartButtonProps {
  /// Idle label text (e.g. "Add to Cart"). The price is rendered
  /// separately via `priceNgn` + `originCountry` so the on-button
  /// price displays in the origin currency consistent with the rest
  /// of the PDP.
  label?: string;
  /// Total price in NGN (matches the existing `totalPrice` in
  /// ProductInfo). Renders via DisplayPrice so the button price
  /// matches the surrounding PDP currency display.
  priceNgn: number;
  /// Origin country code threaded through to DisplayPrice.
  originCountry?: string | null;
  onAdd: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Plain "Add to Cart" PDP button. Used as:
 *   1. The output when the `animated_pdp_add_to_cart_button` flag
 *      is OFF (admin kill-switch).
 *   2. The `<SafeBoundary>` fallback for the animated button — if
 *      it throws on render, the static one renders so the customer
 *      can still buy.
 *
 * Behaviourally identical to the inline button this component
 * replaced inside `ProductInfo.tsx`. Same visual: full-width navy
 * button with shopping-cart icon, label, and the displayed price.
 *
 * **Note**: this Static version doesn't take a `label` that already
 * includes the price (unlike the truck button's `label="Pay {price}"`).
 * It takes `label` as just the text and `priceNgn` separately so the
 * displayed price matches the rest of the PDP's origin-currency
 * treatment via `DisplayPrice`.
 */
export function StaticAddToCartButton({
  label = 'Add to Cart',
  priceNgn,
  originCountry,
  onAdd,
  disabled,
  className,
}: StaticAddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={
        className ??
        'flex w-full items-center justify-center gap-2 rounded-btn bg-navy py-4 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      <ShoppingCart size={18} aria-hidden />
      {label} —{' '}
      <DisplayPrice
        amountNgn={priceNgn}
        originCountry={originCountry}
        compact
      />
    </button>
  );
}
