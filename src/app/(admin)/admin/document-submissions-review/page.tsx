'use client';

import { useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { getCountry } from '@/lib/countries';
import {
  adminListDocumentSubmissions,
  adminReviewDocumentSubmission,
  type DocumentSubmissionForReview,
  type DocumentSubmissionStatus,
} from '@/lib/api/admin';

/**
 * /admin/document-submissions-review — reviewers (capability
 * `intern.review`) approve or reject Civic Library document
 * submissions from interns. Approving publishes the document live
 * (publicly downloadable, no login); rejecting sends it back with a
 * reason for rework. Mirrors /admin/product-submissions-review.
 */

const TABS: { key: DocumentSubmissionStatus; label: string }[] = [
  { key: 'PENDING_REVIEW', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function DocumentSubmissionsReviewPage() {
  const [tab, setTab] = useState<DocumentSubmissionStatus>('PENDING_REVIEW');
  const [items, setItems] = useState<DocumentSubmissionForReview[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<DocumentSubmissionForReview | null>(null);
  const [reason, setReason] = useState('');

  const refresh = async (status: DocumentSubmissionStatus) => {
    setItems(null);
    try {
      const res = await adminListDocumentSubmissions({ status });
      setItems(res.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      setItems([]);
    }
  };

  useEffect(() => {
    void refresh(tab);
  }, [tab]);

  const approve = async (s: DocumentSubmissionForReview) => {
    setBusyId(s.id);
    try {
      await adminReviewDocumentSubmission(s.id, { action: 'approve' });
      toast(`Approved + published "${s.title}"`);
      await refresh(tab);
    } catch (e) {
      toast(
        e instanceof HttpApiError || e instanceof Error ? e.message : 'Approve failed',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejecting) return;
    if (!reason.trim()) {
      toast('Give a reason so the intern knows what to fix', 'error');
      return;
    }
    setBusyId(rejecting.id);
    try {
      await adminReviewDocumentSubmission(rejecting.id, {
        action: 'reject',
        reason: reason.trim(),
      });
      toast('Sent back for changes');
      setRejecting(null);
      setReason('');
      await refresh(tab);
    } catch (e) {
      toast(
        e instanceof HttpApiError || e instanceof Error ? e.message : 'Reject failed',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Document submissions"
        subtitle="Review government documents interns sourced. Approving publishes to the Civic Library and makes it payable."
      />

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-btn px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn ${
              tab === t.key
                ? 'bg-navy text-white'
                : 'border border-border bg-white text-muted hover:border-navy hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-card border border-border bg-white p-6 font-sans text-sm text-muted">
          Nothing here.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((s) => {
            const country = getCountry(s.country);
            return (
              <li
                key={s.id}
                className="overflow-hidden rounded-card border border-border bg-white shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
                  <div>
                    <p className="font-raleway font-bold text-navy">{s.title}</p>
                    <p className="font-sans text-xs text-muted">
                      by {s.intern.name ?? s.intern.email} ·{' '}
                      {new Date(s.createdAt).toLocaleString()} ·{' '}
                      {country ? `${country.flag} ${country.name}` : s.country} · {s.docType}
                    </p>
                  </div>
                  {tab === 'PENDING_REVIEW' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approve(s)}
                        disabled={busyId === s.id}
                        className="flex items-center gap-1.5 rounded-btn bg-success px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {busyId === s.id ? (
                          <Loader2 size={13} className="animate-spin" aria-hidden />
                        ) : (
                          <Check size={13} aria-hidden />
                        )}
                        Approve & publish
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejecting(s);
                          setReason('');
                        }}
                        disabled={busyId === s.id}
                        className="flex items-center gap-1.5 rounded-btn border border-danger px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:bg-danger/5 disabled:opacity-50"
                      >
                        <X size={13} aria-hidden />
                        Reject
                      </button>
                    </div>
                  ) : s.status === 'APPROVED' && s.createdDocumentId ? (
                    <a
                      href={`/admin/documents/${s.createdDocumentId}`}
                      className="rounded-btn border border-border px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy"
                    >
                      Open document
                    </a>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[200px_1fr]">
                  {/* PDF link */}
                  <div className="flex flex-col items-start gap-2">
                    <a
                      href={s.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:border-navy"
                    >
                      <ExternalLink size={12} aria-hidden /> View PDF
                    </a>
                    {s.fileSizeBytes ? (
                      <span className="font-sans text-[11px] text-muted">
                        {(s.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    ) : null}
                  </div>

                  {/* Details */}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-sm">
                    <Detail label="Slug" value={s.slug} />
                    <Detail label="Issuing body" value={s.issuingBody ?? '—'} />
                    <Detail
                      label="Official source"
                      value={s.officialSourceUrl ?? '—'}
                    />
                    <Detail
                      label="Published date"
                      value={s.publishedDate ? new Date(s.publishedDate).toLocaleDateString() : '—'}
                    />
                    <Detail label="Pay rate" value={`₦${s.payRate.toLocaleString()}`} />
                    {s.description ? (
                      <div className="col-span-2">
                        <dt className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                          Description
                        </dt>
                        <dd className="mt-1 whitespace-pre-line text-charcoal">
                          {s.description}
                        </dd>
                      </div>
                    ) : null}
                    {s.status === 'REJECTED' && s.rejectionReason ? (
                      <div className="col-span-2">
                        <dt className="font-raleway text-[10px] font-bold uppercase tracking-btn text-danger">
                          Rejection reason
                        </dt>
                        <dd className="mt-1 text-danger">{s.rejectionReason}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Reject reason modal */}
      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-card bg-white p-5 shadow-card">
            <h3 className="font-raleway text-lg font-bold text-navy">
              Reject &ldquo;{rejecting.title}&rdquo;
            </h3>
            <p className="mt-1 font-sans text-sm text-muted">
              The intern sees this reason and can edit + resubmit.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-3 min-h-[100px] w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
              placeholder="e.g. This is an outdated version — the 2023 amendment supersedes it."
              maxLength={1000}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="rounded-btn border border-border px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-muted hover:border-navy hover:text-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={busyId === rejecting.id}
                className="flex items-center gap-1.5 rounded-btn bg-danger px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:opacity-90 disabled:opacity-50"
              >
                {busyId === rejecting.id ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                ) : null}
                Send back
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-charcoal">{value}</dd>
    </div>
  );
}
