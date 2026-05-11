'use client';

import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, X } from 'lucide-react';
import { HttpApiError } from '@/lib/api/client';
import {
  adminListProductPriceHistory,
  adminUpdateProductPrice,
  type PriceChangeSource,
  type PriceHistoryEntry,
} from '@/lib/api/admin';
import { toast } from '@/components/admin/Toast';
import { formatPriceNGN } from '@/lib/format';

/**
 * Price-history drawer for /admin/products. Opens from the
 * `<EditablePriceCell />` history button. Shows the audit log
 * with one-click revert per row — reverting a row writes through
 * `applyPriceChange(source: REVERT)` so the revert itself becomes
 * a new audit entry (no rows deleted, no rewriting history).
 *
 * Mounted as a fixed right-side drawer; closing via Escape, the
 * X button, or clicking the backdrop.
 */

interface PriceHistoryDrawerProps {
  /// Pass null to close. The drawer renders nothing when closed
  /// so its mount cost is zero on a page that never opens it.
  product:
    | { id: string; name: string; price: number; comparePrice: number | null }
    | null;
  onClose: () => void;
  /// Called after a successful revert so the parent list can
  /// reflect the new price without a full re-fetch.
  onReverted: (next: {
    productId: string;
    price: number;
    comparePrice: number | null;
  }) => void;
}

export function PriceHistoryDrawer({
  product,
  onClose,
  onReverted,
}: PriceHistoryDrawerProps) {
  const [items, setItems] = useState<PriceHistoryEntry[] | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);

  useEffect(() => {
    if (!product) {
      setItems(null);
      return;
    }
    let cancelled = false;
    setItems(null);
    adminListProductPriceHistory(product.id, 100)
      .then((r) => {
        if (!cancelled) setItems(r.items);
      })
      .catch((e) => {
        if (cancelled) return;
        toast(
          e instanceof HttpApiError ? e.message : 'Failed to load history',
          'error',
        );
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const handleRevert = async (row: PriceHistoryEntry) => {
    if (row.oldPrice == null) {
      toast('No prior price to revert to.', 'info');
      return;
    }
    if (
      !window.confirm(
        `Revert "${product.name}" to ${formatPriceNGN(row.oldPrice)}?`,
      )
    ) {
      return;
    }
    setReverting(row.id);
    try {
      const r = await adminUpdateProductPrice(product.id, {
        price: row.oldPrice,
        comparePrice: row.oldComparePrice ?? null,
        reason: `Reverted from history row ${row.id}`,
      });
      if (!r.noop) {
        toast('Price reverted');
        onReverted({
          productId: product.id,
          price: r.newPrice,
          comparePrice: r.newComparePrice,
        });
        // Refresh the history so the new REVERT row shows up.
        const refreshed = await adminListProductPriceHistory(product.id, 100);
        setItems(refreshed.items);
      } else {
        toast('Already at that price', 'info');
      }
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Revert failed',
        'error',
      );
    } finally {
      setReverting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close history"
        className="absolute inset-0 bg-charcoal/40"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-raleway text-base font-bold text-navy">
              Price history
            </h2>
            <p className="font-sans text-xs text-muted">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal hover:bg-page"
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-5 py-4">
          {items === null ? (
            <div className="flex items-center gap-2 font-sans text-sm text-muted">
              <Loader2 size={14} className="animate-spin" aria-hidden /> Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="font-sans text-sm text-muted">No changes yet.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {items.map((row) => (
                <li
                  key={row.id}
                  className="rounded-card border border-border bg-page p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-raleway text-sm font-bold text-navy">
                        {row.oldPrice == null
                          ? formatPriceNGN(row.newPrice)
                          : `${formatPriceNGN(row.oldPrice)} → ${formatPriceNGN(row.newPrice)}`}
                      </span>
                      <span className="font-sans text-[11px] text-muted">
                        {new Date(row.createdAt).toLocaleString()}
                        {' · '}
                        <SourceBadge source={row.source} />
                        {' · '}
                        {row.changedBy?.name ||
                          row.changedBy?.email ||
                          'system'}
                      </span>
                      {row.reason ? (
                        <span className="mt-1 font-sans text-xs italic text-charcoal">
                          {row.reason}
                        </span>
                      ) : null}
                    </div>
                    {row.oldPrice != null ? (
                      <button
                        type="button"
                        onClick={() => void handleRevert(row)}
                        disabled={reverting !== null}
                        aria-label={`Revert to ${formatPriceNGN(row.oldPrice)}`}
                        className="flex items-center gap-1 rounded-btn border border-border bg-white px-2 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-charcoal hover:border-navy hover:text-navy disabled:opacity-50"
                      >
                        {reverting === row.id ? (
                          <Loader2 size={10} className="animate-spin" aria-hidden />
                        ) : (
                          <RotateCcw size={10} aria-hidden />
                        )}
                        Revert
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}

function SourceBadge({ source }: { source: PriceChangeSource }) {
  const label =
    source === 'INLINE'
      ? 'Inline edit'
      : source === 'BULK'
        ? 'Bulk update'
        : source === 'CSV'
          ? 'CSV import'
          : source === 'SCHEDULED'
            ? 'Scheduled'
            : source === 'REVERT'
              ? 'Revert'
              : 'Manual';
  return <span className="font-sans">{label}</span>;
}
