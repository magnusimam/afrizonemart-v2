'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ProductSubmissionPanel } from '@/components/admin/ProductSubmissionPanel';
import { DocumentSubmissionPanel } from '@/components/admin/DocumentSubmissionPanel';
import { useAuthStore } from '@/stores/authStore';
import { effectiveCapabilities, type StaffRole } from '@/lib/permissions';

/**
 * /admin/submissions — one entry point for every intern-sourced
 * content type (2026-08-01). Previously two separate pages
 * (/admin/product-submissions, /admin/document-submissions); merged
 * so interns don't need to learn two places to submit work. Each tab
 * is still its own form + field set under the hood (a product has
 * price/images/bundles, a document has country/docType/a PDF — too
 * different to share one form) via `ProductSubmissionPanel` /
 * `DocumentSubmissionPanel`. Tabs only show for capabilities the
 * signed-in user actually has; if they only have one, the toggle
 * itself is hidden and that panel renders directly.
 */

type Tab = 'product' | 'document';

function SubmissionsPageInner() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const caps = effectiveCapabilities((user?.role ?? 'CUSTOMER') as StaffRole, user?.permissions);
  const canProduct = caps.has('products.submit');
  const canDocument = caps.has('documents.submit');

  const requestedTab = searchParams.get('tab');
  const initialTab: Tab =
    requestedTab === 'document' && canDocument
      ? 'document'
      : requestedTab === 'product' && canProduct
        ? 'product'
        : canProduct
          ? 'product'
          : 'document';
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader
        title="Submit content"
        subtitle="Draft a product or a Civic Library document for review. Once a reviewer approves it, it goes live and counts toward your payout."
      />

      {canProduct && canDocument ? (
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('product')}
            className={`rounded-btn px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn ${
              tab === 'product'
                ? 'bg-navy text-white'
                : 'border border-border bg-white text-muted hover:border-navy hover:text-navy'
            }`}
          >
            Product
          </button>
          <button
            type="button"
            onClick={() => setTab('document')}
            className={`rounded-btn px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn ${
              tab === 'document'
                ? 'bg-navy text-white'
                : 'border border-border bg-white text-muted hover:border-navy hover:text-navy'
            }`}
          >
            Document
          </button>
        </div>
      ) : null}

      {tab === 'product' && canProduct ? <ProductSubmissionPanel /> : null}
      {tab === 'document' && canDocument ? <DocumentSubmissionPanel /> : null}
      {!canProduct && !canDocument ? (
        <p className="rounded-card border border-border bg-white p-6 font-sans text-sm text-muted">
          You don&apos;t have permission to submit content. Ask an admin to grant
          &ldquo;Submit full products&rdquo; or &ldquo;Submit Civic Library documents&rdquo;.
        </p>
      ) : null}
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-6 font-sans text-sm text-muted">Loading…</div>}>
      <SubmissionsPageInner />
    </Suspense>
  );
}
