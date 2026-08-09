'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Loader2, Plus, Printer, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  completeAdminAudit,
  getAdminAudit,
  getAuditQueue,
  getAuditTemplate,
  saveAdminAudit,
  type AdminAuditDetail,
  type AuditCounts,
  type AuditFormPayload,
  type AuditQueueRow,
  type AuditRating,
  type AuditTemplate,
  type CapaRow,
} from '@/lib/api/admin-suppliers';

const CATEGORIES = [
  { code: 'A', name: 'Flours, Swallows & Powdered Staples' },
  { code: 'B', name: 'Edible Oils, Botanicals & Infusions' },
  { code: 'C', name: 'Snacks, Nuts & Ready-to-Eat' },
  { code: 'D', name: 'Cosmetics, Personal Care & Wellness' },
  { code: 'E', name: 'Fashion, Footwear & Crafted Lifestyle' },
  { code: 'F', name: 'Fish, Meat, Eggs & High-Risk Animal' },
];

const RATINGS: { value: AuditRating; label: string; active: string }[] = [
  { value: 'C', label: 'Critical', active: 'border-danger bg-danger text-white' },
  { value: 'M', label: 'Major', active: 'border-[#E8590C] bg-[#E8590C] text-white' },
  { value: 'Mi', label: 'Minor', active: 'border-amber-dark bg-amber-dark text-white' },
  { value: 'O', label: 'Obs', active: 'border-navy bg-navy text-white' },
  { value: 'Cpt', label: 'Compliant', active: 'border-success bg-success text-white' },
  { value: 'NA', label: 'N/A', active: 'border-muted bg-muted text-white' },
];

const OUTCOME_TONE: Record<string, string> = {
  APPROVED: 'bg-success/10 text-success',
  PROVISIONAL: 'bg-amber-light text-amber-dark',
  REJECTED: 'bg-danger/10 text-danger',
};

const META_FIELDS = [
  { key: 'facilityLocation', label: 'Facility location' },
  { key: 'facilityType', label: 'Facility type' },
  { key: 'intendedMarket', label: 'Intended market' },
  { key: 'productsCovered', label: 'Products covered' },
];

/** Client mirror of the server scoring (live preview only). */
function computeScore(responses: Record<string, { rating?: AuditRating }>): { counts: AuditCounts; score: number; outcome: string } {
  const counts: AuditCounts = { critical: 0, major: 0, minor: 0, observation: 0, compliant: 0, na: 0 };
  for (const r of Object.values(responses)) {
    if (r.rating === 'C') counts.critical++;
    else if (r.rating === 'M') counts.major++;
    else if (r.rating === 'Mi') counts.minor++;
    else if (r.rating === 'O') counts.observation++;
    else if (r.rating === 'Cpt') counts.compliant++;
    else if (r.rating === 'NA') counts.na++;
  }
  const score = Math.max(0, Math.min(100, Math.round(100 - 2 * counts.major - 0.5 * counts.minor)));
  const outcome = counts.critical > 0 ? 'REJECTED' : score >= 85 && counts.major <= 3 ? 'APPROVED' : score >= 70 ? 'PROVISIONAL' : 'REJECTED';
  return { counts, score, outcome };
}

