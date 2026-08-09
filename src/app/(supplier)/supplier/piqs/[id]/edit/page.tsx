'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Lock } from 'lucide-react';
import { PIQFormEngine } from '@/components/supplier/piq/PIQFormEngine';
import { PIQ_GENERAL_CONFIG } from '@/lib/supplier/piq-config';
import {
  createSupplierPIQ,
  getSupplierPIQ,
  submitSupplierPIQ,
  updateSupplierPIQ,
} from '@/lib/api/supplier';
import { supplierKeys } from '@/lib/api/supplier-hooks';

type Answers = Record<string, unknown>;

/**
 * PIQ editor. Existing product → loads the supplier's real answers and
 * autosaves/submits to the API. A new product is created on open, then we
 * swap the URL to its id so saves have somewhere to go.
 */
export default function PIQEditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new';
  const router = useRouter();
  const queryClient = useQueryClient();

  // New product → create a draft, then redirect to its editor.
  const createdRef = useRef(false);
  useEffect(() => {
    if (!isNew || createdRef.current) return;
    createdRef.current = true;
    createSupplierPIQ({ name: 'Untitled product' })
      .then((p) => router.replace(`/supplier/piqs/${p.id}/edit`))
      .catch(() => router.replace('/supplier/piqs'));
  }, [isNew, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'piq', params.id],
    queryFn: () => getSupplierPIQ(params.id),
    enabled: !isNew,
    retry: false,
  });

  const productName = isNew ? 'New product' : data?.name ?? 'Product';
  const initialAnswers = (data?.answers ?? {}) as Record<string, string>;

  // Only a draft or a requested revision is the supplier's to edit. While a
  // reviewer holds it — or once it's approved — the form is read-only, so
  // nobody can change answers underneath a review or after a decision.
  const editable = !data || data.status === 'DRAFT' || data.status === 'REVISION_REQUIRED';
  const lockedReason =
    data?.status === 'APPROVED'
      ? 'This product has been approved. Its answers are locked — contact the supplier desk if something needs to change.'
      : data?.status === 'REJECTED'
        ? 'This product was not approved. Its answers are locked.'
        : 'This questionnaire is with our review team. You’ll be able to edit it again if they request changes.';

  const onAutosave = async (answers: Answers, completion: number) => {
    await updateSupplierPIQ(params.id, {
      answers,
      completion,
      name: typeof answers.product_name === 'string' ? answers.product_name : undefined,
    });
    queryClient.invalidateQueries({ queryKey: supplierKeys.piqs });
  };

  const onSubmit = async (answers: Answers, completion: number) => {
    await updateSupplierPIQ(params.id, {
      answers,
      completion,
      name: typeof answers.product_name === 'string' ? answers.product_name : undefined,
    });
    await submitSupplierPIQ(params.id);
    queryClient.invalidateQueries({ queryKey: supplierKeys.piqs });
    queryClient.invalidateQueries({ queryKey: supplierKeys.me });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/supplier/piqs"
        className="inline-flex items-center gap-1 font-raleway text-sm font-semibold text-muted hover:text-navy"
      >
        <ChevronLeft size={16} aria-hidden /> Back to My PIQs
      </Link>

      <header className="mt-3 flex flex-col gap-1">
        <h1 className="font-raleway text-2xl font-extrabold text-navy md:text-3xl">{productName}</h1>
        <p className="font-sans text-sm text-muted">
          {PIQ_GENERAL_CONFIG.label} · the guidance beside each question shows you exactly how to answer.
        </p>
      </header>

      <div className="mt-8">
        {isNew || isLoading ? (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-card bg-white shadow-card" />
            <div className="h-64 animate-pulse rounded-card bg-white shadow-card" />
          </div>
        ) : (
          <>
            {!editable && (
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-card border border-border bg-page p-5 shadow-card"
              >
                <Lock size={18} aria-hidden className="mt-0.5 shrink-0 text-muted" />
                <p className="font-sans text-sm leading-relaxed text-charcoal">{lockedReason}</p>
              </div>
            )}
            <PIQFormEngine
              key={data?.id ?? 'loading'}
              config={PIQ_GENERAL_CONFIG}
              initialAnswers={initialAnswers}
              feedback={data?.feedback ?? undefined}
              reviewSummary={data?.reviewSummary ?? undefined}
              readOnly={!editable}
              onAutosave={editable ? onAutosave : undefined}
              onSubmit={editable ? onSubmit : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
