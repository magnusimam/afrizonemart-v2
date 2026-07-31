'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DocumentForm, type DocumentFormValues } from '@/components/admin/DocumentForm';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { adminGetDocument, adminUpdateDocument, type AdminLibraryDocument } from '@/lib/api/admin';

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<AdminLibraryDocument | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminGetDocument(params.id)
      .then(setDoc)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
  }, [params.id]);

  if (!doc) {
    return <div className="px-8 py-10 font-sans text-sm text-muted">Loading document…</div>;
  }

  const handleSubmit = async (input: DocumentFormValues) => {
    setSubmitting(true);
    try {
      const saved = await adminUpdateDocument(doc.id, input);
      toast('Saved');
      setDoc(saved);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/documents"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ArrowLeft size={12} aria-hidden /> All documents
      </Link>
      <AdminPageHeader
        title={doc.title}
        subtitle={`/library/${doc.slug} · ${doc.status}`}
        action={
          doc.status === 'PUBLISHED' && (
            <Link
              href={`/library`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy"
            >
              <ExternalLink size={14} aria-hidden /> View Civic Library
            </Link>
          )
        }
      />
      <DocumentForm initial={doc} isEdit submitting={submitting} onSubmit={handleSubmit} />
    </div>
  );
}
