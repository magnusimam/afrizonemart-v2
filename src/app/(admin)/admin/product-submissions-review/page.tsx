'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check, Loader2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminListProductSubmissions,
  adminReviewProductSubmission,
  type ProductSubmissionForReview,
  type ProductSubmissionStatus,
} from '@/lib/api/admin';

/**
 * /admin/product-submissions-review — reviewers (capability
 * `intern.review`) approve or reject full-product submissions from
 * interns. Approving creates the live product; rejecting sends it
 * back with a reason for rework. Mirrors the image-submission review
 * queue at /admin/interns.
 */

const TABS: { key: ProductSubmissionStatus; label: string }[] = [
  { key: 'PENDING_REVIEW', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function ProductSubmissionsReviewPage() {
  const [tab, setTab] = useState<ProductSubmissionStatus>('PENDING_REVIEW');
  const [items, setItems] = useState<ProductSubmissionForReview[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ProductSubmissionForReview | null>(null);
  const [reason, setReason] = useState('');

  const refresh = async (status: ProductSubmissionStatus) => {
    setItems(null);
    try {
      const res = await adminListProductSubmissions({ status });
      setItems(res.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      setItems([]);
    }
  };

  useEffect(() => {
    void refresh(tab);
  }, [tab]);

  const approve = async (s: ProductSubmissionForReview) => {
    setBusyId(s.id);
    try {
      await adminReviewProductSubmission(s.id, { action: 'approve' });
      toast(`Approved + published "${s.name}"`);
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
      await adminReviewProductSubmission(rejecting.id, {
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
        title="Product submissions"
        subtitle="Review full products interns submitted. Approving publishes the product live and makes it payable."
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
          {items.map((s) => (
            <li
              key={s.id}
              className="overflow-hidden rounded-card border border-border bg-white shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
                <div>
                  <p className="font-raleway font-bold text-navy">{s.name}</p>
                  <p className="font-sans text-xs text-muted">
                    by {s.intern.name ?? s.intern.email} ·{' '}
                    {new Date(s.createdAt).toLocaleString()} · ₦{s.price.toLocaleString()}
                    {s.comparePrice ? ` (was ₦${s.comparePrice.toLocaleString()})` : ''}
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
                ) : s.status === 'APPROVED' && s.createdProductId ? (
                  <a
                    href={`/admin/products/${s.createdProductId}/edit`}
                    className="rounded-btn border border-border px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy"
                  >
                    Open product
                  </a>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[200px_1fr]">
                {/* Image gallery */}
                <div className="flex flex-wrap gap-2">
                  {s.images.length === 0 ? (
                    <span className="font-sans text-xs text-muted">No images</span>
                  ) : (
                    s.images.slice(0, 6).map((url, i) => (
                      <span
                        key={i}
                        className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-page"
                      >
                        <Image src={url} alt="" fill sizes="80px" unoptimized className="object-cover" />
                      </span>
                    ))
                  )}
                </div>

                {/* Details */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-sm">
                  <Detail label="Slug" value={s.slug} />
                  <Detail label="Brand" value={s.brand ?? '—'} />
                  <Detail label="Origin" value={s.origin ?? '—'} />
                  <Detail label="Category" value={s.categorySlug ?? '—'} />
                  <Detail label="Weight" value={s.weightKg ? `${s.weightKg} kg` : '—'} />
                  <Detail label="Pay rate" value={`₦${s.payRate.toLocaleString()}`} />
                  <div className="col-span-2">
                    <Detail label="Short description" value={s.shortDescription ?? '—'} />
                  </div>
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
          ))}
        </ul>
      )}

      {/* Reject reason modal */}
      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-card bg-white p-5 shadow-card">
            <h3 className="font-raleway text-lg font-bold text-navy">
              Reject &ldquo;{rejecting.name}&rdquo;
            </h3>
            <p className="mt-1 font-sans text-sm text-muted">
              The intern sees this reason and can edit + resubmit.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-3 min-h-[100px] w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
              placeholder="e.g. Price looks too low, and the description is missing the pack size."
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
      <dd className="mt-0.5 text-charcoal">{value}</dd>
    </div>
  );
}
