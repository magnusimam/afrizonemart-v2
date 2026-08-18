'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, Download, Printer } from 'lucide-react';
import { getSupplierAudit } from '@/lib/api/supplier';

/**
 * Stage 6 — the supplier's view of their completed Product-Commodity Audit:
 * the diagnostic report (outcome, indicative score, finding counts, executive
 * summary, full conformity matrix, recommendations, CAPA). Renders nothing
 * until the Quality & Compliance team completes the audit.
 */

const RATING_META: Record<string, { label: string; cls: string }> = {
  C: { label: 'Critical', cls: 'bg-danger/10 text-danger' },
  M: { label: 'Major', cls: 'bg-[#E8590C]/10 text-[#E8590C]' },
  Mi: { label: 'Minor', cls: 'bg-amber-light text-amber-dark' },
  O: { label: 'Observation', cls: 'bg-navy-light text-navy' },
  Cpt: { label: 'Compliant', cls: 'bg-success/10 text-success' },
  NA: { label: 'N/A', cls: 'bg-page text-muted' },
};

const OUTCOME_META: Record<string, { label: string; cls: string; blurb: string }> = {
  APPROVED: { label: 'Approved', cls: 'border-success/40 bg-[#EAFAF1] text-success', blurb: 'Your facility and products meet the onboarding standard.' },
  PROVISIONAL: { label: 'Provisional', cls: 'border-amber/40 bg-amber-light text-amber-dark', blurb: 'You can proceed once the corrective actions below are addressed.' },
  REJECTED: { label: 'Remediation required', cls: 'border-danger/40 bg-danger/10 text-danger', blurb: 'Listing is blocked until the critical findings below are resolved and re-audited.' },
};

export function AuditReportCard() {
  const { data: audit, isLoading } = useQuery({
    queryKey: ['supplier', 'audit'],
    queryFn: getSupplierAudit,
    retry: false,
  });

  if (isLoading || !audit) return null;

  const conducted = audit.conductedAt
    ? new Date(audit.conductedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const om = audit.outcome ? OUTCOME_META[audit.outcome] : null;
  const c = audit.counts ?? {};

  return (
    <section className="mt-6 overflow-hidden rounded-card border border-border bg-white shadow-card">
      <header className="flex items-center gap-3 border-b border-border p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
          <ClipboardCheck size={20} aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="font-raleway text-lg font-bold text-navy">Your product audit report</h2>
          <p className="mt-0.5 font-sans text-sm text-muted">
            {audit.categoryName ?? 'Product-Commodity Audit'}{conducted ? ` · ${conducted}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* This opens the print view rather than a file, so it says so. It
              used to read "Download PDF", which promised a download the link
              did not perform. */}
          <Link
            href="/supplier/audit-report"
            className="inline-flex items-center gap-2 rounded-btn border border-navy px-4 py-2 font-raleway text-xs font-bold tracking-btn text-navy hover:bg-navy-light"
          >
            <Printer size={14} aria-hidden /> View report
          </Link>

          {audit.reportFileUrl && (
            <a
              href={audit.reportFileUrl}
              download={audit.reportFileName ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold tracking-btn text-white hover:bg-navy-dark"
            >
              <Download size={14} aria-hidden /> Signed report
            </a>
          )}
        </div>
      </header>

      {/* Outcome + score */}
      {om && (
        <div className={`m-6 rounded-card border p-5 ${om.cls}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-raleway text-lg font-extrabold">{om.label}</p>
              <p className="mt-0.5 font-sans text-sm">{om.blurb}</p>
            </div>
            {audit.indicativeScore != null && (
              <div className="text-right">
                <p className="font-raleway text-3xl font-extrabold tabular-nums">{audit.indicativeScore}<span className="text-base font-bold">/100</span></p>
                <p className="font-raleway text-[11px] font-bold uppercase tracking-btn">Indicative score</p>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {([['C', c.critical], ['M', c.major], ['Mi', c.minor], ['O', c.observation], ['Cpt', c.compliant]] as const).map(([k, n]) => (
              <span key={k} className={`rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${RATING_META[k].cls}`}>
                {n ?? 0} {RATING_META[k].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Executive summary */}
      {audit.summary && (
        <div className="px-6 pb-2">
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Executive summary</p>
          <p className="mt-1 font-sans text-sm leading-relaxed text-charcoal">{audit.summary}</p>
        </div>
      )}

      {/* Conformity matrix */}
      {audit.template && (
        <div className="px-6 py-4">
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Conformity matrix</p>
          <div className="mt-2 space-y-4">
            {audit.template.sections.map((s) => (
              <div key={s.title} className="rounded-card border border-border">
                <p className="border-b border-border bg-page px-4 py-2 font-raleway text-sm font-bold text-navy">{s.title}</p>
                <div className="divide-y divide-border">
                  {s.checkpoints.map((cp) => {
                    const r = audit.responses[cp.id];
                    const meta = r?.rating ? RATING_META[r.rating] : null;
                    return (
                      <div key={cp.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5">
                        <div className="min-w-[200px] flex-1">
                          <p className="font-sans text-sm text-charcoal"><span className="font-bold text-navy">{cp.label}</span> {cp.requirement}</p>
                          {r?.findings && <p className="mt-0.5 font-sans text-xs text-muted">{r.findings}</p>}
                        </div>
                        {meta && <span className={`rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${meta.cls}`}>{meta.label}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAPA */}
      {audit.capa.length > 0 && (
        <div className="px-6 py-4">
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Corrective actions (CAPA)</p>
          <div className="mt-2 space-y-2">
            {audit.capa.map((row, i) => (
              <div key={i} className="rounded-input border border-border p-3 font-sans text-sm">
                {row.nonConformity && <p className="font-semibold text-navy">{row.nonConformity}</p>}
                {row.action && <p className="text-charcoal">Action: {row.action}</p>}
                {row.deadline && <p className="text-xs text-muted">Due: {row.deadline}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {audit.recommendations && (
        <div className="border-t border-border bg-page px-6 py-4">
          <p className="flex items-center gap-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
            <CheckCircle2 size={13} aria-hidden className="text-success" /> Recommendations
          </p>
          <p className="mt-1 font-sans text-sm leading-relaxed text-charcoal">{audit.recommendations}</p>
        </div>
      )}
    </section>
  );
}
