'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, Send, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { PIQ_GENERAL_CONFIG } from '@/lib/supplier/piq-config';
import { SUPPLIER_STAGES } from '@/lib/supplier/stages';
import {
  approveAdminPIQ,
  getAdminPIQ,
  getAllSuppliers,
  getSupplierQueue,
  requestAdminChanges,
  updateSupplierAdmin,
  type AdminPIQDetail,
  type AdminQueuePIQ,
  type AdminSupplier,
} from '@/lib/api/admin-suppliers';

const FIELD_LABEL: Record<string, string> = {};
const ALL_FIELDS: { id: string; label: string }[] = [];
for (const s of PIQ_GENERAL_CONFIG.sections) {
  for (const q of s.questions) {
    FIELD_LABEL[q.id] = q.label;
    ALL_FIELDS.push({ id: q.id, label: q.label });
  }
}

export default function AdminSuppliersPage() {
  const [tab, setTab] = useState<'queue' | 'all'>('queue');
  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Suppliers"
        subtitle="Review product questionnaires and manage supplier onboarding."
      />
      <div className="mb-5 inline-flex rounded-btn border border-border bg-white p-1">
        {(['queue', 'all'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-[6px] px-4 py-1.5 font-raleway text-sm font-bold transition-colors ${
              tab === t ? 'bg-navy text-white' : 'text-muted hover:text-navy'
            }`}
          >
            {t === 'queue' ? 'Review queue' : 'All suppliers'}
          </button>
        ))}
      </div>
      {tab === 'queue' ? <ReviewQueue /> : <AllSuppliers />}
    </div>
  );
}

function ReviewQueue() {
  const [queue, setQueue] = useState<AdminQueuePIQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<AdminPIQDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSupplierQueue()
      .then((items) => !cancelled && setQueue(items))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load queue', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <div>
      <p className="mb-3 font-sans text-sm text-muted">
        {queue.length} questionnaire{queue.length === 1 ? '' : 's'} awaiting review.
      </p>
      {loading ? (
        <p className="font-sans text-sm text-muted">Loading queue…</p>
      ) : queue.length === 0 ? (
        <p className="font-sans text-sm text-muted">Nothing in the review queue. 🎉</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
          <table className="w-full min-w-[680px] text-left">
            <thead className="border-b border-border bg-page">
              <tr className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {queue.map((p) => (
                <tr key={p.id} className="font-sans text-sm hover:bg-page">
                  <td className="px-4 py-3 font-semibold text-navy">{p.company}</td>
                  <td className="px-4 py-3 text-charcoal">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.country}</td>
                  <td className="px-4 py-3 text-muted">{p.completion}%</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        getAdminPIQ(p.id)
                          .then(setSelected)
                          .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'))
                      }
                      className="rounded-btn bg-navy px-4 py-1.5 font-raleway text-xs font-bold tracking-btn text-white transition-colors hover:bg-navy-dark"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ReviewModal
          piq={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            setReload((r) => r + 1);
          }}
        />
      )}
    </div>
  );
}

function AllSuppliers() {
  const [rows, setRows] = useState<AdminSupplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllSuppliers()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load suppliers', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = async (s: AdminSupplier, body: { currentStage?: number; status?: string }, label: string) => {
    const prev = { currentStage: s.currentStage, status: s.status };
    setRows((rs) => rs.map((r) => (r.id === s.id ? { ...r, ...body } : r)));
    try {
      await updateSupplierAdmin(s.id, body);
      toast(label);
    } catch (e) {
      setRows((rs) => rs.map((r) => (r.id === s.id ? { ...r, ...prev } : r)));
      toast(e instanceof HttpApiError ? e.message : 'Update failed', 'error');
    }
  };

  if (loading) return <p className="font-sans text-sm text-muted">Loading suppliers…</p>;

  return (
    <div>
      <p className="mb-3 font-sans text-sm text-muted">{rows.length} suppliers.</p>
      <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b border-border bg-page">
            <tr className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id} className="font-sans text-sm align-top hover:bg-page">
                <td className="px-4 py-3">
                  <div className="font-semibold text-navy">{s.company}</div>
                  <div className="text-xs text-muted">{s.email}</div>
                  {s.source === 'sheet-import' && (
                    <span className="mt-1 inline-block rounded-full bg-navy-light px-2 py-0.5 font-raleway text-[10px] font-bold text-navy">
                      imported
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-charcoal">
                  {s.contact}
                  <div className="text-xs text-muted">{s.country}</div>
                </td>
                <td className="px-4 py-3 text-muted">{s.products}</td>
                <td className="px-4 py-3">
                  <select
                    value={s.currentStage}
                    onChange={(e) => patch(s, { currentStage: Number(e.target.value) }, `${s.company} → Stage ${e.target.value}`)}
                    className="rounded-input border border-border bg-white px-2 py-1.5 font-sans text-xs focus:border-amber focus:outline-none"
                  >
                    {SUPPLIER_STAGES.map((st) => (
                      <option key={st.stage} value={st.stage}>
                        {st.stage}. {st.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={s.status}
                    onChange={(e) => patch(s, { status: e.target.value }, `${s.company}: ${e.target.value}`)}
                    className={`rounded-input border px-2 py-1.5 font-raleway text-xs font-bold focus:outline-none ${
                      s.status === 'ACTIVE'
                        ? 'border-success/40 bg-success/10 text-success'
                        : 'border-danger/40 bg-[#FDEDEC] text-danger'
                    }`}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewModal({
  piq,
  onClose,
  onDone,
}: {
  piq: AdminPIQDetail;
  onClose: () => void;
  onDone: () => void;
}) {
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState<{ fieldId: string; message: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const answered = useMemo(
    () =>
      PIQ_GENERAL_CONFIG.sections
        .map((s) => ({
          title: s.title,
          rows: s.questions
            .map((q) => ({ label: q.label, value: piq.answers[q.id] }))
            .filter((r) => r.value !== undefined && r.value !== null && String(r.value).trim() !== ''),
        }))
        .filter((s) => s.rows.length > 0),
    [piq.answers],
  );

  const approve = async () => {
    setBusy(true);
    try {
      await approveAdminPIQ(piq.id);
      toast(`Approved "${piq.name}"`);
      onDone();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to approve', 'error');
    } finally {
      setBusy(false);
    }
  };

  const requestChanges = async () => {
    if (!summary.trim()) {
      toast('Add a short summary of what needs changing.', 'error');
      return;
    }
    const feedback: Record<string, string> = {};
    for (const n of notes) if (n.fieldId && n.message.trim()) feedback[n.fieldId] = n.message.trim();
    setBusy(true);
    try {
      await requestAdminChanges(piq.id, { summary: summary.trim(), feedback });
      toast(`Sent back to ${piq.company}`);
      onDone();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to send', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 py-10">
      <div className="w-full max-w-3xl rounded-card bg-white shadow-card-hover">
        <header className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">{piq.name}</h2>
            <p className="font-sans text-sm text-muted">
              {piq.company} · {piq.email} · {piq.completion}% complete
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-page">
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="max-h-[45vh] overflow-y-auto px-6 py-4">
          {answered.length === 0 ? (
            <p className="font-sans text-sm text-muted">No answers filled yet.</p>
          ) : (
            answered.map((s) => (
              <div key={s.title} className="mb-5">
                <p className="font-raleway text-xs font-bold uppercase tracking-btn text-amber-dark">{s.title}</p>
                <dl className="mt-2 divide-y divide-border rounded-input border border-border">
                  {s.rows.map((r, i) => (
                    <div key={i} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-3">
                      <dt className="font-raleway text-xs font-semibold text-muted">{r.label}</dt>
                      <dd className="font-sans text-sm text-charcoal sm:col-span-2 break-words">{String(r.value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))
          )}
        </div>

        {/* Review actions */}
        <div className="border-t border-border bg-page px-6 py-4">
          <p className="font-raleway text-sm font-bold text-navy">Request changes (optional)</p>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="Overall summary — e.g. “Almost there, a couple of fields need tightening.”"
            className="mt-2 w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-amber focus:outline-none"
          />
          <div className="mt-3 flex flex-col gap-2">
            {notes.map((n, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={n.fieldId}
                  onChange={(e) => setNotes((arr) => arr.map((x, j) => (j === i ? { ...x, fieldId: e.target.value } : x)))}
                  className="rounded-input border border-border bg-white px-2 py-1.5 font-sans text-xs"
                >
                  <option value="">Select a field…</option>
                  {ALL_FIELDS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <input
                  value={n.message}
                  onChange={(e) => setNotes((arr) => arr.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)))}
                  placeholder="What to fix on this field"
                  className="min-w-[200px] flex-1 rounded-input border border-border bg-white px-2 py-1.5 font-sans text-xs focus:border-amber focus:outline-none"
                />
                <button type="button" onClick={() => setNotes((arr) => arr.filter((_, j) => j !== i))} className="text-muted hover:text-danger">
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNotes((arr) => [...arr, { fieldId: '', message: '' }])}
              className="inline-flex w-fit items-center gap-1.5 font-raleway text-xs font-semibold text-navy hover:text-amber-dark"
            >
              <Plus size={14} aria-hidden /> Add a per-field note
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={requestChanges}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-btn border border-danger/40 bg-white px-5 py-2.5 font-raleway text-sm font-bold tracking-btn text-danger transition-colors hover:bg-[#FDEDEC] disabled:opacity-60"
            >
              <Send size={15} aria-hidden /> Request changes
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-btn bg-success px-5 py-2.5 font-raleway text-sm font-bold tracking-btn text-white transition-colors hover:brightness-110 disabled:opacity-60"
            >
              <CheckCircle2 size={15} aria-hidden /> Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
