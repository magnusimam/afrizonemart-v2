'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCancelInternPayoutDraft,
  adminFinalizeInternPayout,
  adminGetInternPayout,
  type InternPayoutDetail,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';

export default function AdminInternPayoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payout, setPayout] = useState<InternPayoutDetail | null>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [externalRef, setExternalRef] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await adminGetInternPayout(id);
        if (!cancelled) setPayout(r);
      } catch (e) {
        toast(
          e instanceof HttpApiError ? e.message : 'Failed to load payout',
          'error',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleFinalize = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await adminFinalizeInternPayout(id, {
        externalRef: externalRef.trim() || undefined,
        note: note.trim() || undefined,
      });
      toast('Payout marked paid');
      const r = await adminGetInternPayout(id);
      setPayout(r);
      setShowFinalize(false);
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to mark paid',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await adminCancelInternPayoutDraft(id);
      toast('Draft payout cancelled — submissions are back in the unpaid pool');
      router.push('/admin/intern-payouts');
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to cancel draft',
        'error',
      );
      setBusy(false);
    }
  };

  if (!payout) {
    return (
      <div className="flex items-center gap-2 px-8 py-12 text-muted">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        <span className="font-sans text-sm">Loading payout…</span>
      </div>
    );
  }

  const isDraft = payout.paidAt === null;

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/intern-payouts"
        className="mb-4 inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-navy"
      >
        <ArrowLeft size={14} aria-hidden /> All payouts
      </Link>

      <AdminPageHeader
        title={`${payout.intern.name || payout.intern.email} — payout`}
        subtitle={
          isDraft
            ? 'Draft. Mark paid once the transfer has gone through, or cancel to release these submissions back to the unpaid pool.'
            : `Marked paid ${new Date(payout.paidAt!).toLocaleString()}.`
        }
        action={
          isDraft ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowFinalize(true)}
                className="flex items-center gap-2 rounded-btn bg-success px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-success/85"
              >
                <CheckCircle2 size={14} aria-hidden /> Mark paid
              </button>
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="flex items-center gap-2 rounded-btn border border-danger bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:bg-danger hover:text-white"
              >
                <Trash2 size={14} aria-hidden /> Cancel draft
              </button>
            </div>
          ) : null
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Status" value={isDraft ? 'Draft' : 'Paid'} />
        <Stat
          label="Submissions"
          value={payout.submissionCount.toLocaleString()}
        />
        <Stat label="Total" value={formatPriceNGN(payout.totalNgn)} />
        <Stat
          label="Created"
          value={new Date(payout.createdAt).toLocaleDateString()}
          sub={payout.createdBy?.name || payout.createdBy?.email || ''}
        />
      </div>

      {(payout.windowFrom || payout.windowTo) && (
        <p className="mb-4 font-sans text-sm text-muted">
          Window:{' '}
          <strong>
            {payout.windowFrom
              ? new Date(payout.windowFrom).toLocaleDateString()
              : '—'}
          </strong>{' '}
          →{' '}
          <strong>
            {payout.windowTo
              ? new Date(payout.windowTo).toLocaleDateString()
              : '—'}
          </strong>
        </p>
      )}

      {!isDraft && (payout.externalRef || payout.note) && (
        <div className="mb-6 rounded-card border border-border bg-page p-4">
          {payout.externalRef && (
            <p className="font-sans text-sm">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                Transfer ref:
              </span>{' '}
              <span className="font-mono text-charcoal">{payout.externalRef}</span>
            </p>
          )}
          {payout.note && (
            <p className="mt-1 font-sans text-sm text-charcoal">{payout.note}</p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-border bg-white shadow-card">
        <table className="w-full border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-border bg-page">
              <Th>Product</Th>
              <Th>Approved</Th>
              <Th>Pay rate</Th>
            </tr>
          </thead>
          <tbody>
            {payout.submissions.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border last:border-0 hover:bg-page/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/product/${s.product.slug}`}
                    target="_blank"
                    className="font-raleway font-semibold text-navy hover:underline"
                  >
                    {s.product.name}
                  </Link>
                  <p className="font-mono text-[11px] text-muted">
                    {s.product.slug}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {s.reviewedAt
                    ? new Date(s.reviewedAt).toLocaleString()
                    : '—'}
                </td>
                <td className="px-4 py-3 font-raleway font-semibold text-navy">
                  {formatPriceNGN(s.payRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showFinalize && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
          onClick={() => {
            if (!busy) setShowFinalize(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-card bg-white p-6 shadow-card-hover"
          >
            <h2 className="font-raleway text-lg font-bold text-navy">
              Mark payout as paid
            </h2>
            <p className="mt-1 font-sans text-sm text-muted">
              Record the transfer reference and an optional note. After this,
              the {payout.submissionCount} submission
              {payout.submissionCount === 1 ? '' : 's'} won&apos;t appear in
              future unpaid totals.
            </p>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Transfer ref (optional)
              </span>
              <input
                type="text"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                maxLength={120}
                placeholder="Bank txn ID / Mobile Money ref"
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Note (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Paid via Kuda — May payroll"
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowFinalize(false)}
                disabled={busy}
                className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={busy}
                className="rounded-btn bg-success px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-success/85 disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Mark paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showCancel}
        title="Cancel this draft payout?"
        message={`The ${payout.submissionCount} submission${
          payout.submissionCount === 1 ? '' : 's'
        } attached to this payout will return to the unpaid pool. The draft will be deleted. This cannot be undone, but you can build a new payout afterwards.`}
        confirmLabel="Cancel draft"
        destructive
        busy={busy}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-white px-3 py-3">
      <p className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </p>
      <p className="mt-1 font-raleway text-lg font-bold text-navy">{value}</p>
      {sub && <p className="font-sans text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
      {children}
    </th>
  );
}
