'use client';

import { useRef, useState } from 'react';

interface StaticPlaceOrderButtonProps {
  /// Label rendered when the button is idle. Typically "Pay ₦X,XXX".
  label: string;
  /// Same contract as `PlaceOrderButton.onSubmit` — resolves on
  /// success, rejects on failure. Don't redirect inside; do it in
  /// `onSuccess` so this stays interchangeable with the animated
  /// version.
  onSubmit: () => Promise<void>;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Plain "Pay {price}" button with a "Placing order…" pending state.
 *
 * Used as:
 *  1. The render output when the `animated_place_order_button`
 *     feature flag is OFF (admin kill-switch).
 *  2. The `<SafeBoundary>` fallback for `<PlaceOrderButton>` — if the
 *     animated button throws during render (GSAP load failure, CSS
 *     module break, anything), checkout still works.
 *
 * Behaviourally identical to what the checkout page used to render
 * inline before the animated upgrade. Same submit + redirect contract
 * as `PlaceOrderButton` so the two are 1:1 swappable from the
 * checkout page's POV.
 */
export function StaticPlaceOrderButton({
  label,
  onSubmit,
  onSuccess,
  disabled,
  className,
}: StaticPlaceOrderButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const inflight = useRef(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (inflight.current || disabled) return;
    inflight.current = true;
    setSubmitting(true);
    try {
      await onSubmit();
      onSuccess?.();
    } catch {
      // Parent's submitOrder() already calls setError before
      // throwing; nothing to do here beyond resetting the local
      // pending state.
    } finally {
      inflight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || submitting}
      className={
        className ??
        'rounded-btn bg-navy px-6 py-4 text-center font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50 md:text-base'
      }
    >
      {submitting ? 'Placing order…' : label}
    </button>
  );
}
