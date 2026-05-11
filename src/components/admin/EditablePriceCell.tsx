'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, History, Loader2, Pencil, X } from 'lucide-react';
import { HttpApiError } from '@/lib/api/client';
import { adminUpdateProductPrice } from '@/lib/api/admin';
import { toast } from '@/components/admin/Toast';
import { formatPriceNGN } from '@/lib/format';

/**
 * Inline editable price column for /admin/products.
 *
 * Read mode: shows price + (if set) strike-through comparePrice, plus
 * a small edit pencil and history-icon affordance on hover.
 *
 * Edit mode: two number inputs (price + optional comparePrice) with
 * Save / Cancel buttons. Enter saves, Escape cancels. Click-outside
 * also cancels — we'd rather lose an unintentional edit than lose
 * an intentional one to a misclick.
 *
 * Writes go through `PATCH /api/admin/products/:id/price` which routes
 * to `applyPriceChange(source: INLINE)` so the audit log captures the
 * change. The server's `noop: true` flag skips the success toast when
 * an admin enters the same value twice.
 */
interface EditablePriceCellProps {
  productId: string;
  productName: string;
  price: number;
  comparePrice: number | null;
  onChanged: (next: { price: number; comparePrice: number | null }) => void;
  onOpenHistory: () => void;
}

export function EditablePriceCell({
  productId,
  productName,
  price,
  comparePrice,
  onChanged,
  onOpenHistory,
}: EditablePriceCellProps) {
  const [editing, setEditing] = useState(false);
  const [priceInput, setPriceInput] = useState(price.toString());
  const [compareInput, setCompareInput] = useState(
    comparePrice != null ? comparePrice.toString() : '',
  );
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const priceFieldRef = useRef<HTMLInputElement>(null);

  // Reset inputs when the source values change (re-fetch / external
  // update). Otherwise an admin saves, the page re-fetches, and
  // re-opening edit would show stale text.
  useEffect(() => {
    setPriceInput(price.toString());
    setCompareInput(comparePrice != null ? comparePrice.toString() : '');
  }, [price, comparePrice]);

  useEffect(() => {
    if (!editing) return;
    // Focus + select on enter so the admin can immediately type
    // over the existing price without an extra triple-click.
    priceFieldRef.current?.focus();
    priceFieldRef.current?.select();
  }, [editing]);

  // Click-outside → cancel. Listen on the document; this is the
  // cheapest way to handle the "user clicked another row" case
  // without a global modal.
  useEffect(() => {
    if (!editing) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        // Cancel — don't auto-save on blur; the user might be
        // clicking away to abandon.
        setEditing(false);
        setPriceInput(price.toString());
        setCompareInput(comparePrice != null ? comparePrice.toString() : '');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editing, price, comparePrice]);

  const handleSave = async () => {
    const nextPrice = Number(priceInput);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast('Price must be a non-negative number', 'error');
      return;
    }
    const trimmed = compareInput.trim();
    let nextCompare: number | null = null;
    if (trimmed.length > 0) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) {
        toast('Compare-at price must be a non-negative number or blank', 'error');
        return;
      }
      nextCompare = n;
    }
    setSaving(true);
    try {
      const r = await adminUpdateProductPrice(productId, {
        price: nextPrice,
        comparePrice: nextCompare,
      });
      if (!r.noop) {
        toast(`Saved ${productName}`);
        onChanged({ price: r.newPrice, comparePrice: r.newComparePrice });
      }
      setEditing(false);
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to save price',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(false);
      setPriceInput(price.toString());
      setCompareInput(comparePrice != null ? comparePrice.toString() : '');
    }
  };

  if (editing) {
    return (
      <div ref={containerRef} className="flex items-start gap-1">
        <div className="flex flex-col gap-1">
          <input
            ref={priceFieldRef}
            type="number"
            inputMode="numeric"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            aria-label={`${productName} price`}
            min={0}
            className="w-24 rounded-input border border-navy bg-white px-2 py-1 font-raleway text-sm font-semibold text-navy focus:outline-none"
          />
          <input
            type="number"
            inputMode="numeric"
            value={compareInput}
            onChange={(e) => setCompareInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            placeholder="Compare-at"
            aria-label={`${productName} compare-at price`}
            min={0}
            className="w-24 rounded-input border border-border bg-white px-2 py-1 font-sans text-xs text-muted focus:border-navy focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          aria-label="Save price"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-white hover:bg-success/85 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" aria-hidden />
          ) : (
            <Check size={12} aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setPriceInput(price.toString());
            setCompareInput(comparePrice != null ? comparePrice.toString() : '');
          }}
          disabled={saving}
          aria-label="Cancel"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-charcoal hover:border-danger hover:text-danger disabled:opacity-50"
        >
          <X size={12} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1.5">
      <div className="flex flex-col leading-tight">
        <span className="font-raleway font-semibold text-navy">
          {formatPriceNGN(price)}
        </span>
        {comparePrice != null && comparePrice > price ? (
          <span className="font-sans text-[11px] text-muted line-through">
            {formatPriceNGN(comparePrice)}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${productName} price`}
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-navy/10 hover:text-navy group-hover:opacity-100"
      >
        <Pencil size={12} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onOpenHistory}
        aria-label={`View ${productName} price history`}
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-navy/10 hover:text-navy group-hover:opacity-100"
      >
        <History size={12} aria-hidden />
      </button>
    </div>
  );
}
