'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Users,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateInternPayoutDraft,
  adminGetInternProgress,
  adminListInternPayouts,
  adminPreviewInternPayout,
  type InternPayoutSummary,
  type InternProgressItem,
  type PayoutPreview,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';
import { useRouter } from 'next/navigation';

/// /admin/intern-payouts — Tracker #50.
/// Lists every InternPayout (DRAFT + PAID) and lets an admin build a
/// new payout for a chosen intern from an optional date window.
/// Clicking a row opens the detail page where the payout is marked paid.
export default function AdminInternPayoutsPage() {
  const [data, setData] = useState<{ items: InternPayoutSummary[] } | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'paid'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await adminListInternPayouts({ status: filter });
        if (!cancelled) setData(r);
      } catch (e) {
        toast(
          e instanceof HttpApiError ? e.message : 'Failed to load payouts',
          'error',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, reloadToken]);

  const items = data?.items ?? [];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Intern payouts"
        subtitle="Build a payout for an intern from their approved-but-unpaid work, then mark it paid when the bank transfer has gone out."
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white"
          >
            <Plus size={14} aria-hidden /> New payout
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          icon={<Users size={12} aria-hidden />}
          label="All"
        />
        <FilterChip
          active={filter === 'draft'}
          onClick={() => setFilter('draft')}
          icon={<Clock size={12} aria-hidden />}
          label="Draft"
        />
        <FilterChip
          active={filter === 'paid'}
          onClick={() => setFilter('paid')}
          icon={<CheckCircle2 size={12} aria-hidden />}
          label="Paid"
        />
      </div>

      {data === null ? (
        <div className="flex items-center gap-2 py-12 text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          <span className="font-sans text-sm">Loading payouts…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-page px-6 py-12 text-center">
          <Banknote size={28} aria-hidden className="mx-auto text-muted" />
          <p className="mt-3 font-raleway text-lg font-bold text-navy">
            No payouts yet.
          </p>
          <p className="mt-1 font-sans text-sm text-muted">
            Click <strong>New payout</strong> to build one for an intern.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-white shadow-card">
          <table className="w-full border-collapse text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-border bg-page">
                <Th>Intern</Th>
                <Th>Status</Th>
                <Th>Submissions</Th>
                <Th>Total</Th>
                <Th>Window</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-page/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/intern-payouts/${p.id}`}
                      className="font-raleway font-semibold text-navy hover:underline"
                    >
                      {p.intern.name || p.intern.email}
                    </Link>
                    <p className="font-mono text-[11px] text-muted">{p.intern.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip paidAt={p.paidAt} />
                  </td>
                  <td className="px-4 py-3 font-raleway font-semibold text-navy">
                    {p.submissionCount}
                  </td>
                  <td className="px-4 py-3 font-raleway font-semibold text-navy">
                    {formatPriceNGN(p.totalNgn)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {p.windowFrom || p.windowTo
                      ? `${p.windowFrom ? new Date(p.windowFrom).toLocaleDateString() : '—'} → ${
                          p.windowTo ? new Date(p.windowTo).toLocaleDateString() : '—'
                        }`
                      : 'All-time'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreatePayoutDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
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

function FilterChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-input border px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
        active
          ? 'border-navy bg-navy text-white'
          : 'border-border bg-white text-charcoal hover:border-navy/60'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusChip({ paidAt }: { paidAt: string | null }) {
  if (paidAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
        <CheckCircle2 size={10} aria-hidden />
        Paid · {new Date(paidAt).toLocaleDateString()}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
      <Clock size={10} aria-hidden />
      Draft
    </span>
  );
}

function CreatePayoutDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [interns, setInterns] = useState<InternProgressItem[] | null>(null);
  const [internId, setInternId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preview, setPreview] = useState<PayoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void adminGetInternProgress()
      .then((r) =>
        setInterns(
          r.items
            /// Only show interns with claimable work — picking someone
            /// with 0 unpaid would just produce a "no submissions match"
            /// preview. Their lifetime stats are still visible on
            /// /admin/interns; this dropdown's job is "pick someone to
            /// pay right now".
            .filter((i) => i.unpaidApproved > 0)
            /// Sort by claimable work descending so the admin sees who
            /// has the largest pending payday first.
            .sort((a, b) => b.unpaidApproved - a.unpaidApproved),
        ),
      )
      .catch((e) =>
        toast(
          e instanceof HttpApiError ? e.message : 'Failed to load interns',
          'error',
        ),
      );
  }, []);

  const selected = useMemo(
    () => interns?.find((i) => i.id === internId) ?? null,
    [interns, internId],
  );

  const toIso = (d: string): string | undefined => {
    if (!d) return undefined;
    /// Date input gives YYYY-MM-DD; widen to a full day-range in the
    /// API (server-side filter compares against reviewedAt).
    return new Date(d).toISOString();
  };

  /// Window for both preview + create — single source of truth so the
  /// numbers the admin saw in preview are exactly what gets stamped.
  const windowInput = () => ({
    internId,
    fromDate: toIso(fromDate),
    toDate: toIso(toDate ? `${toDate}T23:59:59` : ''),
  });

  const handlePreview = async () => {
    if (!internId) return;
    setPreviewLoading(true);
    try {
      const r = await adminPreviewInternPayout(windowInput());
      setPreview(r);
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Preview failed',
        'error',
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!internId) return;
    setCreating(true);
    try {
      const r = await adminCreateInternPayoutDraft(windowInput());
      toast(
        `Created draft for ${r.intern.name || r.intern.email}: ${r.submissionCount} submission${r.submissionCount === 1 ? '' : 's'}`,
      );
      onCreated();
      router.push(`/admin/intern-payouts/${r.id}`);
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to create draft',
        'error',
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
      onClick={() => {
        if (!creating) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-card bg-white p-6 shadow-card-hover"
      >
        <h2 className="font-raleway text-lg font-bold text-navy">
          New intern payout
        </h2>
        <p className="mt-1 font-sans text-sm text-muted">
          Pick an intern and (optionally) a date window. The payout will cover
          every approved submission whose review date falls inside the window
          and that hasn&apos;t been rolled into another payout yet.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 sm:col-span-3">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              Intern
            </span>
            <select
              value={internId}
              onChange={(e) => {
                setInternId(e.target.value);
                setPreview(null);
              }}
              className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
            >
              <option value="">
                {interns === null
                  ? 'Loading interns…'
                  : interns.length === 0
                    ? 'No interns with unpaid work right now'
                    : 'Pick an intern…'}
              </option>
              {interns?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name || i.email} — {i.unpaidApproved} unpaid
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              From (optional)
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPreview(null);
              }}
              className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              To (optional)
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPreview(null);
              }}
              className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handlePreview}
            disabled={!internId || previewLoading}
            className="self-end rounded-btn border border-navy bg-white px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewLoading ? 'Loading…' : 'Preview'}
          </button>
        </div>

        {preview && (
          <div className="mt-5 rounded-card border border-border bg-page p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-raleway text-sm font-bold text-navy">
                {preview.submissionCount} submission
                {preview.submissionCount === 1 ? '' : 's'} eligible
              </p>
              <p className="font-raleway text-lg font-bold text-navy">
                {formatPriceNGN(preview.totalNgn)}
              </p>
            </div>
            {preview.submissionCount === 0 ? (
              <p className="mt-2 font-sans text-sm text-muted">
                No approved-and-unpaid submissions match this window for{' '}
                {selected?.name || selected?.email}.
              </p>
            ) : (
              <ul className="mt-3 max-h-40 overflow-y-auto text-xs">
                {preview.submissions.slice(0, 100).map((s) => (
                  <li
                    key={s.id}
                    className="flex justify-between gap-3 border-b border-border/60 py-1 last:border-0"
                  >
                    <span className="truncate text-charcoal">
                      {s.product.name}
                    </span>
                    <span className="shrink-0 font-mono text-muted">
                      {formatPriceNGN(s.payRate)}
                    </span>
                  </li>
                ))}
                {preview.submissions.length > 100 && (
                  <li className="py-1 text-center text-muted">
                    + {preview.submissions.length - 100} more
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={
              !internId ||
              creating ||
              (preview !== null && preview.submissionCount === 0)
            }
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
