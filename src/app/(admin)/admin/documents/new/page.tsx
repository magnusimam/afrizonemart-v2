'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DocumentForm } from '@/components/admin/DocumentForm';

export default function NewDocumentPage() {
  const router = useRouter();
  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/documents"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ArrowLeft size={12} aria-hidden /> All documents
      </Link>
      <AdminPageHeader title="New document" subtitle="Draft or publish straight away" />
      <DocumentForm
        onSaved={(doc) => {
          router.push(`/admin/documents/${doc.id}`);
        }}
      />
    </div>
  );
}
