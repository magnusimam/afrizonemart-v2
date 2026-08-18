'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { HttpApiError } from '@/lib/api/client';
import {
  bookProduction,
  cancelProduction,
  completeProduction,
  getProductionQueue,
  type BookProductionBody,
  type ProductionRow,
} from '@/lib/api/admin-suppliers';

/**
 * Take50 production board — the content shoots at Stage 8.
 *
 * Scoped to the `suppliers.production` capability, so the crew see this and
 * nothing else in the supplier area. Booking a shoot emails the supplier their
 * call sheet, which is why the confirm copy says so explicitly: this is the one
 * action on the page that reaches a real business.
 */

type Filter = 'all' | 'unbooked' | 'scheduled' | 'completed';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: 'Scheduled', cls: 'bg-amber-light text-amber-dark' },
  COMPLETED: { label: 'Shot', cls: 'bg-success/10 text-success' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-danger/10 text-danger' },
};

export default function ProductionPage() {
  const [rows, setRows] = useState<ProductionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<ProductionRow | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = () => {
    getProductionQueue()
      .then((r) => { setRows(r); setError(null); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  };

  useEffect(load, []);

  const shown = useMemo(() => {
    if (!rows) return [];
    if (filter === 'unbooked') return rows.filter((r) => !r.status || r.status === 'CANCELLED');
    if (filter === 'scheduled') return rows.filter((r) => r.status === 'SCHEDULED');
    if (filter === 'completed') return rows.filter((r) => r.status === 'COMPLETED');
    return rows;
  }, [rows, filter]);

  const counts = useMemo(() => ({
    all: rows?.length ?? 0,
    unbooked: rows?.filter((r) => !r.status || r.status === 'CANCELLED').length ?? 0,
    scheduled: rows?.filter((r) => r.status === 'SCHEDULED').length ?? 0,
    completed: rows?.filter((r) => r.status === 'COMPLETED').length ?? 0,
  }), [rows]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); setNote(msg); load(); }
    catch (e) { setNote(e instanceof HttpApiError ? e.message : 'Something went wrong'); }
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Production"
        subtitle="Take50 content shoots. Booking a shoot emails the supplier their call sheet."
      />

      {note && (
        <div role="status" className="rounded-input border border-border bg-page px-3 py-2 font-sans text-sm text-charcoal">
          {note}
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {(['all', 'unbooked', 'scheduled', 'completed'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-btn border px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn ${
              filter === f ? 'border-navy bg-navy text-white' : 'border-border text-muted hover:border-navy hover:text-navy'
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {rows === null ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-card border border-border bg-white p-6 text-center font-sans text-sm text-muted">
          Nothing here yet. Suppliers appear once they reach Stage 8 (Activation &amp; Listing).
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Shoot date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const meta = r.status ? STATUS_META[r.status] : null;
                return (
                  <tr key={r.supplierId} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-raleway font-bold text-navy">{r.company}</p>
                      <p className="font-sans text-xs text-muted">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {meta ? (
                        <span className={`rounded-full px-2.5 py-0.5 font-raleway text-[11px] font-bold ${meta.cls}`}>{meta.label}</span>
                      ) : (
                        <span className="font-sans text-xs text-muted">Not booked</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-sans">
                      {r.scheduledAt
                        ? new Date(r.scheduledAt).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-sans">{r.location ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(r)}
                          className="rounded-btn border border-navy px-3 py-1.5 font-raleway text-xs font-bold text-navy hover:bg-navy-light"
                        >
                          {r.status === 'SCHEDULED' ? 'Reschedule' : 'Book shoot'}
                        </button>
                        {r.status === 'SCHEDULED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => act(() => completeProduction(r.supplierId), `Marked ${r.company} as shot`)}
                              className="rounded-btn bg-navy px-3 py-1.5 font-raleway text-xs font-bold text-white hover:bg-navy-dark"
                            >
                              Mark shot
                            </button>
                            <button
                              type="button"
                              onClick={() => act(() => cancelProduction(r.supplierId), `Cancelled the shoot for ${r.company}`)}
                              className="rounded-btn border border-border px-3 py-1.5 font-raleway text-xs font-bold text-muted hover:border-danger hover:text-danger"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <BookDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); setNote(msg); load(); }}
        />
      )}
    </div>
  );
}

function BookDialog({
  row, onClose, onSaved,
}: { row: ProductionRow; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState<BookProductionBody>({
    // datetime-local wants "YYYY-MM-DDTHH:mm"; slice off seconds/zone.
    scheduledAt: row.scheduledAt ? new Date(row.scheduledAt).toISOString().slice(0, 16) : '',
    location: row.location ?? '',
    contactName: row.contactName ?? '',
    contactPhone: row.contactPhone ?? '',
    productList: row.productList ?? '',
    notes: row.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof BookProductionBody>(k: K, v: BookProductionBody[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.scheduledAt) return setErr('Pick a date and time for the shoot.');
    setBusy(true);
    setErr(null);
    try {
      await bookProduction(row.supplierId, {
        ...form,
        // datetime-local has no zone; send a real instant so the API and the
        // supplier's call sheet agree on the time.
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      onSaved(`Shoot booked — call sheet emailed to ${row.company}`);
    } catch (e) {
      setErr(e instanceof HttpApiError ? e.message : 'Failed to book');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 py-10">
      <div className="w-full max-w-lg rounded-card bg-white shadow-card-hover">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">
              {row.status === 'SCHEDULED' ? 'Reschedule shoot' : 'Book shoot'}
            </h2>
            <p className="font-sans text-xs text-muted">{row.company}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-navy">
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-6 py-5">
          {err && (
            <p role="alert" className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">{err}</p>
          )}
          <Field label="Shoot date & time (WAT)">
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Location">
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Take50 Studio, Lekki, Lagos" className={inputCls} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Crew contact">
              <input type="text" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Contact phone">
              <input type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Products being shot">
            <textarea rows={2} value={form.productList} onChange={(e) => set('productList', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Internal notes (not emailed)">
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-btn border border-border px-4 py-2 font-raleway text-sm font-bold text-muted hover:border-navy hover:text-navy">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} aria-hidden className="animate-spin" /> : <CheckCircle2 size={15} aria-hidden />}
            Book &amp; email call sheet
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-input border border-border px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{label}</span>
      {children}
    </label>
  );
}
