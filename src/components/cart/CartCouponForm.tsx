'use client';

import { type FormEvent, useState } from 'react';
import { Tag } from 'lucide-react';
import { applyCartCoupon, removeCartCoupon, type CartView } from '@/lib/api/cart';
import { HttpApiError } from '@/lib/api/client';

interface Props {
  couponCode: string | null;
  couponDiscount: number;
  onChange: (cart: CartView) => void;
  /** Disabled e.g. when the user is logged out (server cart unavailable). */
  disabled?: boolean;
}

export function CartCouponForm({ couponCode, couponDiscount, onChange, disabled }: Props) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const cart = await applyCartCoupon(code.trim());
      onChange(cart);
      setCode('');
    } catch (err) {
      setError(err instanceof HttpApiError ? err.message : 'Could not apply coupon.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError(null);
    try {
      const cart = await removeCartCoupon();
      onChange(cart);
    } catch (err) {
      setError(err instanceof HttpApiError ? err.message : 'Could not remove coupon.');
    } finally {
      setBusy(false);
    }
  };

  if (couponCode) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-success/30 bg-success/10 p-3">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-success" aria-hidden />
          <div className="flex flex-col">
            <span className="font-raleway text-sm font-bold text-success">
              {couponCode} applied
            </span>
            <span className="font-sans text-xs text-charcoal">
              {couponDiscount > 0
                ? `−₦${couponDiscount.toLocaleString()} off your subtotal`
                : 'Free shipping'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:underline disabled:opacity-50"
        >
          {busy ? 'Removing…' : 'Remove'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleApply} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Tag
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={disabled ? 'Sign in to use a coupon' : 'Coupon code'}
            disabled={disabled || busy}
            className="w-full rounded-input border border-border bg-white py-2.5 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none disabled:bg-page disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim() || busy || disabled}
          className="rounded-btn bg-amber px-6 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          {busy ? 'Applying…' : 'Apply Coupon'}
        </button>
      </form>
      {error ? <p className="font-sans text-xs text-danger">{error}</p> : null}
    </div>
  );
}
