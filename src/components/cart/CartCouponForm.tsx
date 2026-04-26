'use client';

import { type FormEvent, useState } from 'react';
import { Tag } from 'lucide-react';

export interface AppliedCoupon {
  code: string;
  percent: number;
}

const COUPONS: Record<string, number> = {
  AZM10: 10,
  AZM25: 25,
  AFRICA50: 50,
};

interface CartCouponFormProps {
  applied?: AppliedCoupon;
  onApply: (coupon: AppliedCoupon | undefined) => void;
}

export function CartCouponForm({ applied, onApply }: CartCouponFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const upper = code.trim().toUpperCase();
    const percent = COUPONS[upper];
    if (!percent) {
      setError('Coupon code not recognised. Try AZM10, AZM25, or AFRICA50.');
      return;
    }
    onApply({ code: upper, percent });
    setCode('');
  };

  if (applied) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-success/30 bg-success/10 p-3">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-success" aria-hidden />
          <div className="flex flex-col">
            <span className="font-raleway text-sm font-bold text-success">
              {applied.code} applied
            </span>
            <span className="font-sans text-xs text-charcoal">
              {applied.percent}% off your subtotal
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onApply(undefined)}
          className="font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:underline"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
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
            placeholder="Coupon code"
            className="w-full rounded-input border border-border bg-white py-2.5 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim()}
          className="rounded-btn bg-amber px-6 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          Apply Coupon
        </button>
      </form>
      {error ? (
        <p className="font-sans text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
