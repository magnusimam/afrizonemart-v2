'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { HttpApiError } from '@/lib/api/client';
import {
  adminBulkProductAction,
  adminBulkRepricePreview,
  type RepriceAction,
  type RepriceApplyTo,
  type RepriceMode,
  type RepricePreviewItem,
} from '@/lib/api/admin';
import { toast } from '@/components/admin/Toast';
import { formatPriceNGN } from '@/lib/format';

/**
 * Bulk re-price modal — one component, two presentation modes:
 *
 *  - `quick`  : just the form + Apply. Opened from the bulk
 *               action dropdown for fast batch ops on small
 *               selections.
 *  - `preview`: form + scrollable before/after preview list +
 *               Apply. Opened from the dedicated "Preview
 *               re-price" button when the admin wants to review
 *               every affected row first.
 *
 * Both write through the same /api/admin/products/bulk endpoint
 * (kind: 'reprice'). The preview view calls a separate
 * /reprice-preview endpoint that shares the math with the
 * commit path — no drift between what you see and what you get.
 */

interface BulkRepriceModalProps {
  open: boolean;
  /// Currently selected product ids. Modal does nothing if this
  /// is empty.
  ids: string[];
  /// Initial presentation. Affects which screen opens first; the
  /// admin can flip a checkbox inside to show/hide preview.
  mode: 'quick' | 'preview';
  onClose: () => void;
  /// Called after a successful commit so the parent can re-fetch.
  onApplied: (result: { affected: number; skipped: number }) => void;
}

