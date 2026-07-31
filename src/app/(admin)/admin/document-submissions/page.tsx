'use client';

import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DocumentForm, type DocumentFormValues } from '@/components/admin/DocumentForm';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { getCountry } from '@/lib/countries';
import {
  internCreateDocumentSubmission,
  internListMyDocumentSubmissions,
  internUpdateDocumentSubmission,
  type DocumentSubmission,
  type DocumentSubmissionInput,
} from '@/lib/api/admin';

/**
 * /admin/document-submissions — interns with `documents.submit` draft
 * a Civic Library document (government constitution/act/bill/policy
 * PDF + metadata) for review. A reviewer with `intern.review`
 * approves it into the live, publicly downloadable Civic Library or
 * rejects with a reason. Mirrors /admin/product-submissions —same
 * shared-form pattern, same PENDING_REVIEW/APPROVED/REJECTED flow.
 */

const STATUS_META: Record<
  DocumentSubmission['status'],
  { label: string; cls: string }
> = {
  PENDING_REVIEW: { label: 'In review', cls: 'bg-amber/15 text-navy' },
  APPROVED: { label: 'Approved', cls: 'bg-success/10 text-success' },
  REJECTED: { label: 'Needs changes', cls: 'bg-danger/10 text-danger' },
};

function submissionToInitial(s: DocumentSubmission) {
  return {
    title: s.title,
    slug: s.slug,
    country: s.country,
    docType: s.docType,
    description: s.description,
    issuingBody: s.issuingBody,
    officialSourceUrl: s.officialSourceUrl,
    publishedDate: s.publishedDate,
    fileUrl: s.fileUrl,
    fileSizeBytes: s.fileSizeBytes,
  };
}

export default function InternDocumentSubmissionsPage() {
  const [items, setItems] = useState<DocumentSubmission[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    try {
      const res = await internListMyDocumentSubmissions();
      setItems(res.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      setItems([]);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const editing = editingId ? (items?.find((s) => s.id === editingId) ?? null) : null;

  const startEdit = (s: DocumentSubmission) => {
    setEditingId(s.id);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => setEditingId(null);

  const handleSubmit = async (input: DocumentFormValues) => {
    setSubmitting(true);
    try {
      const payload: DocumentSubmissionInput = {
        title: input.title,
        slug: input.slug,
        country: input.country,
        docType: input.docType,
        description: input.description,
        issuingBody: input.issuingBody,
        officialSourceUrl: input.officialSourceUrl,
        publishedDate: input.publishedDate,
        fileUrl: input.fileUrl,
        fileSizeBytes: input.fileSizeBytes,
      };
      if (editingId) {
        await internUpdateDocumentSubmission(editingId, payload);
        toast('Submission updated + sent for review');
      } else {
        await internCreateDocumentSubmission(payload);
        toast('Document submitted for review');
      }
      resetForm();
      await refresh();
    } catch (err) {
      toast(
        err instanceof HttpApiError || err instanceof Error ? err.message : 'Submit failed',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title={editingId ? 'Edit submission' : 'Submit a document'}
        subtitle="Source an official government PDF (constitution, act, bill, policy). Once a reviewer approves it, it goes live in the Civic Library and counts toward your payout."
      />

      <DocumentForm
        key={editingId ?? 'new'}
        initial={editing ? submissionToInitial(editing) : undefined}
        isEdit={Boolean(editing)}
        submitting={submitting}
        submitLabel={editingId ? 'Resubmit for review' : 'Submit for review'}
        hideStatus
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
      />

      {/* My submissions */}
      <section className="rounded-card border border-border bg-white">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-raleway text-lg font-bold text-navy">My submissions</h2>
        </header>
        {items === null ? (
          <p className="p-5 font-sans text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-5 font-sans text-sm text-muted">
            No submissions yet. Fill the form above to submit your first document.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((s) => {
              const meta = STATUS_META[s.status];
              const country = getCountry(s.country);
              return (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1">
                    <p className="font-raleway font-semibold text-navy">{s.title}</p>
                    <p className="font-sans text-xs text-muted">
                      {country ? `${country.flag} ${country.name}` : s.country} · {s.docType} ·{' '}
                      {new Date(s.createdAt).toLocaleDateString()}
                      {s.createdDocumentId ? ' · published' : ''}
                    </p>
                    {s.status === 'REJECTED' && s.rejectionReason ? (
                      <p className="mt-1 font-sans text-xs text-danger">
                        Reviewer: {s.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                  {s.status !== 'APPROVED' ? (
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className={`shrink-0 rounded-btn border px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn ${
                        editingId === s.id
                          ? 'border-navy bg-navy text-white'
                          : 'border-border text-navy hover:border-navy'
                      }`}
                    >
                      {editingId === s.id ? 'Editing' : 'Edit'}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
