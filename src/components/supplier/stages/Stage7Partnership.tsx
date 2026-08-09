'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, Handshake, Loader2, PenLine } from 'lucide-react';
import { completeStage, getStageAnswers } from '@/lib/api/supplier';
import { supplierKeys } from '@/lib/api/supplier-hooks';

/**
 * Stage 7 — Partnership. The supplier reviews and accepts the partnership
 * agreement; signing persists to their stage answers and advances the journey
 * to Stage 8 (Activation).
 */
const TERMS = [
  'Afrizonemart lists and markets your products across its marketplace and partner channels.',
  'Agreed pricing, margins, and order terms as confirmed with the Sourcing Unit.',
  'You maintain product quality and supply consistency to the standards from your audit.',
  'Project Voltron services are available on-demand throughout the partnership.',
];

interface PartnershipAnswers {
  agreed?: boolean;
  signedAt?: string;
}

export function Stage7Partnership() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'stage', 7],
    queryFn: () => getStageAnswers(7) as Promise<PartnershipAnswers>,
    retry: false,
  });

  const signed = data?.agreed === true;

  const sign = useMutation({
    mutationFn: () =>
      completeStage(7, { agreed: true, signedAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.me });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'stage', 7] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-card bg-white shadow-card" />
        <div className="h-64 animate-pulse rounded-card bg-white shadow-card" />
      </div>
    );
  }

  const signedDate = data?.signedAt
    ? new Date(data.signedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
        <header className="flex items-center gap-3 border-b border-border p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-light text-navy">
            <Handshake size={20} aria-hidden />
          </span>
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">Partnership agreement</h2>
            <p className="mt-0.5 font-sans text-sm text-muted">
              Review the terms and confirm to formalise your partnership.
            </p>
          </div>
        </header>

        <div className="p-6">
          <ul className="flex flex-col gap-3">
            {TERMS.map((t, i) => (
              <li key={i} className="flex gap-2.5 font-sans text-sm leading-relaxed text-charcoal">
                <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 font-raleway text-sm font-semibold text-navy hover:text-amber-dark"
          >
            <Download size={15} aria-hidden /> Download full agreement (PDF)
          </button>

          {signed ? (
            <div className="mt-6 flex items-center gap-3 rounded-card border border-success/40 bg-[#EAFAF1] p-4">
              <CheckCircle2 size={20} aria-hidden className="shrink-0 text-success" />
              <p className="font-sans text-sm text-charcoal">
                <strong className="text-navy">Partnership confirmed.</strong>
                {signedDate ? ` Signed ${signedDate}. ` : ' '}
                Next up: our crew schedules your <em>It’s Made in Africa</em> production.
              </p>
            </div>
          ) : (
            <div className="mt-6 border-t border-border pt-5">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-navy"
                />
                <span className="font-sans text-sm text-charcoal">
                  I confirm I’ve read and accept the partnership terms on behalf of
                  my business.
                </span>
              </label>
              {sign.isError && (
                <p className="mt-3 font-sans text-sm text-danger">
                  Couldn’t save your signature. Please try again.
                </p>
              )}
              <button
                type="button"
                disabled={!agreed || sign.isPending}
                onClick={() => sign.mutate()}
                className="mt-4 inline-flex items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {sign.isPending ? (
                  <>
                    <Loader2 size={16} aria-hidden className="animate-spin" /> Signing…
                  </>
                ) : (
                  <>
                    <PenLine size={16} aria-hidden /> Accept &amp; sign
                  </>
                )}
              </button>
            </div>
          )}

          {signed && (
            <button
              type="button"
              onClick={() => router.push('/supplier/dashboard')}
              className="mt-6 inline-flex items-center gap-2 font-raleway text-sm font-semibold text-navy hover:text-amber-dark"
            >
              Back to dashboard
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
