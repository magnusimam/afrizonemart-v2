'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Star, Trash2, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminDeleteReview,
  adminListReviews,
  adminUpdateReview,
  type AdminReview,
} from '@/lib/api/admin';

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [ratingFilter, setRatingFilter] = useState<'' | '1' | '2' | '3' | '4' | '5'>('');
  const [hiddenFilter, setHiddenFilter] = useState<'all' | 'true' | 'false'>('false');
  const [data, setData] = useState<{
    items: AdminReview[];
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<AdminReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [verifiedFilter, ratingFilter, hiddenFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListReviews({
          page,
          limit: 25,
          verified: verifiedFilter === 'all' ? undefined : verifiedFilter === 'true',
          rating: ratingFilter ? Number(ratingFilter) : undefined,
          hidden: hiddenFilter === 'all' ? undefined : hiddenFilter === 'true',
        });
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load reviews', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, verifiedFilter, ratingFilter, hiddenFilter, reloadToken]);

  const toggleVerified = async (r: AdminReview) => {
    try {
      await adminUpdateReview(r.id, { verified: !r.verified });
      toast(r.verified ? 'Marked unverified' : 'Marked verified');
      setReloadToken((t) => t + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to update', 'error');
    }
  };

  const toggleHidden = async (r: AdminReview) => {
    const reason = r.hidden
      ? null
      : window.prompt(
          'Reason for hiding (optional, recorded on the row for audit):',
          '',
        );
    /// `null` reason on unhide; on hide, the empty string is fine
    /// (just no reason recorded). User cancelling the prompt
    /// returns null which we treat as cancel ONLY when hiding —
    /// allow unhide without a prompt at all.
    if (!r.hidden && reason === null) return;
    try {
      await adminUpdateReview(r.id, {
        hidden: !r.hidden,
        hiddenReason: r.hidden ? null : reason,
      });
      toast(r.hidden ? 'Review unhidden' : 'Review hidden');
      setReloadToken((t) => t + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to update', 'error');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteReview(pendingDelete.id);
      toast('Review deleted');
      setPendingDelete(null);
      setReloadToken((t) => t + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminReview>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (r) => (
        <Link
          href={`/product/${r.product?.slug ?? ''}`}
          className="font-raleway font-semibold text-navy hover:text-amber"
          target="_blank"
          rel="noreferrer"
        >
          {r.product?.name ?? '—'}
        </Link>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      render: (r) => (
        <div className="flex flex-col leading-tight">
          <span className="text-charcoal">{r.authorName}</span>
          {r.authorCountry && (
            <span className="font-sans text-[11px] text-muted">{r.authorCountry}</span>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (r) => (
        <div className="flex items-center gap-0.5 text-amber">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={13}
              fill={i <= r.rating ? 'currentColor' : 'none'}
              aria-hidden
            />
          ))}
        </div>
      ),
    },
    {
      key: 'review',
      header: 'Review',
      render: (r) => (
        <div className="flex max-w-md flex-col gap-1 leading-snug">
          {r.title && <span className="font-raleway text-sm font-semibold text-navy">{r.title}</span>}
          <span className="line-clamp-2 font-sans text-xs text-charcoal">{r.body}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          {r.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-sans text-[11px] font-bold text-success">
              <CheckCircle2 size={11} aria-hidden /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-border/40 px-2 py-0.5 font-sans text-[11px] font-bold text-muted">
              <XCircle size={11} aria-hidden /> Pending
            </span>
          )}
          {r.hidden ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 font-sans text-[11px] font-bold text-danger"
              title={r.hiddenReason ?? undefined}
            >
              <EyeOff size={11} aria-hidden /> Hidden
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => toggleVerified(r)}
            className="rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
          >
            {r.verified ? 'Unverify' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={() => toggleHidden(r)}
            className={
              r.hidden
                ? 'rounded-md p-1.5 text-amber hover:bg-amber/10'
                : 'rounded-md p-1.5 text-muted hover:bg-amber/10 hover:text-amber'
            }
            aria-label={r.hidden ? 'Unhide review' : 'Hide review'}
            title={
              r.hidden
                ? `Unhide${r.hiddenReason ? ` (hidden reason: ${r.hiddenReason})` : ''}`
                : 'Hide review'
            }
          >
            {r.hidden ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => setPendingDelete(r)}
            className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
            aria-label="Delete review"
            title="Hard delete (permanent — use Hide for moderation)"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Reviews"
        subtitle={data ? `${data.pagination.total.toLocaleString()} total` : 'Loading…'}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value as 'all' | 'true' | 'false')}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="true">Verified</option>
          <option value="false">Pending</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value as '' | '1' | '2' | '3' | '4' | '5')}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? '' : 's'}
            </option>
          ))}
        </select>
        <select
          value={hiddenFilter}
          onChange={(e) => setHiddenFilter(e.target.value as 'all' | 'true' | 'false')}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
          title="Hidden visibility filter"
        >
          <option value="false">Visible only</option>
          <option value="true">Hidden only</option>
          <option value="all">All visibility</option>
        </select>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyState="No reviews match these filters."
        pagination={
          data
            ? {
                page: data.pagination.page,
                pages: data.pagination.pages,
                total: data.pagination.total,
                onPage: setPage,
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete review"
        message={
          pendingDelete
            ? `Delete this review by ${pendingDelete.authorName}? The product's rating + review count will recompute automatically.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => !busy && setPendingDelete(null)}
      />
    </div>
  );
}
