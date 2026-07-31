'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DocumentForm, type DocumentFormValues } from '@/components/admin/DocumentForm';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { adminCreateDocument } from '@/lib/api/admin';

export default function NewDocumentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: DocumentFormValues) => {
    setSubmitting(true);
    try {
      const doc = await adminCreateDocument(input);
      toast('Created');
      router.push(`/admin/documents/${doc.id}`);
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
      <AdminPageHeader title="New document" subtitle="Draft or publish straight away" />
      <DocumentForm submitting={submitting} onSubmit={handleSubmit} />
    </div>
  );
}
