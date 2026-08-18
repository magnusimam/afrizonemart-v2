'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  completeFacilityVisit,
  confirmFacilityVisit,
  getFacilityVisits,
  getVisitForm,
  saveVisitForm,
  type AdminVisit,
  type VisitForm,
} from '@/lib/api/admin-suppliers';

const STATUS_TONE: Record<string, string> = {
  REQUESTED: 'bg-amber-light text-amber-dark',
  CONFIRMED: 'bg-success/10 text-success',
  COMPLETED: 'bg-navy-light text-navy',
  CANCELLED: 'bg-page text-muted',
};

export default function AdminFacilityVisitsPage() {
  const [rows, setRows] = useState<AdminVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [confirming, setConfirming] = useState<AdminVisit | null>(null);
  const [formFor, setFormFor] = useState<AdminVisit | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFacilityVisits()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load visits', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const complete = async (v: AdminVisit) => {
    try {
      await completeFacilityVisit(v.id);
      toast(`${v.company}: marked completed`);
      setReload((r) => r + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed', 'error');
    }
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Facility visits"
        subtitle="Confirm dates for supplier site visits and mark them complete."
        action={
          <span className="rounded-full bg-amber-light px-3 py-1 font-raleway text-xs font-bold text-amber-dark">
            {rows.filter((r) => r.status === 'REQUESTED').length} awaiting confirmation
          </span>
        }
      />

      {loading ? (
        <p className="font-sans text-sm text-muted">Loading visits…</p>
      ) : rows.length === 0 ? (
        <p className="font-sans text-sm text-muted">No visit requests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-border bg-page">
              <tr className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Preferred / confirmed</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((v) => (
                <tr key={v.id} className="align-top font-sans text-sm hover:bg-page">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{v.company}</div>
                    <div className="text-xs text-muted">{v.email}{v.contactPhone ? ` · ${v.contactPhone}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-charcoal">
                    {v.status === 'CONFIRMED' || v.status === 'COMPLETED'
                      ? `${v.confirmedDate ? new Date(v.confirmedDate).toLocaleDateString() : ''}${v.confirmedWindow ? ` · ${v.confirmedWindow}` : ''}`
                      : v.preferredDate ?? '—'}
                    {v.leadName && <div className="text-xs text-muted">Lead: {v.leadName}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted">{v.address ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${STATUS_TONE[v.status]}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.status === 'REQUESTED' && (
                      <button
                        type="button"
                        onClick={() => setConfirming(v)}
                        className="rounded-btn bg-navy px-4 py-1.5 font-raleway text-xs font-bold tracking-btn text-white transition-colors hover:bg-navy-dark"
                      >
                        Confirm
                      </button>
                    )}
                    {v.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => complete(v)}
                        className="rounded-btn bg-success px-4 py-1.5 font-raleway text-xs font-bold tracking-btn text-white transition-colors hover:brightness-110"
                      >
                        Mark done
                      </button>
                    )}
                    {/* The on-site form stays reachable after the visit is
                        marked done — teams routinely write it up afterwards. */}
                    {(v.status === 'CONFIRMED' || v.status === 'COMPLETED') && (
                      <button
                        type="button"
                        onClick={() => setFormFor(v)}
                        className="ml-2 rounded-btn border border-navy px-4 py-1.5 font-raleway text-xs font-bold text-navy transition-colors hover:bg-navy-light"
                      >
                        Visit form
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirming && (
        <ConfirmVisitModal
          visit={confirming}
          onClose={() => setConfirming(null)}
          onDone={() => {
            setConfirming(null);
            setReload((r) => r + 1);
          }}
        />
      )}

      {formFor && (
        <VisitFormModal
          visit={formFor}
          onClose={() => setFormFor(null)}
          onDone={(msg) => {
            setFormFor(null);
            toast(msg);
            setReload((r) => r + 1);
          }}
        />
      )}
    </div>
  );
}

function ConfirmVisitModal({ visit, onClose, onDone }: { visit: AdminVisit; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState('');
  const [window, setWindow] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!date || !leadName.trim()) {
      toast('Date and team lead are required.', 'error');
      return;
    }
    setBusy(true);
    try {
      await confirmFacilityVisit(visit.id, {
        confirmedDate: date,
        confirmedWindow: window || undefined,
        leadName: leadName.trim(),
        leadPhone: leadPhone || undefined,
        notes: notes || undefined,
      });
      toast(`Visit confirmed for ${visit.company}`);
      onDone();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to confirm', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 py-10">
      <div className="w-full max-w-lg rounded-card bg-white shadow-card-hover">
        <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">Confirm visit</h2>
            <p className="font-sans text-sm text-muted">{visit.company} · proposed {visit.preferredDate}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-page">
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2">
          <Field label="Confirmed date *"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
          <Field label="Window"><input type="text" value={window} onChange={(e) => setWindow(e.target.value)} placeholder="e.g. Morning 9–12" className={inputCls} /></Field>
          <Field label="Team lead *"><input type="text" value={leadName} onChange={(e) => setLeadName(e.target.value)} className={inputCls} /></Field>
          <Field label="Lead phone"><input type="text" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} className={inputCls} /></Field>
          <div className="sm:col-span-2">
            <Field label="Notes (sent to supplier)"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-btn border border-border px-4 py-2 font-raleway text-sm font-bold text-muted hover:border-navy hover:text-navy">Cancel</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-60">
            <CheckCircle2 size={15} aria-hidden /> Confirm visit
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-amber focus:outline-none';

/**
 * The on-site visit form.
 *
 * Questions are chosen by the supplier's PRODUCT CATEGORY — a cassava mill and
 * a cosmetics line get different checks, drawn from the same category templates
 * the auditor will later score against. Submitting seeds the product audit, so
 * the auditor starts from what the visiting team actually saw rather than a
 * blank record.
 */
function VisitFormModal({
  visit, onClose, onDone,
}: { visit: AdminVisit; onClose: () => void; onDone: (msg: string) => void }) {
  const [form, setForm] = useState<VisitForm | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'submit' | null>(null);

  useEffect(() => {
    getVisitForm(visit.id)
      .then(setForm)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load the form'));
  }, [visit.id]);

  const save = async (submit: boolean) => {
    if (!form) return;
    setBusy(submit ? 'submit' : 'save');
    setErr(null);
    try {
      await saveVisitForm(visit.id, {
        formCategory: form.category ?? undefined,
        docsSighted: form.docsSighted,
        observations: form.observations,
        visitSummary: form.visitSummary,
        submit,
      });
      onDone(submit
        ? `Visit form submitted — the audit for ${form.company} is seeded and ready`
        : `Draft saved for ${form.company}`);
    } catch (e) {
      setErr(e instanceof HttpApiError ? e.message : 'Failed to save');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 py-8">
      <div className="w-full max-w-2xl rounded-card bg-white shadow-card-hover">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-card border-b border-border bg-white px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">On-site visit form</h2>
            <p className="font-sans text-xs text-muted">
              {visit.company}
              {form?.categoryName ? ` · ${form.category} — ${form.categoryName}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-navy">
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-5 px-6 py-5">
          {err && (
            <p role="alert" className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">{err}</p>
          )}
          {!form ? (
            <p className="font-sans text-sm text-muted">Loading the form…</p>
          ) : (
            <>
              {form.formSubmittedAt && (
                <p className="rounded-input border border-success/30 bg-success/5 px-3 py-2 font-sans text-sm text-success">
                  Submitted {new Date(form.formSubmittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  Resubmitting will not overwrite audit scoring already in progress.
                </p>
              )}

              {!form.category && (
                <p className="rounded-input border border-amber/50 bg-amber-light/40 px-3 py-2 font-sans text-sm text-amber-dark">
                  No product category is recorded for this supplier, so there are
                  no category-specific checks to show. Pick one below.
                </p>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                  Product category (selects the checks)
                </span>
                <select
                  value={form.category ?? ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value || null })}
                  className={inputCls}
                >
                  <option value="">— none —</option>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <section>
                <h3 className="font-raleway text-sm font-bold text-navy">Documents sighted</h3>
                {form.preVisitDocs.length === 0 ? (
                  <p className="mt-1 font-sans text-xs text-muted">
                    No document checklist is defined for this category yet.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {form.preVisitDocs.map((doc) => (
                      <label key={doc} className="flex items-start gap-2 font-sans text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(form.docsSighted[doc])}
                          onChange={(e) => setForm({
                            ...form,
                            docsSighted: { ...form.docsSighted, [doc]: e.target.checked },
                          })}
                          className="mt-1"
                        />
                        <span>{doc}</span>
                      </label>
                    ))}
                  </div>
                )}
              </section>

              {form.categoryChecks.map((group, gi) => (
                <section key={`${group.title}-${gi}`}>
                  {group.title ? (
                    <h3 className="font-raleway text-sm font-bold text-navy">{group.title}</h3>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-3">
                    {group.items.map((item, ii) => {
                      const key = `g${gi}_i${ii}`;
                      const obs = form.observations[key] ?? {};
                      return (
                        <div key={key} className="rounded-input border border-border p-3">
                          <label className="flex items-start gap-2 font-sans text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(obs.seen)}
                              onChange={(e) => setForm({
                                ...form,
                                observations: { ...form.observations, [key]: { ...obs, seen: e.target.checked } },
                              })}
                              className="mt-1"
                            />
                            <span>{item}</span>
                          </label>
                          <input
                            type="text"
                            value={obs.note ?? ''}
                            onChange={(e) => setForm({
                              ...form,
                              observations: { ...form.observations, [key]: { ...obs, note: e.target.value } },
                            })}
                            placeholder="What did you observe?"
                            className={`${inputCls} mt-2`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}

              <label className="flex flex-col gap-1.5">
                <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                  Visit summary (the auditor reads this first)
                </span>
                <textarea
                  rows={4}
                  value={form.visitSummary}
                  onChange={(e) => setForm({ ...form, visitSummary: e.target.value })}
                  className={inputCls}
                />
              </label>
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-card border-t border-border bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-btn border border-border px-4 py-2 font-raleway text-sm font-bold text-muted hover:border-navy hover:text-navy">
            Close
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={!form || busy !== null}
            className="rounded-btn border border-navy px-4 py-2 font-raleway text-sm font-bold text-navy hover:bg-navy-light disabled:opacity-60"
          >
            {busy === 'save' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={!form || busy !== null}
            className="rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-60"
          >
            {busy === 'submit' ? 'Submitting…' : 'Submit & seed audit'}
          </button>
        </div>
      </div>
    </div>
  );
}
