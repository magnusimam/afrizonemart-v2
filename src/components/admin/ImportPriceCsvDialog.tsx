'use client';

import { useState } from 'react';
import { Download, FileUp, X } from 'lucide-react';
import {
  adminBulkUploadPrices,
  type PriceBulkUploadResult,
} from '@/lib/api/admin';
import { HttpApiError } from '@/lib/api/client';
import { toast } from '@/components/admin/Toast';
import { formatPriceNGN } from '@/lib/format';

/**
 * Bulk-price CSV import dialog. Sibling of `<ImportCsvDialog />`
 * (which does full product upserts) — this one ONLY touches prices
 * on existing products, looked up by slug.
 *
 * Server writes go through `applyPriceChange(source: CSV)` so each
 * change ends up in the product's price-history drawer attributed
 * to the importing admin.
 */

const TEMPLATE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/admin/products/bulk-price-template`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportPriceCsvDialog({ open, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PriceBulkUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await adminBulkUploadPrices(text);
      setResult(res);
      const headline = `${res.updated} updated${res.unchanged ? `, ${res.unchanged} unchanged` : ''}${res.notFound ? `, ${res.notFound} not found` : ''}${res.errors ? `, ${res.errors} errors` : ''}`;
      toast(`Price import: ${headline}`, res.errors > 0 ? 'info' : 'success');
      onSuccess?.();
    } catch (e) {
      setError(
        e instanceof HttpApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Upload failed',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-card bg-white shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">
              Import prices from CSV
            </h2>
            <p className="mt-1 font-sans text-xs text-muted">
              Updates price + compare-at on existing products. Each row
              lands in the product&apos;s price-history audit.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-charcoal disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!result && (
            <>
              <a
                href={TEMPLATE_URL}
                download
                className="mb-3 inline-flex items-center gap-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:underline"
              >
                <Download size={13} aria-hidden /> Download template CSV
              </a>

              <details className="mb-4 rounded-card border border-border bg-page p-3 font-sans text-xs text-charcoal">
                <summary className="cursor-pointer font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
                  Columns + matching rules
                </summary>
                <ul className="mt-2 flex flex-col gap-1.5 leading-relaxed text-muted">
                  <li>
                    <strong className="text-charcoal">slug</strong> — required;
                    looks up the product. Aliases:{' '}
                    <code className="rounded bg-white px-1">sku</code>,{' '}
                    <code className="rounded bg-white px-1">productSlug</code>.
                  </li>
                  <li>
                    <strong className="text-charcoal">price</strong> — required;
                    new price in NGN. Currency markers (&apos;₦&apos;, &apos;$&apos;) and
                    commas are stripped. Aliases:{' '}
                    <code className="rounded bg-white px-1">newPrice</code>.
                  </li>
                  <li>
                    <strong className="text-charcoal">comparePrice</strong> —
                    optional strike-through anchor. Blank cell clears the
                    field. Missing column leaves it unchanged. Aliases:{' '}
                    <code className="rounded bg-white px-1">compareAtPrice</code>,{' '}
                    <code className="rounded bg-white px-1">was</code>.
                  </li>
                  <li>
                    <strong className="text-charcoal">reason</strong> — optional
                    free-form note that lands on the audit row (e.g.
                    &quot;Q3 supplier price hike&quot;). Surfaces in the history
                    drawer. Aliases:{' '}
                    <code className="rounded bg-white px-1">note</code>.
                  </li>
                  <li>
                    <strong className="text-charcoal">Unknown columns</strong>{' '}
                    are ignored. Rows whose slug doesn&apos;t match an existing
                    product are reported as not-found (not errors).
                  </li>
                  <li>
                    <strong className="text-charcoal">No-op rows</strong>{' '}
                    (where the price matches what&apos;s already on the row) are
                    counted as &quot;unchanged&quot; — no audit entry is
                    written and no toast spam.
                  </li>
                  <li>
                    To create new products, use the regular Import CSV
                    instead — this one only updates existing.
                  </li>
                </ul>
              </details>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border bg-page py-10 text-center hover:border-navy">
                <FileUp size={28} className="text-navy" aria-hidden />
                <span className="font-raleway text-sm font-bold text-navy">
                  {file ? file.name : 'Pick a CSV file'}
                </span>
                <span className="font-sans text-[11px] text-muted">
                  Columns: slug, price, comparePrice, reason
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>

              {error && (
                <p className="mt-4 rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">
                  {error}
                </p>
              )}
            </>
          )}

          {result && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Updated" value={result.updated} tone="success" />
                <Stat label="Unchanged" value={result.unchanged} tone="muted" />
                <Stat
                  label="Not found"
                  value={result.notFound}
                  tone={result.notFound > 0 ? 'info' : 'muted'}
                />
                <Stat
                  label="Errors"
                  value={result.errors}
                  tone={result.errors > 0 ? 'error' : 'muted'}
                />
              </div>

              {result.errors > 0 && (
                <div className="rounded-card border border-danger/30 bg-danger/5 p-3">
                  <p className="mb-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger">
                    Errors
                  </p>
                  <ul className="flex flex-col gap-1 font-sans text-xs text-charcoal">
                    {result.results
                      .filter((r) => r.status === 'error')
                      .slice(0, 25)
                      .map((r) => (
                        <li key={r.row}>
                          <span className="font-mono text-[11px] text-muted">
                            Row {r.row}
                          </span>{' '}
                          {r.slug && (
                            <span className="font-mono text-[11px] text-charcoal">
                              ({r.slug})
                            </span>
                          )}{' '}
                          — {r.message}
                        </li>
                      ))}
                    {result.errors > 25 && (
                      <li className="text-muted">
                        …and {result.errors - 25} more.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {result.notFound > 0 && (
                <div className="rounded-card border border-amber/30 bg-amber/5 p-3">
                  <p className="mb-2 font-raleway text-xs font-bold uppercase tracking-btn text-amber-dark">
                    Slugs not found ({result.notFound})
                  </p>
                  <ul className="flex flex-wrap gap-1.5 font-sans text-xs">
                    {result.results
                      .filter((r) => r.status === 'not-found')
                      .slice(0, 30)
                      .map((r) => (
                        <li
                          key={r.row}
                          className="rounded-full border border-amber/40 bg-white px-2 py-0.5 font-mono text-[11px] text-charcoal"
                        >
                          {r.slug ?? `row ${r.row}`}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {result.updated > 0 && (
                <div className="rounded-card border border-border bg-white p-3">
                  <p className="mb-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
                    First 10 updates
                  </p>
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="text-muted">
                      <tr>
                        <th className="pb-1 pr-2">Slug</th>
                        <th className="pb-1 pr-2 text-right">Old</th>
                        <th className="pb-1 text-right">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results
                        .filter((r) => r.status === 'updated')
                        .slice(0, 10)
                        .map((r) => (
                          <tr key={r.row} className="border-t border-border">
                            <td className="py-1 pr-2 font-mono text-charcoal">
                              {r.slug}
                            </td>
                            <td className="py-1 pr-2 text-right text-charcoal">
                              {r.oldPrice != null
                                ? formatPriceNGN(r.oldPrice)
                                : '—'}
                            </td>
                            <td className="py-1 text-right font-semibold text-navy">
                              {r.newPrice != null
                                ? formatPriceNGN(r.newPrice)
                                : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-page px-6 py-3">
          {!result ? (
            <>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={busy || !file}
                className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Importing…' : 'Import prices'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
              >
                Import another
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
              >
                Done
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'success' | 'info' | 'error';
}) {
  const colors: Record<string, string> = {
    muted: 'text-charcoal',
    success: 'text-success',
    info: 'text-navy',
    error: 'text-danger',
  };
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-white p-3">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </span>
      <span className={`font-raleway text-2xl font-bold ${colors[tone]}`}>
        {value}
      </span>
    </div>
  );
}