export default function AdminSupplierAuditsPage() {
  const [rows, setRows] = useState<AuditQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<AuditQueueRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAuditQueue()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load audits', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reload]);

  return (
    <div>
      <AdminPageHeader
        title="Product audits"
        subtitle="Quality & Compliance — conduct the category Product-Commodity Audit and issue the diagnostic report."
        action={
          <span className="rounded-full bg-amber-light px-3 py-1 font-raleway text-xs font-bold text-amber-dark">
            {rows.filter((r) => r.auditStatus !== 'COMPLETED').length} pending
          </span>
        }
      />
      {loading ? (
        <p className="font-sans text-sm text-muted">Loading audit queue…</p>
      ) : rows.length === 0 ? (
        <p className="font-sans text-sm text-muted">No suppliers have reached the audit stage yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-border bg-page">
              <tr className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.supplierId} className="align-top font-sans text-sm hover:bg-page">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{r.company}</div>
                    <div className="text-xs text-muted">{r.email}{r.country ? ` · ${r.country}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-charcoal">{r.auditCategory ? `Template ${r.auditCategory}` : '—'}</td>
                  <td className="px-4 py-3">
                    {r.auditStatus ? (
                      <span className={`rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${r.auditStatus === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-amber-light text-amber-dark'}`}>{r.auditStatus}</span>
                    ) : <span className="text-xs text-muted">Not started</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.outcome ? (
                      <span className={`rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${OUTCOME_TONE[r.outcome]}`}>{r.outcome}{r.indicativeScore != null ? ` · ${r.indicativeScore}` : ''}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setEditing(r)} className="rounded-btn bg-navy px-4 py-1.5 font-raleway text-xs font-bold tracking-btn text-white hover:bg-navy-dark">
                      {r.auditStatus === 'COMPLETED' ? 'View' : r.auditStatus === 'DRAFT' ? 'Continue' : 'Conduct'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <AuditEditor
          supplierId={editing.supplierId}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); setReload((n) => n + 1); }}
        />
      )}
    </div>
  );
}