export function BulkRepriceModal({
  open,
  ids,
  mode,
  onClose,
  onApplied,
}: BulkRepriceModalProps) {
  const [repriceMode, setRepriceMode] = useState<RepriceMode>('percent-up');
  const [value, setValue] = useState('5');
  const [applyTo, setApplyTo] = useState<RepriceApplyTo>('price');
  const [reason, setReason] = useState('');
  const [showPreview, setShowPreview] = useState(mode === 'preview');
  const [preview, setPreview] = useState<RepricePreviewItem[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [committing, setCommitting] = useState(false);

  // Reset state when re-opened. Keeps the form fresh between
  // openings so a previous +5% doesn't bleed into the next op.
  useEffect(() => {
    if (open) {
      setRepriceMode('percent-up');
      setValue('5');
      setApplyTo('price');
      setReason('');
      setShowPreview(mode === 'preview');
      setPreview(null);
    }
  }, [open, mode]);

  // Debounced preview fetch. Re-runs whenever form fields or
  // selection change, but only when the preview screen is shown
  // so quick-mode users don't pay the cost.
  useEffect(() => {
    if (!open || !showPreview || ids.length === 0) {
      setPreview(null);
      return;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      void adminBulkRepricePreview(ids, {
        kind: 'reprice',
        mode: repriceMode,
        value: numeric,
        applyTo,
      })
        .then((r) => {
          if (!cancelled) setPreview(r.items);
        })
        .catch((e) => {
          if (cancelled) return;
          toast(
            e instanceof HttpApiError ? e.message : 'Failed to load preview',
            'error',
          );
          setPreview([]);
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, showPreview, ids, repriceMode, value, applyTo]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !committing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, committing]);

  if (!open) return null;

  const numericValue = Number(value);
  const valueValid = Number.isFinite(numericValue) && numericValue >= 0;

  const changingCount = preview?.filter((p) => !p.noop).length ?? 0;
  const noopCount = preview?.filter((p) => p.noop).length ?? 0;

  const action: RepriceAction = {
    kind: 'reprice',
    mode: repriceMode,
    value: numericValue,
    applyTo: repriceMode === 'set' ? applyTo : 'price',
    reason: reason.trim() || undefined,
  };

  const handleApply = async () => {
    if (!valueValid || ids.length === 0) return;
    if (
      showPreview &&
      !window.confirm(
        `Apply this re-price to ${changingCount} product${changingCount === 1 ? '' : 's'}? This cannot be undone in bulk (each row can be reverted individually from its history drawer).`,
      )
    ) {
      return;
    }
    setCommitting(true);
    try {
      const r = await adminBulkProductAction(ids, action);
      toast(`Re-priced ${r.affected} product${r.affected === 1 ? '' : 's'}`);
      if (r.skipped.length > 0) {
        toast(
          `${r.skipped.length} row${r.skipped.length === 1 ? '' : 's'} skipped — check console for details`,
          'info',
        );
        // eslint-disable-next-line no-console
        console.warn('Bulk reprice skipped rows', r.skipped);
      }
      onApplied({ affected: r.affected, skipped: r.skipped.length });
      onClose();
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Re-price failed',
        'error',
      );
    } finally {
      setCommitting(false);
    }
  };

  const modeLabel =
    repriceMode === 'set'
      ? 'Set price to'
      : repriceMode === 'percent-up'
        ? 'Increase by'
        : 'Decrease by';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        onClick={() => !committing && onClose()}
        aria-label="Close re-price modal"
        className="absolute inset-0 bg-charcoal/40"
      />
      <div
        className={`relative flex max-h-[90vh] w-full ${
          showPreview ? 'max-w-3xl' : 'max-w-md'
        } flex-col overflow-hidden rounded-card bg-white shadow-xl`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-raleway text-base font-bold text-navy">
              Re-price {ids.length} selected product
              {ids.length === 1 ? '' : 's'}
            </h2>
            <p className="font-sans text-xs text-muted">
              Writes go through the audit log — each row gets a &ldquo;Bulk
              update&rdquo; entry and can be reverted from its history drawer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={committing}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal hover:bg-page disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <fieldset className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <ModeChip
                  active={repriceMode === 'set'}
                  onClick={() => setRepriceMode('set')}
                  label="Set price"
                  hint="Write a fixed price to every row"
                />
                <ModeChip
                  active={repriceMode === 'percent-up'}
                  onClick={() => setRepriceMode('percent-up')}
                  label="Increase %"
                  hint="Raise each current price by N%"
                />
                <ModeChip
                  active={repriceMode === 'percent-down'}
                  onClick={() => setRepriceMode('percent-down')}
                  label="Decrease %"
                  hint="Cut each current price by N%"
                />
              </div>

              <label className="flex flex-col gap-1">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                  {modeLabel}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={committing}
                    min={0}
                    className="w-32 rounded-input border border-border bg-white px-3 py-2 font-raleway text-sm font-semibold text-navy focus:border-navy focus:outline-none"
                  />
                  <span className="font-sans text-xs text-muted">
                    {repriceMode === 'set' ? '₦' : '%'}
                  </span>
                </div>
              </label>

              {repriceMode === 'set' ? (
                <label className="flex flex-col gap-1">
                  <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                    Apply to
                  </span>
                  <select
                    value={applyTo}
                    onChange={(e) =>
                      setApplyTo(e.target.value as RepriceApplyTo)
                    }
                    disabled={committing}
                    className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
                  >
                    <option value="price">Price only</option>
                    <option value="compare">Compare-at only</option>
                    <option value="both">Both (price + compare-at)</option>
                  </select>
                </label>
              ) : null}

              <label className="flex flex-col gap-1">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                  Reason (optional)
                </span>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={committing}
                  maxLength={500}
                  placeholder="e.g. Q3 supplier price hike"
                  className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
                />
              </label>

              <label className="flex items-center gap-2 font-sans text-xs text-charcoal">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  disabled={committing}
                />
                Show before/after preview before applying
              </label>
            </fieldset>
          </div>

          {showPreview ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b border-border bg-page px-5 py-2 font-sans text-[11px] text-muted">
                {preview === null
                  ? 'Computing preview…'
                  : `${changingCount} will change, ${noopCount} no-op`}
              </div>
              <div className="flex-1 overflow-auto px-5 py-3">
                {previewLoading && preview === null ? (
                  <div className="flex items-center gap-2 font-sans text-sm text-muted">
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                    Loading preview…
                  </div>
                ) : !valueValid ? (
                  <p className="font-sans text-sm text-muted">
                    Enter a number to see the preview.
                  </p>
                ) : preview && preview.length === 0 ? (
                  <p className="font-sans text-sm text-muted">
                    Nothing to preview.
                  </p>
                ) : (
                  <table className="w-full text-left font-sans text-sm">
                    <thead className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                      <tr>
                        <th className="pb-2">Product</th>
                        <th className="pb-2 text-right">Old</th>
                        <th className="pb-2 text-right">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview?.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-t border-border ${row.noop ? 'opacity-50' : ''}`}
                        >
                          <td className="py-2 pr-3 text-charcoal">
                            {row.name}
                          </td>
                          <td className="py-2 text-right text-charcoal">
                            {formatPriceNGN(row.oldPrice)}
                            {row.oldComparePrice != null ? (
                              <span className="ml-1 text-[11px] text-muted">
                                / {formatPriceNGN(row.oldComparePrice)}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2 text-right font-semibold text-navy">
                            {row.noop ? (
                              <span className="text-muted">no change</span>
                            ) : (
                              <>
                                {formatPriceNGN(row.newPrice)}
                                {row.newComparePrice != null &&
                                row.newComparePrice !== row.oldComparePrice ? (
                                  <span className="ml-1 text-[11px] text-muted">
                                    / {formatPriceNGN(row.newComparePrice)}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-border bg-page px-5 py-3">
          <span className="font-sans text-xs text-muted">
            {showPreview
              ? `Applying will write to ${changingCount} product${changingCount === 1 ? '' : 's'}.`
              : `Applies to all ${ids.length} selected products.`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={committing}
              className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={
                committing ||
                !valueValid ||
                ids.length === 0 ||
                (showPreview && changingCount === 0)
              }
              className="flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              {committing && <Loader2 size={12} className="animate-spin" aria-hidden />}
              {committing ? 'Applying…' : 'Apply re-price'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`flex flex-col items-start gap-0.5 rounded-card border px-3 py-2 text-left ${
        active
          ? 'border-navy bg-navy text-white'
          : 'border-border bg-white text-charcoal hover:border-navy'
      }`}
    >
      <span className="font-raleway text-xs font-bold uppercase tracking-btn">
        {label}
      </span>
      <span
        className={`font-sans text-[10px] ${
          active ? 'text-white/80' : 'text-muted'
        }`}
      >
        {hint}
      </span>
    </button>
  );
}
