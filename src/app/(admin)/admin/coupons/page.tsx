'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminListCoupons,
  adminUpdateCoupon,
  type AdminCoupon,
  type AdminCouponInput,
  type CouponType,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';

const TYPE_LABELS: Record<CouponType, string> = {
  PERCENT_CART: 'Percent off cart',
  FIXED_CART: 'Fixed amount off',
  FREE_SHIPPING: 'Free shipping',
};

export default function AdminCouponsPage() {
  const [items, setItems] = useState<AdminCoupon[] | null>(null);
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCoupon | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    adminListCoupons()
      .then((r) => setItems(r.items))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteCoupon(pendingDelete.id);
      toast(`Deleted ${pendingDelete.code}`);
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminCoupon>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (c) => (
        <button
          type="button"
          onClick={() => setEditing(c)}
          className="font-mono font-bold text-navy hover:text-amber"
        >
          {c.code}
        </button>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => (
        <div className="flex flex-col leading-tight">
          <span className="text-charcoal">{TYPE_LABELS[c.type]}</span>
          <span className="font-sans text-[11px] text-muted">
            {c.type === 'PERCENT_CART' && `${c.valuePercent}% off`}
            {c.type === 'FIXED_CART' && c.valueAmount && formatPriceNGN(c.valueAmount) + ' off'}
            {c.type === 'FREE_SHIPPING' && 'No shipping fee'}
          </span>
        </div>
      ),
    },
    {
      key: 'min',
      header: 'Min subtotal',
      render: (c) => (
        <span className="text-charcoal">
          {c.minSubtotal ? formatPriceNGN(c.minSubtotal) : '—'}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Uses',
      render: (c) => (
        <span className="text-charcoal">
          {c.usageCount} / {c.maxUses ?? '∞'}
        </span>
      ),
    },
    {
      key: 'window',
      header: 'Active window',
      render: (c) => (
        <span className="font-sans text-[11px] text-charcoal">
          {c.startsAt ? new Date(c.startsAt).toLocaleDateString() : 'now'} →{' '}
          {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : 'forever'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      render: (c) =>
        c.isActive ? (
          <span className="rounded-full bg-success/15 px-2 py-0.5 font-sans text-[11px] font-bold text-success">
            Yes
          </span>
        ) : (
          <span className="rounded-full bg-border/50 px-2 py-0.5 font-sans text-[11px] font-bold text-muted">
            Off
          </span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(c)}
            className="rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPendingDelete(c)}
            className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
            aria-label="Delete"
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
        title="Discounts"
        subtitle={items ? `${items.length} coupons` : 'Loading…'}
        action={
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
          >
            <Plus size={14} aria-hidden /> New coupon
          </button>
        }
      />

      <DataTable
        rows={items ?? []}
        columns={columns}
        rowKey={(c) => c.id}
        loading={items === null}
        emptyState="No coupons yet."
      />

      {editing !== null && (
        <CouponDialog
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete coupon"
        message={
          pendingDelete
            ? `Delete ${pendingDelete.code}? Coupons with redemptions cannot be deleted — deactivate instead.`
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

function CouponDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: AdminCoupon | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<CouponType>(initial?.type ?? 'PERCENT_CART');
  const [valuePercent, setValuePercent] = useState(
    initial?.valuePercent != null ? String(initial.valuePercent) : '10',
  );
  const [valueAmount, setValueAmount] = useState(
    initial?.valueAmount != null ? String(initial.valueAmount) : '',
  );
  const [minSubtotal, setMinSubtotal] = useState(
    initial?.minSubtotal != null ? String(initial.minSubtotal) : '',
  );
  const [maxUses, setMaxUses] = useState(initial?.maxUses != null ? String(initial.maxUses) : '');
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState(
    initial?.maxUsesPerCustomer != null ? String(initial.maxUsesPerCustomer) : '',
  );
  const [startsAt, setStartsAt] = useState(
    initial?.startsAt ? initial.startsAt.slice(0, 16) : '',
  );
  const [endsAt, setEndsAt] = useState(initial?.endsAt ? initial.endsAt.slice(0, 16) : '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const input: AdminCouponInput = {
      code: code.trim(),
      description: description.trim() || null,
      type,
      valuePercent: type === 'PERCENT_CART' && valuePercent ? Number(valuePercent) : null,
      valueAmount: type === 'FIXED_CART' && valueAmount ? Number(valueAmount) : null,
      minSubtotal: minSubtotal ? Number(minSubtotal) : null,
      maxUses: maxUses ? Number(maxUses) : null,
      maxUsesPerCustomer: maxUsesPerCustomer ? Number(maxUsesPerCustomer) : null,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      isActive,
    };
    try {
      if (initial) {
        await adminUpdateCoupon(initial.id, input);
        toast(`Saved ${input.code}`);
      } else {
        await adminCreateCoupon(input);
        toast(`Created ${input.code.toUpperCase()}`);
      }
      await onSaved();
    } catch (err) {
      setError(err instanceof HttpApiError ? err.message : err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
      onClick={() => !busy && onClose()}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card bg-white shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="font-raleway text-lg font-bold text-navy">
            {initial ? `Edit ${initial.code}` : 'New coupon'}
          </h2>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-charcoal disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <Field label="Code" required>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={Boolean(initial)}
              className={`${input} font-mono uppercase ${initial ? 'opacity-60' : ''}`}
              placeholder="e.g. LAUNCH10"
              pattern="[A-Za-z0-9_-]+"
            />
          </Field>
          <Field label="Description">
            <input
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              className={input}
              placeholder="Internal note for staff"
            />
          </Field>
          <Field label="Type" required>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
              className={input}
            >
              <option value="PERCENT_CART">Percent off cart</option>
              <option value="FIXED_CART">Fixed amount off cart</option>
              <option value="FREE_SHIPPING">Free shipping</option>
            </select>
          </Field>

          {type === 'PERCENT_CART' && (
            <Field label="Percent off (1–100)" required>
              <input
                required
                type="number"
                min={1}
                max={100}
                value={valuePercent}
                onChange={(e) => setValuePercent(e.target.value)}
                className={input}
              />
            </Field>
          )}
          {type === 'FIXED_CART' && (
            <Field label="Amount off (NGN)" required>
              <input
                required
                type="number"
                min={1}
                value={valueAmount}
                onChange={(e) => setValueAmount(e.target.value)}
                className={input}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min subtotal (NGN)">
              <input
                type="number"
                min={0}
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Max total uses">
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Max uses per customer">
              <input
                type="number"
                min={1}
                value={maxUsesPerCustomer}
                onChange={(e) => setMaxUsesPerCustomer(e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Starts at">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Ends at">
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={input}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-input border border-border bg-page px-3 py-2.5 font-sans text-sm text-charcoal">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-navy"
            />
            Active
          </label>

          {error && (
            <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-page px-6 py-3">
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            {busy ? 'Saving…' : initial ? 'Save' : 'Create'}
          </button>
        </footer>
      </form>
    </div>
  );
}

const input =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
