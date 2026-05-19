'use client';

import { Minus, Plus } from 'lucide-react';

/// In-place quantity stepper that replaces the Add-to-Cart button on
/// a product card once the customer has at least 1 of the product in
/// their cart. Tracker #51 (2026-05-19).
///
/// Tapping − decrements; at quantity 1, another tap drops to 0 and
/// the parent card swaps the stepper back out for the Add-to-Cart
/// button. Tapping + adds one more. No modal, no drawer, no popup.
///
/// Matches the Add-to-Cart button's height + radius so the card
/// doesn't reflow when state flips between button and stepper.
/// Background colour follows the same variant the button used.

type ButtonVariant = 'navy' | 'pink';

interface Props {
  /// Product name — used in aria-labels so screen readers say
  /// "Remove one {name}" instead of an anonymous minus button.
  productName: string;
  /// Current quantity of this product in the cart. Caller passes
  /// the value read from the cart store; parent re-renders on
  /// every cart change so this is always live.
  quantity: number;
  variant: ButtonVariant;
  onIncrement: () => void;
  onDecrement: () => void;
}

const variantClasses: Record<ButtonVariant, { wrap: string; btn: string; qty: string }> = {
  navy: {
    wrap: 'bg-navy text-white',
    btn: 'hover:bg-amber hover:text-navy',
    qty: 'text-white',
  },
  pink: {
    wrap: 'bg-pink text-white',
    btn: 'hover:bg-pink-dark',
    qty: 'text-white',
  },
};

export function CardCartStepper({
  productName,
  quantity,
  variant,
  onIncrement,
  onDecrement,
}: Props) {
  const v = variantClasses[variant];
  return (
    <div
      role="group"
      aria-label={`${productName} quantity in cart`}
      className={`mt-auto flex items-stretch overflow-hidden rounded-btn font-raleway text-[10px] font-bold uppercase tracking-btn md:text-xs ${v.wrap}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Remove one ${productName} from cart`}
        className={`flex flex-1 items-center justify-center py-2 transition-colors ${v.btn}`}
      >
        <Minus size={14} aria-hidden strokeWidth={2.5} />
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className={`flex min-w-[2.25rem] items-center justify-center px-2 py-2 ${v.qty}`}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Add one more ${productName} to cart`}
        className={`flex flex-1 items-center justify-center py-2 transition-colors ${v.btn}`}
      >
        <Plus size={14} aria-hidden strokeWidth={2.5} />
      </button>
    </div>
  );
}
