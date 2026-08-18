'use client';

import Image from 'next/image';
import { Printer } from 'lucide-react';

/**
 * Formal, printable Supplier Diagnostic Report — shared by the supplier and
 * admin print pages. "Download PDF" triggers the browser print dialog
 * (Save as PDF). A scoped print stylesheet isolates this document so the
 * surrounding portal/admin chrome never appears in the PDF.
 *
 * 2026-08-15 redesign: AZM logo on the masthead, a real spacing scale (the
 * whole document previously sat on a single `mt-6` rhythm with 1.5-unit table
 * rows, which read as cramped at A4), a visual score meter, and print rules
 * that keep sections and table rows off page seams and repeat table headers
 * across pages.
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
  /**
   * Sign-off, set by the lead-auditor approval gate. `signedBy` is the typed
   * legal name; `approvedAt` is when they released the report. Optional so the
   * component still renders a draft that hasn't been signed yet — that state
   * is shown explicitly rather than left looking approved.
   */
  signedBy?: string | null;
  approvedAt?: string | null;
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

const OUTCOME_META: Record<string, { label: string; cls: string; bar: string }> = {
  APPROVED: { label: 'Approved for Onboarding', cls: 'border-success/50 text-success', bar: 'bg-success' },
  PROVISIONAL: { label: 'Provisional — CAPA Required', cls: 'border-amber/60 text-amber-dark', bar: 'bg-amber' },
  REJECTED: { label: 'Rejected — Remediation Required', cls: 'border-danger/50 text-danger', bar: 'bg-danger' },
};

