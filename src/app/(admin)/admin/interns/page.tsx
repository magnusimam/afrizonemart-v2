'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Coins, Download, Shuffle, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminBulkAssignInterns,
  adminDownloadInternCsv,
  adminGetInternPayRate,
  adminGetInternProgress,
  adminListSubmissions,
  adminListStaff,
  adminReassignProducts,
  adminReviewSubmission,
  adminSetInternPayRate,
  type AdminSubmissionItem,
  type InternProgressItem,
  type StaffMember,
} from '@/lib/api/admin';

/// Admin dashboard for the intern image-update workflow.
///
///   - Top cards:   per-intern progress (assigned / done / pending / rejected)
///   - Top action:  bulk-assign unimaged products + reassign-from-X buttons
///   - Bottom:      pending submissions queue with approve / reject-with-reason
export default function AdminInternsPage() {
  const [progress, setProgress] = useState<InternProgressItem[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [submissions, setSubmissions] = useState<AdminSubmissionItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Bulk-assign UI state.
  const [assignSelection, setAssignSelection] = useState<Set<string>>(new Set());
  const [confirmAssign, setConfirmAssign] = useState(false);

  // Reject UI state.
  const [pendingReject, setPendingReject] = useState<AdminSubmissionItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Reassignment UI state.
  const [reassignSource, setReassignSource] = useState<InternProgressItem | null>(null);
  const [reassignTargets, setReassignTargets] = useState<Set<string>>(new Set());

  // Pay rate + CSV export filters.
  const [payRate, setPayRate] = useState<number | null>(null);
  const [payRateInput, setPayRateInput] = useState('');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportInternId, setExportInternId] = useState('');

  const loadAll = () =>
    Promise.all([
      adminGetInternProgress(),
      adminListStaff(),
      adminListSubmissions({ status: 'PENDING_REVIEW' }),
      adminGetInternPayRate(),
    ])
      .then(([p, s, q, r]) => {
        setProgress(p.items);
        setStaff(s.items);
        setSubmissions(q.items);
        setPayRate(r.rate);
        setPayRateInput(String(r.rate));
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void loadAll();
  }, []);

  const eligibleInterns =
    staff?.filter(
      (s) =>
        s.role === 'STAFF' &&
        s.permissions.includes('products.image-only'),
    ) ?? [];

  const toggleSelection = (id: string) => {
    setAssignSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (assignSelection.size === 0) return;
    setBusy(true);
    try {
      const r = await adminBulkAssignInterns({
        internIds: Array.from(assignSelection),
        scope: 'all-unimaged',
      });
      toast(
        r.assigned === 0
          ? 'No unimaged products to assign'
          : `Assigned ${r.assigned} products across ${Object.keys(r.perIntern).length} intern${Object.keys(r.perIntern).length === 1 ? '' : 's'}`,
      );
      setConfirmAssign(false);
      setAssignSelection(new Set());
      await loadAll();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to assign', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignSource) return;
    setBusy(true);
    try {
      const r = await adminReassignProducts({
        fromInternId: reassignSource.id,
        toInternIds:
          reassignTargets.size > 0 ? Array.from(reassignTargets) : null, // null = back to pool
        mode: 'unstarted',
      });
      const msg =
        reassignTargets.size === 0
          ? `Returned ${r.returnedToPool} unstarted products to the pool`
          : `Moved ${r.moved} products from ${reassignSource.name ?? reassignSource.email}`;
      toast(msg);
      setReassignSource(null);
      setReassignTargets(new Set());
      await loadAll();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to reassign', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (sub: AdminSubmissionItem) => {
    setBusy(true);
    try {
      await adminReviewSubmission(sub.id, { action: 'approve' });
      toast(`Approved ${sub.product.name} — images live`);
      await loadAll();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to approve', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSavePayRate = async () => {
    const next = Number(payRateInput);
    if (!Number.isFinite(next) || next < 0) {
      toast('Pay rate must be a non-negative number', 'error');
      return;
    }
    setBusy(true);
    try {
      const r = await adminSetInternPayRate(next);
      setPayRate(r.rate);
      setPayRateInput(String(r.rate));
      toast(`Pay rate set to ₦${r.rate.toLocaleString('en-NG')} per approved product`);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleExportCsv = async () => {
    setBusy(true);
    try {
      await adminDownloadInternCsv({
        from: exportFrom ? new Date(exportFrom).toISOString() : undefined,
        // To-date inclusive — bump to end-of-day so a same-day approval
        // is captured.
        to: exportTo ? new Date(exportTo + 'T23:59:59Z').toISOString() : undefined,
        internId: exportInternId || undefined,
      });
      toast('CSV downloaded');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!pendingReject || !rejectReason.trim()) return;
    setBusy(true);
    try {
      await adminReviewSubmission(pendingReject.id, {
        action: 'reject',
        reason: rejectReason.trim(),
      });
      toast(`Rejected — intern will see the reason`);
      setPendingReject(null);
      setRejectReason('');
      await loadAll();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to reject', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Intern queue"
        subtitle="Assign image-update work, watch progress, approve submissions."
      />

      {/* Pay rate + CSV export */}
      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-white p-5">
          <p className="mb-2 flex items-center gap-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
            <Coins size={14} aria-hidden /> Pay rate per approved product
          </p>
          <p className="mb-3 font-sans text-sm text-muted">
            New submissions snapshot this rate at submit time, so changing it later
            doesn&apos;t shift what&apos;s already owed.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Rate (NGN)
              </span>
              <input
                type="number"
                min={0}
                step={50}
                value={payRateInput}
                onChange={(e) => setPayRateInput(e.target.value)}
                className="w-40 rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={handleSavePayRate}
              disabled={busy || payRateInput === String(payRate ?? '')}
              className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
            >
              Save rate
            </button>
            {payRate !== null && (
              <span className="font-sans text-xs text-muted">
                Current: ₦{payRate.toLocaleString('en-NG')}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-card border border-border bg-white p-5">
          <p className="mb-2 flex items-center gap-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
            <Download size={14} aria-hidden /> Payroll CSV export
          </p>
          <p className="mb-3 font-sans text-sm text-muted">
            One row per approved submission within the date window. Includes a
            per-intern totals header for finance.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                From
              </span>
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                To
              </span>
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Intern (optional)
              </span>
              <select
                value={exportInternId}
                onChange={(e) => setExportInternId(e.target.value)}
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              >
                <option value="">All interns</option>
                {(progress ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? p.email}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={busy}
              className="flex items-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white disabled:opacity-50"
            >
              <Download size={14} aria-hidden /> Download CSV
            </button>
          </div>
        </div>
      </section>

      {/* Bulk assign panel */}
      <section className="mb-8 rounded-card border border-border bg-white p-5">
        <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
          Bulk assign unimaged products
        </p>
        <p className="mb-3 font-sans text-sm text-muted">
          Splits every product with fewer than 3 images and no current intern across the
          interns you select below, round-robin. Existing assignments are not moved.
        </p>
        {staff === null ? (
          <p className="font-sans text-sm text-muted">Loading staff…</p>
        ) : eligibleInterns.length === 0 ? (
          <p className="rounded-input border border-warning/30 bg-warning/5 px-3 py-2 font-sans text-sm text-warning-dark">
            No interns yet. Create them in /admin/staff with role STAFF and check the
            <code className="mx-1 rounded bg-white px-1">products.image-only</code>
            capability.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2">
              {eligibleInterns.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 rounded-input border border-border bg-page px-3 py-2 hover:border-navy"
                >
                  <input
                    type="checkbox"
                    checked={assignSelection.has(s.id)}
                    onChange={() => toggleSelection(s.id)}
                    className="h-4 w-4 cursor-pointer accent-navy"
                  />
                  <span className="font-raleway text-sm font-semibold text-navy">
                    {s.name ?? '(no name)'}
                  </span>
                  <span className="font-sans text-xs text-muted">{s.email}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setConfirmAssign(true)}
              disabled={busy || assignSelection.size === 0}
              className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
            >
              <Shuffle size={14} aria-hidden /> Distribute to{' '}
              {assignSelection.size || '0'} intern{assignSelection.size === 1 ? '' : 's'}
            </button>
          </>
        )}
      </section>

      {/* Per-intern progress */}
      <section className="mb-8">
        <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
          Progress
        </p>
        {progress === null ? (
          <p className="font-sans text-sm text-muted">Loading…</p>
        ) : progress.length === 0 ? (
          <p className="rounded-card border border-border bg-white p-6 text-center font-sans text-sm text-muted">
            No interns have been assigned products yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {progress.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-card border border-border bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-raleway font-bold text-navy">
                      {p.name ?? p.email}
                    </p>
                    <p className="font-sans text-xs text-muted">{p.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReassignSource(p);
                      setReassignTargets(new Set());
                    }}
                    disabled={p.todo === 0 || busy}
                    title="Reassign their unstarted products"
                    className="flex items-center gap-1 rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page disabled:opacity-40"
                  >
                    <Shuffle size={12} aria-hidden /> Reassign
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Stat label="To do" value={p.todo} tone="muted" />
                  <Stat label="Pending" value={p.pending} tone="info" />
                  <Stat label="Approved" value={p.approved} tone="success" />
                  <Stat label="Rejected" value={p.rejected} tone="danger" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approval queue */}
      <section>
        <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
          Pending submissions
        </p>
        {submissions === null ? (
          <p className="font-sans text-sm text-muted">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="rounded-card border border-border bg-white p-6 text-center font-sans text-sm text-muted">
            Nothing awaiting review right now.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map((sub) => (
              <article
                key={sub.id}
                className="overflow-hidden rounded-card border border-border bg-white"
              >
                <header className="flex items-center justify-between gap-3 border-b border-border bg-page px-4 py-3">
                  <div>
                    <p className="font-raleway font-semibold text-navy">
                      {sub.product.name}
                    </p>
                    <p className="font-sans text-xs text-muted">
                      Submitted by {sub.intern.name ?? sub.intern.email} ·{' '}
                      {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingReject(sub)}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-btn border border-danger/40 bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-danger hover:bg-danger hover:text-white disabled:opacity-50"
                    >
                      <X size={12} aria-hidden /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(sub)}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-btn bg-success px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white hover:bg-success/80 disabled:opacity-50"
                    >
                      <Check size={12} aria-hidden /> Approve
                    </button>
                  </div>
                </header>
                <div className="grid grid-cols-3 gap-3 p-4">
                  {sub.frontImageUrl && <PreviewSlot label="Front" url={sub.frontImageUrl} />}
                  {sub.backImageUrl && <PreviewSlot label="Back" url={sub.backImageUrl} />}
                  {sub.sideImageUrl && <PreviewSlot label="Side" url={sub.sideImageUrl} />}
                </div>
                {sub.additionalImages.length > 0 && (
                  <div className="border-t border-border p-4">
                    <p className="mb-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                      + {sub.additionalImages.length} additional
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {sub.additionalImages.map((url, i) => (
                        <PreviewSlot key={i} url={url} />
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Confirm bulk-assign dialog */}
      <ConfirmDialog
        open={confirmAssign}
        title="Distribute work?"
        message={`Splits all unimaged products across the ${assignSelection.size} selected intern${assignSelection.size === 1 ? '' : 's'} round-robin. Existing assignments are untouched.`}
        confirmLabel="Distribute"
        busy={busy}
        onConfirm={handleBulkAssign}
        onCancel={() => !busy && setConfirmAssign(false)}
      />

      {/* Reject dialog */}
      {pendingReject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
          onClick={() => !busy && setPendingReject(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-card bg-white p-6 shadow-card-hover"
          >
            <h3 className="font-raleway text-lg font-bold text-navy">
              Reject submission
            </h3>
            <p className="mt-1 font-sans text-sm text-muted">
              Tell {pendingReject.intern.name ?? pendingReject.intern.email} what to fix.
            </p>
            <textarea
              autoFocus
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Front image is blurry. Need plain background, full product visible."
              className="mt-3 w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingReject(null)}
                disabled={busy}
                className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={busy || !rejectReason.trim()}
                className="rounded-btn bg-danger px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-danger/80 disabled:opacity-50"
              >
                Send rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign dialog */}
      {reassignSource && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
          onClick={() => !busy && setReassignSource(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-card bg-white p-6 shadow-card-hover"
          >
            <h3 className="font-raleway text-lg font-bold text-navy">
              Reassign unstarted work
            </h3>
            <p className="mt-1 font-sans text-sm text-muted">
              Move {reassignSource.todo} unstarted products from{' '}
              <strong>{reassignSource.name ?? reassignSource.email}</strong>. In-flight
              submissions (pending or approved) stay put so payment attribution is preserved.
            </p>
            <p className="mt-4 mb-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              Move to (round-robin)
            </p>
            <div className="flex flex-col gap-1">
              {eligibleInterns
                .filter((s) => s.id !== reassignSource.id)
                .map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-input border border-border bg-page px-3 py-1.5 hover:border-navy"
                  >
                    <input
                      type="checkbox"
                      checked={reassignTargets.has(s.id)}
                      onChange={() =>
                        setReassignTargets((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        })
                      }
                      className="h-4 w-4 cursor-pointer accent-navy"
                    />
                    <span className="font-sans text-sm">{s.name ?? s.email}</span>
                  </label>
                ))}
            </div>
            <p className="mt-3 font-sans text-[11px] text-muted">
              Leave all unticked to return them to the unassigned pool.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignSource(null)}
                disabled={busy}
                className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                disabled={busy}
                className="flex items-center gap-1 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
              >
                Reassign <ArrowRight size={12} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'muted' | 'info' | 'success' | 'danger';
}) {
  const colorClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'danger'
        ? 'text-danger'
        : tone === 'info'
          ? 'text-info'
          : 'text-charcoal';
  return (
    <div className="flex flex-col rounded-md bg-page py-2">
      <span className={`font-raleway text-xl font-bold ${colorClass}`}>{value}</span>
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </span>
    </div>
  );
}

function PreviewSlot({ label, url }: { label?: string; url: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          {label}
        </span>
      )}
      <a href={url} target="_blank" rel="noreferrer">
        <div className="relative aspect-square overflow-hidden rounded-card border border-border bg-page">
          <Image src={url} alt={label ?? ''} fill sizes="200px" className="object-cover" />
        </div>
      </a>
    </div>
  );
}
