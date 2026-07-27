/**
 * Single source of truth for PIQ status pills. Every surface (dashboard,
 * My PIQs, admin review) uses this so colours never drift.
 */

export type PIQStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REVISION_REQUIRED'
  | 'REJECTED';

const STYLES: Record<PIQStatus, { cls: string; label: string }> = {
  DRAFT: { cls: 'bg-page text-muted ring-1 ring-border', label: 'Draft' },
  SUBMITTED: { cls: 'bg-navy-light text-navy', label: 'Submitted' },
  UNDER_REVIEW: { cls: 'bg-amber-light text-amber-dark', label: 'Under review' },
  APPROVED: { cls: 'bg-[#EAFAF1] text-success', label: 'Approved' },
  REVISION_REQUIRED: { cls: 'bg-amber-light text-danger', label: 'Revision required' },
  REJECTED: { cls: 'bg-[#FDEDEC] text-danger', label: 'Rejected' },
};

export function PIQStatusBadge({ status }: { status: PIQStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