/**
 * `break-inside: avoid` on sections and rows stops a heading stranding at the
 * foot of a page; `display: table-header-group` repeats the CAPA/matrix headers
 * on every page they span. `print-color-adjust` keeps the rating pills and the
 * score meter from printing as white-on-white.
 */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #audit-report-print, #audit-report-print * { visibility: visible !important; }
  #audit-report-print {
    position: absolute; left: 0; top: 0; width: 100%;
    padding: 0 !important; border: 0 !important; box-shadow: none !important;
  }
  .no-print { display: none !important; }
  #audit-report-print section,
  #audit-report-print tr,
  #audit-report-print .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  #audit-report-print thead { display: table-header-group; }
  #audit-report-print h2 { break-after: avoid; page-break-after: avoid; }
  #audit-report-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 16mm; }
}`;

export function AuditReportDocument({ data }: { data: AuditReportData }) {
  const conducted = data.conductedAt
    ? new Date(data.conductedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const approved = data.approvedAt
    ? new Date(data.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const om = data.outcome ? OUTCOME_META[data.outcome] : null;
  const c = data.counts ?? {};
  const docCode = `${data.categoryCode ?? 'AFZ-QA'} / DR-${data.company.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12)}`;
  const signature = data.signedBy ?? data.auditorName ?? '';

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

      <article
        id="audit-report-print"
        className="rounded-card border border-border bg-white p-10 font-sans text-charcoal shadow-card print:shadow-none"
      >
        {/* Masthead — logo left, classification right */}
        <header className="border-b-2 border-navy pb-7">
          <div className="flex items-start justify-between gap-6">
            <Image
              src="/images/logo.png"
              alt="Afrizonemart"
              width={260}
              height={80}
              className="h-10 w-auto"
              priority
            />
            <div className="text-right">
              <p className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber-dark">
                Standards &amp; Quality Assurance
              </p>
              <p className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                Confidential
              </p>
            </div>
          </div>

          <h1 className="mt-8 font-raleway text-[26px] font-extrabold leading-tight text-navy">
            Product Conformity &amp; Supplier Readiness
          </h1>
          <p className="mt-1 font-raleway text-lg text-navy/70">Diagnostic Assessment</p>

          <p className="mt-7 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
            Prepared for
          </p>
          <p className="mt-1 font-raleway text-xl font-bold text-navy">{data.company}</p>
        </header>

        {/* Metadata */}
        <section className="mt-9">
          <table className="w-full border-collapse text-sm">
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
        </section>

        {/* Outcome + score */}
        {om && (
          <section className="mt-10 avoid-break">
            <h2 className={H2}>Assessment Outcome</h2>
            <div className={`rounded-card border-2 p-5 ${om.cls}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-raleway text-lg font-extrabold">{om.label}</p>
                {data.indicativeScore != null && (
                  <p className="font-raleway text-3xl font-extrabold tabular-nums">
                    {data.indicativeScore}
                    <span className="text-sm font-bold text-muted"> / 100</span>
                  </p>
                )}
              </div>

              {/* Score meter — the number alone doesn't convey how close to a
                  threshold a supplier landed. */}
              {data.indicativeScore != null && (
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-page">
                  <div
                    className={`h-full rounded-full ${om.bar}`}
                    style={{ width: `${Math.max(0, Math.min(100, data.indicativeScore))}%` }}
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(['C', 'M', 'Mi', 'O', 'Cpt'] as const).map((k) => (
                <span key={k} className={`rounded-full px-3 py-1 font-raleway text-xs font-bold ${RATING_META[k].cls}`}>
                  {(c[fullKey(k)] ?? 0)} {RATING_META[k].label}
                </span>
              ))}
            </div>

            <p className="mt-3 font-sans text-xs leading-relaxed text-muted">
              Indicative score = 100 − (2 × Major) − (0.5 × Minor). Any single Critical finding
              triggers an immediate Rejected outcome regardless of score.
            </p>
          </section>
        )}

        {/* Executive summary */}
        {data.summary && (
          <section className="mt-10">
            <h2 className={H2}>Executive Summary</h2>
            <p className="whitespace-pre-line font-sans text-sm leading-7">{data.summary}</p>
          </section>
        )}

        {/* Conformity matrix */}
        <section className="mt-10">
          <h2 className={H2}>Conformity Assessment Matrix</h2>
          <div className="flex flex-col gap-7">
            {data.sections.map((s) => (
              <div key={s.title} className="avoid-break">
                <p className="mb-2 font-raleway text-sm font-bold text-navy">{s.title}</p>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {s.checkpoints.map((cp) => {
                      const r = data.responses[cp.id];
                      const meta = r?.rating ? RATING_META[r.rating] : null;
                      return (
                        <tr key={cp.id} className="border-b border-border align-top">
                          <td className="w-[22%] py-3 pr-3 font-bold text-navy">{cp.label}</td>
                          <td className="py-3 pr-3 leading-6">
                            {cp.requirement}
                            {r?.findings ? (
                              <span className="mt-1 block text-xs leading-5 text-muted">{r.findings}</span>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap py-3 text-right">
                            {meta ? (
                              <span className={`rounded-full px-2.5 py-1 font-raleway text-[11px] font-bold ${meta.cls}`}>
                                {meta.label}
                              </span>
                            ) : '—'}
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
          <section className="mt-10">
            <h2 className={H2}>Corrective &amp; Preventive Actions (CAPA)</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                  <th className="py-2.5 pr-3">Non-Conformity</th>
                  <th className="py-2.5 pr-3">Corrective Action</th>
                  <th className="py-2.5">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {data.capa.map((row, i) => (
                  <tr key={i} className="border-b border-border align-top">
                    <td className="py-3 pr-3 leading-6">{row.nonConformity ?? '—'}</td>
                    <td className="py-3 pr-3 leading-6">{row.action ?? '—'}</td>
                    <td className="whitespace-nowrap py-3">{row.deadline ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Recommendations */}
        {data.recommendations && (
          <section className="mt-10">
            <h2 className={H2}>Recommendations</h2>
            <p className="whitespace-pre-line font-sans text-sm leading-7">{data.recommendations}</p>
          </section>
        )}

        {/* Sign-off */}
        <section className="mt-12 avoid-break border-t-2 border-border pt-7">
          <h2 className={H2}>Authorisation</h2>
          {signature ? (
            <div className="grid grid-cols-2 gap-8">
              <SignOff label="Lead Auditor" value={signature} sub="Afrizonemart Standards &amp; QA" />
              <SignOff label="Date of Authorisation" value={approved ?? conducted} sub="" />
            </div>
          ) : (
            /* An unsigned report must never look like a signed one. */
            <p className="rounded-card border border-amber/60 bg-amber-light/40 px-4 py-3 font-sans text-sm text-amber-dark">
              <strong>Draft — not yet authorised.</strong> This report has not been signed off by a
              lead auditor and must not be treated as a final assessment.
            </p>
          )}
        </section>

        <footer className="mt-9 border-t border-border pt-4 text-center font-sans text-[11px] leading-5 text-muted">
          Confidential Document · Afrizonemart Quality Assurance Department · Not for Public Distribution
        </footer>
      </article>
    </div>
  );
}

const H2 = 'mb-3 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber-dark';

function fullKey(k: string): string {
  return { C: 'critical', M: 'major', Mi: 'minor', O: 'observation', Cpt: 'compliant', NA: 'na' }[k] ?? k;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border">
      <td className="w-1/3 py-2.5 pr-4 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </td>
      <td className="py-2.5 font-sans text-charcoal">{value}</td>
    </tr>
  );
}

function SignOff({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="flex h-10 items-end border-b border-charcoal pb-1 font-raleway text-sm font-bold text-navy">
        {value}
      </div>
      <p className="mt-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">{label}</p>
      {sub ? <p className="mt-0.5 font-sans text-xs text-muted">{sub}</p> : null}
    </div>
  );
}