function AuditEditor({ supplierId, onClose, onDone }: { supplierId: string; onClose: () => void; onDone: () => void }) {
  const [detail, setDetail] = useState<AdminAuditDetail | null>(null);
  const [category, setCategory] = useState('');
  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [tplLoading, setTplLoading] = useState(false);
  const [meta, setMeta] = useState<Record<string, string>>({});
  const [preVisit, setPreVisit] = useState<Record<string, boolean>>({});
  const [responses, setResponses] = useState<Record<string, { rating?: AuditRating; findings?: string }>>({});
  const [capa, setCapa] = useState<CapaRow[]>([]);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [auditorName, setAuditorName] = useState('');
  const [busy, setBusy] = useState<'save' | 'complete' | null>(null);

  const readOnly = detail?.audit.status === 'COMPLETED';

  useEffect(() => {
    let cancelled = false;
    getAdminAudit(supplierId).then((d) => {
      if (cancelled) return;
      setDetail(d);
      const a = d.audit;
      setMeta(a.metadata ?? {});
      setPreVisit(a.preVisitDocs ?? {});
      setResponses(a.responses ?? {});
      setCapa(a.capa ?? []);
      setSummary(a.summary ?? '');
      setRecommendations(a.recommendations ?? '');
      setAuditorName(a.auditorName ?? '');
      if (a.category) setCategory(a.category);
    }).catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
    return () => { cancelled = true; };
  }, [supplierId]);

  useEffect(() => {
    if (!category) { setTemplate(null); return; }
    setTplLoading(true);
    getAuditTemplate(category)
      .then(setTemplate)
      .catch(() => toast('Failed to load template', 'error'))
      .finally(() => setTplLoading(false));
  }, [category]);

  const live = useMemo(() => computeScore(responses), [responses]);
  const totalCheckpoints = template?.sections.reduce((n, s) => n + s.checkpoints.length, 0) ?? 0;
  const ratedCount = template
    ? template.sections.flatMap((s) => s.checkpoints).filter((c) => responses[c.id]?.rating).length
    : 0;

  const setRating = (id: string, rating: AuditRating) =>
    setResponses((r) => ({ ...r, [id]: { ...r[id], rating } }));
  const setFindings = (id: string, findings: string) =>
    setResponses((r) => ({ ...r, [id]: { ...r[id], findings } }));

  const payload = (): AuditFormPayload => ({ category, metadata: meta, preVisitDocs: preVisit, responses, capa, summary: summary || undefined, recommendations: recommendations || undefined, auditorName: auditorName || undefined });

  const save = async () => {
    setBusy('save');
    try { await saveAdminAudit(supplierId, payload()); toast('Draft saved'); onDone(); }
    catch (e) { toast(e instanceof HttpApiError ? e.message : 'Failed', 'error'); }
    finally { setBusy(null); }
  };

  const complete = async () => {
    if (!category) return toast('Pick a category template first.', 'error');
    if (ratedCount < totalCheckpoints) return toast(`Rate all checkpoints — ${totalCheckpoints - ratedCount} left.`, 'error');
    if (!summary.trim()) return toast('Write an executive summary.', 'error');
    if (!auditorName.trim()) return toast('Enter the auditor name.', 'error');
    setBusy('complete');
    try { await completeAdminAudit(supplierId, payload()); toast(`Audit completed — ${detail?.company ?? 'supplier'} notified`); onDone(); }
    catch (e) { toast(e instanceof HttpApiError ? e.message : 'Failed', 'error'); }
    finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 py-8">
      <div className="w-full max-w-3xl rounded-card bg-white shadow-card-hover">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-card border-b border-border bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck size={20} aria-hidden className="text-navy" />
            <div>
              <h2 className="font-raleway text-lg font-bold text-navy">{detail ? `Audit — ${detail.company}` : 'Audit'}</h2>
              <p className="font-sans text-sm text-muted">
                {readOnly ? 'Completed audit (read-only)' : template ? `${ratedCount}/${totalCheckpoints} checkpoints rated` : 'Pick a category template to begin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {readOnly && detail?.audit.outcome ? (
              <span className={`rounded-full px-3 py-1 font-raleway text-xs font-bold ${OUTCOME_TONE[detail.audit.outcome]}`}>
                {detail.audit.indicativeScore}/100 · {detail.audit.outcome}
              </span>
            ) : category ? (
              <span className={`rounded-full px-3 py-1 font-raleway text-xs font-bold ${OUTCOME_TONE[live.outcome]}`}>
                {live.score}/100 · {live.outcome}
              </span>
            ) : null}
            {readOnly && (
              <Link
                href={`/admin/supplier-audits/${supplierId}/report`}
                className="inline-flex items-center gap-1.5 rounded-btn border border-navy px-3 py-1.5 font-raleway text-xs font-bold tracking-btn text-navy hover:bg-navy-light"
              >
                <Printer size={14} aria-hidden /> Print report
              </Link>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-page"><X size={18} aria-hidden /></button>
          </div>
        </header>

        {!detail ? (
          <div className="px-6 py-10 text-center font-sans text-sm text-muted">Loading…</div>
        ) : (
          <div className="space-y-6 px-6 py-5">
            {/* Category */}
            <div>
              <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Category template</p>
              <select
                value={category}
                disabled={readOnly}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls + ' mt-1.5 disabled:bg-page'}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>

            {tplLoading && <p className="font-sans text-sm text-muted">Loading template…</p>}

            {template && (
              <>
                {/* Scope metadata */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {META_FIELDS.map((f) => (
                    <Field key={f.key} label={f.label}>
                      <input type="text" disabled={readOnly} value={meta[f.key] ?? ''} onChange={(e) => setMeta((m) => ({ ...m, [f.key]: e.target.value }))} className={inputCls + ' disabled:bg-page'} />
                    </Field>
                  ))}
                </div>

                {/* Pre-visit document checklist */}
                {template.preVisitDocs.length > 0 && (
                  <div className="rounded-card border border-border p-4">
                    <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Pre-visit documents received</p>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {template.preVisitDocs.map((doc, i) => (
                        <label key={i} className="flex items-start gap-2 font-sans text-sm text-charcoal">
                          <input type="checkbox" disabled={readOnly} checked={!!preVisit[doc]} onChange={(e) => setPreVisit((p) => ({ ...p, [doc]: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-navy" />
                          {doc}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conformity matrix */}
                {template.sections.map((s) => (
                  <div key={s.title} className="rounded-card border border-border">
                    <p className="border-b border-border bg-page px-4 py-2.5 font-raleway text-sm font-bold text-navy">{s.title}</p>
                    <div className="divide-y divide-border">
                      {s.checkpoints.map((c) => (
                        <div key={c.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-[200px] flex-1">
                              <p className="font-sans text-sm text-charcoal"><span className="font-bold text-navy">{c.label}</span> {c.requirement}</p>
                              {c.evidence && <p className="mt-0.5 font-sans text-xs text-muted">Evidence: {c.evidence}</p>}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {RATINGS.map((rt) => {
                                const on = responses[c.id]?.rating === rt.value;
                                return (
                                  <button key={rt.value} type="button" disabled={readOnly} onClick={() => setRating(c.id, rt.value)}
                                    className={`rounded-btn border px-2 py-1 font-raleway text-[11px] font-bold tracking-btn transition-colors disabled:cursor-default ${on ? rt.active : 'border-border text-muted hover:border-navy hover:text-navy'}`}>
                                    {rt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <input type="text" disabled={readOnly} value={responses[c.id]?.findings ?? ''} onChange={(e) => setFindings(c.id, e.target.value)} placeholder="Findings / notes" className={inputCls + ' mt-2 disabled:bg-page'} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* CAPA tracker */}
                <div className="rounded-card border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">CAPA — corrective & preventive actions</p>
                    {!readOnly && (
                      <button type="button" onClick={() => setCapa((c) => [...c, {}])} className="inline-flex items-center gap-1 font-raleway text-xs font-bold text-navy hover:text-amber-dark">
                        <Plus size={13} aria-hidden /> Add
                      </button>
                    )}
                  </div>
                  {capa.length === 0 ? (
                    <p className="mt-2 font-sans text-xs text-muted">No corrective actions logged.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {capa.map((row, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 rounded-input bg-page p-2 sm:grid-cols-12">
                          <input disabled={readOnly} value={row.nonConformity ?? ''} onChange={(e) => setCapa((c) => c.map((x, j) => j === i ? { ...x, nonConformity: e.target.value } : x))} placeholder="Non-conformity" className={inputCls + ' sm:col-span-4 disabled:bg-white'} />
                          <input disabled={readOnly} value={row.action ?? ''} onChange={(e) => setCapa((c) => c.map((x, j) => j === i ? { ...x, action: e.target.value } : x))} placeholder="Corrective action" className={inputCls + ' sm:col-span-4 disabled:bg-white'} />
                          <input disabled={readOnly} value={row.deadline ?? ''} onChange={(e) => setCapa((c) => c.map((x, j) => j === i ? { ...x, deadline: e.target.value } : x))} placeholder="Deadline" className={inputCls + ' sm:col-span-3 disabled:bg-white'} />
                          {!readOnly && (
                            <button type="button" onClick={() => setCapa((c) => c.filter((_, j) => j !== i))} aria-label="Remove" className="flex items-center justify-center text-muted hover:text-danger sm:col-span-1"><Trash2 size={15} aria-hidden /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Narrative */}
                <Field label="Executive summary (in the report)">
                  <textarea rows={3} disabled={readOnly} value={summary} onChange={(e) => setSummary(e.target.value)} className={inputCls + ' disabled:bg-page'} />
                </Field>
                <Field label="Recommendations">
                  <textarea rows={2} disabled={readOnly} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} className={inputCls + ' disabled:bg-page'} />
                </Field>
                <Field label="Auditor name">
                  <input type="text" disabled={readOnly} value={auditorName} onChange={(e) => setAuditorName(e.target.value)} className={inputCls + ' disabled:bg-page'} />
                </Field>
              </>
            )}
          </div>
        )}

        {!readOnly && detail && (
          <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-card border-t border-border bg-white px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-btn border border-border px-4 py-2 font-raleway text-sm font-bold text-muted hover:border-navy hover:text-navy">Cancel</button>
            <button type="button" onClick={save} disabled={busy !== null || !category} className="rounded-btn border border-navy px-4 py-2 font-raleway text-sm font-bold text-navy hover:bg-navy-light disabled:opacity-60">{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
            <button type="button" onClick={complete} disabled={busy !== null || !category} className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-60">
              {busy === 'complete' ? <Loader2 size={15} aria-hidden className="animate-spin" /> : <CheckCircle2 size={15} aria-hidden />} Complete & issue report
            </button>
          </div>
        )}
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
