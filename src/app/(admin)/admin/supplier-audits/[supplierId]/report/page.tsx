'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AuditReportDocument, type AuditReportData } from '@/components/supplier/AuditReportDocument';
import {
  getAdminAudit,
  getAuditTemplate,
  type AdminAuditDetail,
  type AuditTemplate,
} from '@/lib/api/admin-suppliers';

export default function AdminAuditReportPage({ params }: { params: { supplierId: string } }) {
  const [detail, setDetail] = useState<AdminAuditDetail | null>(null);
  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminAudit(params.supplierId)
      .then(async (d) => {
        if (cancelled) return;
        setDetail(d);
        if (d.audit.category) {
          const tpl = await getAuditTemplate(d.audit.category);
          if (!cancelled) setTemplate(tpl);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
    return () => { cancelled = true; };
  }, [params.supplierId]);

  const back = (
    <div className="no-print mx-auto max-w-3xl px-4 pt-6">
      <Link href="/admin/supplier-audits" className="inline-flex items-center gap-1 font-raleway text-sm font-semibold text-muted hover:text-navy">
        <ChevronLeft size={16} aria-hidden /> Back to audits
      </Link>
    </div>
  );

  if (error) return <div>{back}<p className="mx-auto max-w-3xl px-4 py-10 font-sans text-sm text-danger">{error}</p></div>;
  if (!detail) return <div>{back}<p className="mx-auto max-w-3xl px-4 py-10 font-sans text-sm text-muted">Loading report…</p></div>;
  if (detail.audit.status !== 'COMPLETED') {
    return <div>{back}<p className="mx-auto max-w-3xl px-4 py-10 font-sans text-sm text-muted">This audit isn’t completed yet — no report to print.</p></div>;
  }

  const a = detail.audit;
  const data: AuditReportData = {
    company: detail.company,
    categoryName: template?.name ?? null,
    categoryCode: template?.code ?? null,
    conductedAt: a.conductedAt,
    outcome: a.outcome,
    indicativeScore: a.indicativeScore,
    counts: a.counts as Record<string, number> | null,
    summary: a.summary,
    recommendations: a.recommendations,
    auditorName: a.auditorName,
    signedBy: a.signedBy,
    approvedAt: a.approvedAt,
    metadata: a.metadata,
    sections: template?.sections ?? [],
    responses: a.responses,
    capa: a.capa,
  };

  return <div>{back}<AuditReportDocument data={data} /></div>;
}
