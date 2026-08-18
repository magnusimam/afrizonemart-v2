'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Download } from 'lucide-react';
import { AuditReportDocument, type AuditReportData } from '@/components/supplier/AuditReportDocument';
import { useSupplierMe } from '@/lib/api/supplier-hooks';
import { getSupplierAudit } from '@/lib/api/supplier';

export default function SupplierAuditReportPage() {
  const { data: me } = useSupplierMe();
  const { data: audit, isLoading } = useQuery({
    queryKey: ['supplier', 'audit'],
    queryFn: getSupplierAudit,
    retry: false,
  });

  if (isLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-10 font-sans text-sm text-muted">Loading report…</p>;
  }
  if (!audit) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="font-sans text-sm text-muted">Your audit report isn’t available yet.</p>
        <Link href="/supplier/stages/6" className="mt-3 inline-flex items-center gap-1 font-raleway text-sm font-semibold text-navy hover:text-amber-dark">
          <ChevronLeft size={16} aria-hidden /> Back to Stage 6
        </Link>
      </div>
    );
  }

  const data: AuditReportData = {
    company: me?.companyName ?? 'Supplier',
    categoryName: audit.categoryName,
    categoryCode: audit.template?.code ?? null,
    conductedAt: audit.conductedAt,
    outcome: audit.outcome,
    indicativeScore: audit.indicativeScore,
    counts: audit.counts,
    summary: audit.summary,
    recommendations: audit.recommendations,
    signedBy: audit.signedBy,
    approvedAt: audit.approvedAt,
    sections: audit.template?.sections ?? [],
    responses: audit.responses,
    capa: audit.capa,
  };

  return (
    <div>
      <div className="no-print mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 pt-6">
        <Link href="/supplier/stages/6" className="inline-flex items-center gap-1 font-raleway text-sm font-semibold text-muted hover:text-navy">
          <ChevronLeft size={16} aria-hidden /> Back to Stage 6
        </Link>

        {/* Offered only when a document was issued for this audit. The page
            below already renders the findings, so this is the signed artefact
            rather than a second copy of what is on screen. */}
        {audit.reportFileUrl && (
          <a
            href={audit.reportFileUrl}
            download={audit.reportFileName ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-[13px] font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark"
          >
            <Download size={15} aria-hidden />
            Download signed report
          </a>
        )}
      </div>
      <AuditReportDocument data={data} />
    </div>
  );
}
