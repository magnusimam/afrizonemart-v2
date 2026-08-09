'use client';

import { Printer } from 'lucide-react';

/**
 * Formal, printable Supplier Diagnostic Report — shared by the supplier and
 * admin print pages. "Download PDF" triggers the browser print dialog
 * (Save as PDF). A scoped print stylesheet isolates this document so the
 * surrounding portal/admin chrome never appears in the PDF.
 */

export interface AuditReportData {
  company: string;
  categoryName: string | null;
  categoryCode?: string | null;
  conductedAt: string | null;
  outcome: string | null;
  indicativeScore: number | null;
  counts: Record<string, number> | null;
  summary: string | null;
  recommendations: string | null;
  auditorName?: string | null;
  metadata?: Record<string, string>;
  sections: { title: string; checkpoints: { id: string; label: string; requirement: string; evidence: string }[] }[];
  responses: Record<string, { rating?: string; findings?: string }>;
  capa: { ref?: string; nonConformity?: string; rootCause?: string; action?: string; owner?: string; deadline?: string; status?: string }[];
}

const RATING_META: Record<string, { label: string; cls: string }> = {
  C: { label: 'Critical', cls: 'bg-danger/10 text-danger' },
  M: { label: 'Major', cls: 'bg-[#E8590C]/10 text-[#E8590C]' },
  Mi: { label: 'Minor', cls: 'bg-amber-light text-amber-dark' },
  O: { label: 'Observation', cls: 'bg-navy-light text-navy' },
  Cpt: { label: 'Compliant', cls: 'bg-success/10 text-success' },
  NA: { label: 'N/A', cls: 'bg-page text-muted' },
};

