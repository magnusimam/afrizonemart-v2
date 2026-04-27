'use client';

import { useState } from 'react';
import { Download, FileUp, X } from 'lucide-react';
import { adminBulkUploadProducts, type BulkUploadResult } from '@/lib/api/admin';
import { HttpApiError } from '@/lib/api/client';
import { toast } from '@/components/admin/Toast';

const TEMPLATE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/admin/products/bulk-template`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportCsvDialog({ open, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
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
      const res = await adminBulkUploadProducts(text);
      setResult(res);
      toast(
        `Imported: ${res.created} created, ${res.updated} updated${res.errors ? `, ${res.errors} errors` : ''}`,
        res.errors > 0 ? 'info' : 'success',
      );
      onSuccess?.();
    } catch (e) {
      setError(e instanceof HttpApiError ? e.message : e instanceof Error ? e.message : 'Upload failed');
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
            <h2 className="font-raleway text-lg font-bold text-navy">Import products from CSV</h2>
            <p className="mt-1 font-sans text-xs text-muted">
              Upserts by slug. Existing products keep their attributes; new products get sensible defaults.
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
                className="mb-4 inline-flex items-center gap-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:underline"
              >
                <Download size={13} aria-hidden /> Download template CSV
              </a>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border bg-page py-10 text-center hover:border-navy">
                <FileUp size={28} className="text-navy" aria-hidden />
                <span className="font-raleway text-sm font-bold text-navy">
                  {file ? file.name : 'Pick a CSV file'}
                </span>
                <span className="font-sans text-[11px] text-muted">
                  Required columns: slug, name, price, categorySlug
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
                <Stat label="Total" value={result.total} />
                <Stat label="Created" value={result.created} tone="success" />
                <Stat label="Updated" value={result.updated} tone="info" />
                <Stat label="Errors" value={result.errors} tone={result.errors > 0 ? 'error' : 'muted'} />
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
                          <span className="font-mono text-[11px] text-muted">Row {r.row}</span>{' '}
                          {r.slug && (
                            <span className="font-mono text-[11px] text-charcoal">({r.slug})</span>
                          )}{' '}
                          — {r.message}
                        </li>
                      ))}
                    {result.errors > 25 && (
                      <li className="text-muted">…and {result.errors - 25} more.</li>
                    )}
                  </ul>
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
                onClick={handleUpload}
                disabled={busy || !file}
                className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Importing…' : 'Import'}
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
      <span className={`font-raleway text-2xl font-bold ${colors[tone]}`}>{value}</span>
    </div>
  );
}