const OUTCOME_META: Record<string, { label: string; cls: string }> = {
  APPROVED: { label: 'Approved for Onboarding', cls: 'border-success/50 text-success' },
  PROVISIONAL: { label: 'Provisional — CAPA Required', cls: 'border-amber/60 text-amber-dark' },
  REJECTED: { label: 'Rejected — Remediation Required', cls: 'border-danger/50 text-danger' },
};

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #audit-report-print, #audit-report-print * { visibility: visible !important; }
  #audit-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .no-print { display: none !important; }
  @page { margin: 16mm; }
}`;

export function AuditReportDocument({ data }: { data: AuditReportData }) {
  const conducted = data.conductedAt
    ? new Date(data.conductedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const om = data.outcome ? OUTCOME_META[data.outcome] : null;
  const c = data.counts ?? {};
  const docCode = `${data.categoryCode ?? 'AFZ-QA'} / DR-${data.company.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark"
        >
          <Printer size={16} aria-hidden /> Download / Print PDF
        </button>
      </div>

      <article id="audit-report-print" className="rounded-card border border-border bg-white p-8 font-sans text-charcoal shadow-card print:shadow-none">
        {/* Cover */}
        <header className="border-b-2 border-navy pb-5">
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-amber-dark">
            Afrizonemart · Standards &amp; Quality Assurance
          </p>
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
            Confidential · Supplier Diagnostic Report
          </p>
          <h1 className="mt-4 font-raleway text-2xl font-extrabold text-navy">
            Product Conformity &amp; Supplier Readiness
          </h1>
          <p className="font-raleway text-lg text-navy">Diagnostic Assessment</p>
          <p className="mt-4 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Prepared for</p>
          <p className="font-raleway text-xl font-bold text-navy">{data.company}</p>
        </header>

        {/* Metadata */}
        <table className="mt-5 w-full border-collapse text-sm">
          <tbody>
            <MetaRow label="Document Code" value={docCode} />
            <MetaRow label="Assessment Protocol" value={data.categoryName ?? '—'} />
            <MetaRow label="Assessment Type" value="Pre-Onboarding Conformity Diagnostic" />
            <MetaRow label="Assessment Date" value={conducted} />
            {data.metadata?.facilityLocation ? <MetaRow label="Facility Location" value={data.metadata.facilityLocation} /> : null}
            {data.metadata?.facilityType ? <MetaRow label="Facility Type" value={data.metadata.facilityType} /> : null}
            {data.metadata?.intendedMarket ? <MetaRow label="Intended Market" value={data.metadata.intendedMarket} /> : null}
            <MetaRow label="Classification" value="Confidential — Restricted Distribution" />
          </tbody>
        </table>

        {/* Outcome + score */}
        {om && (
          <section className="mt-6">
            <h2 className={H2}>Assessment Outcome</h2>
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-card border-2 p-4 ${om.cls}`}>
              <p className="font-raleway text-lg font-extrabold">{om.label}</p>
              {data.indicativeScore != null && (
                <p className="font-raleway text-2xl font-extrabold tabular-nums">{data.indicativeScore}<span className="text-sm font-bold"> / 100</span></p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['C', 'M', 'Mi', 'O', 'Cpt'] as const).map((k) => (
                <span key={k} className={`rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${RATING_META[k].cls}`}>
                  {(c[fullKey(k)] ?? 0)} {RATING_META[k].label}
                </span>
              ))}
            </div>
            <p className="mt-2 font-sans text-xs text-muted">
              Indicative score = 100 − (2 × Major) − (0.5 × Minor). Any single Critical finding triggers an immediate Rejected outcome regardless of score.
            </p>
          </section>
        )}

        {/* Executive summary */}
        {data.summary && (
          <section className="mt-6">
            <h2 className={H2}>Executive Summary</h2>
            <p className="font-sans text-sm leading-relaxed">{data.summary}</p>
          </section>
        )}

        {/* Conformity matrix */}
        <section className="mt-6">
          <h2 className={H2}>Conformity Assessment Matrix</h2>
          <div className="space-y-4">
            {data.sections.map((s) => (
              <div key={s.title} className="break-inside-avoid">
                <p className="font-raleway text-sm font-bold text-navy">{s.title}</p>
                <table className="mt-1 w-full border-collapse text-sm">
                  <tbody>
                    {s.checkpoints.map((cp) => {
                      const r = data.responses[cp.id];
                      const meta = r?.rating ? RATING_META[r.rating] : null;
                      return (
                        <tr key={cp.id} className="border-b border-border align-top">
                          <td className="py-1.5 pr-2 font-bold text-navy">{cp.label}</td>
                          <td className="py-1.5 pr-2">
                            {cp.requirement}
                            {r?.findings ? <span className="block text-xs text-muted">{r.findings}</span> : null}
                          </td>
                          <td className="py-1.5 text-right whitespace-nowrap">
                            {meta ? <span className={`rounded-full px-2 py-0.5 font-raleway text-[11px] font-bold ${meta.cls}`}>{meta.label}</span> : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        {/* CAPA */}
        {data.capa.length > 0 && (
          <section className="mt-6 break-inside-avoid">
            <h2 className={H2}>Corrective &amp; Preventive Actions (CAPA)</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                  <th className="py-1.5 pr-2">Non-Conformity</th>
                  <th className="py-1.5 pr-2">Corrective Action</th>
                  <th className="py-1.5">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {data.capa.map((row, i) => (
                  <tr key={i} className="border-b border-border align-top">
                    <td className="py-1.5 pr-2">{row.nonConformity ?? '—'}</td>
                    <td className="py-1.5 pr-2">{row.action ?? '—'}</td>
                    <td className="py-1.5 whitespace-nowrap">{row.deadline ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Recommendations */}
        {data.recommendations && (
          <section className="mt-6">
            <h2 className={H2}>Recommendations</h2>
            <p className="font-sans text-sm leading-relaxed">{data.recommendations}</p>
          </section>
        )}

        {/* Sign-off */}
        <section className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-5">
          <SignOff label="Lead Auditor" value={data.auditorName ?? ''} sub="Afrizonemart Standards & QA" />
          <SignOff label="Date" value={conducted} sub="" />
        </section>

        <footer className="mt-6 border-t border-border pt-3 text-center font-sans text-[11px] text-muted">
          Confidential Document · Afrizonemart Quality Assurance Department · Not for Public Distribution
        </footer>
      </article>
    </div>
  );
}

const H2 = 'mb-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-amber-dark';

function fullKey(k: string): string {
  return { C: 'critical', M: 'major', Mi: 'minor', O: 'observation', Cpt: 'compliant', NA: 'na' }[k] ?? k;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border">
      <td className="w-1/3 py-1.5 pr-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{label}</td>
      <td className="py-1.5 font-sans text-charcoal">{value}</td>
    </tr>
  );
}

function SignOff({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="h-8 border-b border-charcoal font-raleway text-sm font-bold text-navy">{value}</div>
      <p className="mt-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{label}</p>
      {sub ? <p className="font-sans text-xs text-muted">{sub}</p> : null}
    </div>
  );
}
