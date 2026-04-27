'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { OrderStatusPill } from '@/components/admin/OrderStatusPill';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminAddOrderNote,
  adminGetOrder,
  adminRecordOrderRefund,
  adminUpdateOrderStatus,
  type AdminOrderDetail,
  type AdminOrderEvent,
} from '@/lib/api/admin';
import type { OrderStatus } from '@/lib/api/orders';
import { formatPriceNGN } from '@/lib/format';
import { getCountry } from '@/lib/countries';

interface PageProps {
  params: { id: string };
}

const ALL_STATUSES: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'FULFILLING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

export default function AdminOrderDetailPage({ params }: PageProps) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Status changer
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);

  // Note composer
  const [noteText, setNoteText] = useState('');
  const [noteVisible, setNoteVisible] = useState(false);

  // Refund dialog
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const load = async () => {
    try {
      setOrder(await adminGetOrder(params.id));
      setError(null);
    } catch (e) {
      if (e instanceof HttpApiError && e.status === 404) {
        setError('Order not found.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load order');
      }
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const country = order ? getCountry(order.shipCountry) : null;
  const remaining = order ? order.total - order.refundedTotal : 0;

  const handleApplyStatus = async () => {
    if (!order || !pendingStatus) return;
    setBusy(true);
    try {
      await adminUpdateOrderStatus(order.id, {
        status: pendingStatus,
        note: statusNote.trim() || undefined,
      });
      toast(`Status set to ${pendingStatus}`);
      setStatusOpen(false);
      setStatusNote('');
      setPendingStatus('');
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to update status', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async () => {
    if (!order || !noteText.trim()) return;
    setBusy(true);
    try {
      await adminAddOrderNote(order.id, {
        text: noteText.trim(),
        isCustomerVisible: noteVisible,
      });
      toast(noteVisible ? 'Note posted to customer' : 'Private note added');
      setNoteText('');
      setNoteVisible(false);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to add note', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast('Enter a positive refund amount', 'error');
      return;
    }
    setBusy(true);
    try {
      await adminRecordOrderRefund(order.id, {
        amount,
        reason: refundReason.trim() || undefined,
      });
      toast(`Recorded refund of ${formatPriceNGN(amount)}`);
      setRefundOpen(false);
      setRefundAmount('');
      setRefundReason('');
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to record refund', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/orders"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-xs font-semibold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ChevronLeft size={14} aria-hidden /> Orders
      </Link>

      {error && (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-4 font-sans text-sm text-danger">
          {error}
        </div>
      )}

      {!error && !order && <p className="font-sans text-sm text-muted">Loading order…</p>}

      {order && (
        <>
          <AdminPageHeader
            title={order.orderNumber}
            subtitle={`Placed ${new Date(order.createdAt).toLocaleString()} · ${order.user?.email ?? '—'}`}
            action={<OrderStatusPill status={order.status} />}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {/* LEFT — items + events */}
            <div className="flex flex-col gap-5 lg:col-span-8">
              <Panel title="Items" subtitle={`${order.items.length} line${order.items.length === 1 ? '' : 's'}`}>
                <ul className="flex flex-col divide-y divide-border">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/product/${it.productSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-raleway text-sm font-semibold text-navy hover:text-amber"
                        >
                          {it.productName}
                        </Link>
                        <span className="font-sans text-xs text-muted">
                          {formatPriceNGN(it.unitPrice)} × {it.quantity}
                        </span>
                      </div>
                      <span className="font-raleway text-sm font-bold text-navy">
                        {formatPriceNGN(it.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 font-sans text-sm">
                  <Line label="Subtotal" value={formatPriceNGN(order.subtotal)} />
                  {order.couponCode && order.couponDiscount > 0 && (
                    <Line
                      label={`Coupon (${order.couponCode})`}
                      value={`−${formatPriceNGN(order.couponDiscount)}`}
                      tone="danger"
                    />
                  )}
                  <Line label="Shipping" value={formatPriceNGN(order.shippingCost)} />
                  <Line label="Total" value={formatPriceNGN(order.total)} bold />
                  {order.refundedTotal > 0 && (
                    <Line
                      label="Refunded"
                      value={`−${formatPriceNGN(order.refundedTotal)}`}
                      tone="danger"
                    />
                  )}
                  {order.refundedTotal > 0 && order.refundedTotal < order.total && (
                    <Line
                      label="Net to customer"
                      value={formatPriceNGN(order.total - order.refundedTotal)}
                      bold
                    />
                  )}
                </dl>
              </Panel>

              <Panel title="Activity" subtitle="Status changes, notes, and refunds — newest first">
                {order.events.length === 0 ? (
                  <p className="font-sans text-sm text-muted">No activity yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {order.events.map((e) => (
                      <EventLine key={e.id} event={e} />
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Add a note">
                <textarea
                  value={noteText}
                  onChange={(ev) => setNoteText(ev.target.value)}
                  rows={3}
                  placeholder="Internal note or message to the customer…"
                  className="w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                    <input
                      type="checkbox"
                      checked={noteVisible}
                      onChange={(ev) => setNoteVisible(ev.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-navy"
                    />
                    {noteVisible ? (
                      <span className="inline-flex items-center gap-1">
                        <Eye size={13} aria-hidden /> Visible to customer
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <EyeOff size={13} aria-hidden /> Private (staff only)
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={busy || !noteText.trim()}
                    className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MessageCircle size={14} aria-hidden /> Post note
                  </button>
                </div>
              </Panel>
            </div>

            {/* RIGHT — actions + customer + shipping + payment */}
            <div className="flex flex-col gap-5 lg:col-span-4">
              <Panel title="Status" subtitle={`Allowed transitions are enforced server-side`}>
                <div className="flex items-center gap-2">
                  <select
                    value={pendingStatus}
                    onChange={(e) => setPendingStatus(e.target.value as OrderStatus | '')}
                    className="flex-1 rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
                  >
                    <option value="">Change to…</option>
                    {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ').toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setStatusOpen(true)}
                    disabled={!pendingStatus}
                    className="rounded-btn bg-navy px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundOpen(true)}
                  disabled={remaining <= 0 || order.status === 'PENDING_PAYMENT'}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-btn border border-danger/40 bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={14} aria-hidden /> Refund {formatPriceNGN(remaining)}
                </button>
              </Panel>

              <Panel title="Customer">
                <div className="font-sans text-sm leading-relaxed text-charcoal">
                  <p className="font-raleway font-semibold text-navy">
                    {order.user?.name ?? order.shipFullName}
                  </p>
                  {order.user?.email && <p className="text-muted">{order.user.email}</p>}
                  {order.user && (
                    <p className="mt-1 text-[11px] text-muted">
                      Member since {new Date(order.user.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Panel>

              <Panel title="Shipping">
                <address className="not-italic font-sans text-sm leading-relaxed text-charcoal">
                  <strong className="font-raleway font-semibold text-navy">{order.shipFullName}</strong>
                  <br />
                  {order.shipAddressLine}
                  <br />
                  {order.shipCity}
                  {country ? `, ${country.name}` : ` · ${order.shipCountry}`}
                  <br />
                  <span className="text-muted">{order.shipPhone}</span>
                </address>
              </Panel>

              <Panel title="Payment">
                <p className="font-sans text-sm text-charcoal">{order.paymentMethod}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  Ref: {order.paymentRef ?? '—'}
                </p>
              </Panel>
            </div>
          </div>

          <ConfirmDialog
            open={statusOpen}
            title="Change order status"
            message={`Move ${order.orderNumber} from ${order.status} to ${pendingStatus}? This is logged in the activity timeline.`}
            confirmLabel="Apply"
            busy={busy}
            onConfirm={handleApplyStatus}
            onCancel={() => !busy && setStatusOpen(false)}
          />

          {refundOpen && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
              onClick={() => !busy && setRefundOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-card bg-white p-6 shadow-card-hover"
              >
                <h2 className="font-raleway text-lg font-bold text-navy">Record a refund</h2>
                <p className="mt-1 font-sans text-xs text-muted">
                  Records the refund against the order. Actual money return will be triggered by
                  the gateway integration once it lands. Max refundable: {formatPriceNGN(remaining)}.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
                      Amount (NGN)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={remaining}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
                      Reason
                    </span>
                    <textarea
                      rows={3}
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                    />
                  </label>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => !busy && setRefundOpen(false)}
                    disabled={busy}
                    className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRefund}
                    disabled={busy || !refundAmount}
                    className="rounded-btn bg-danger px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-danger/90 disabled:opacity-50"
                  >
                    {busy ? 'Recording…' : 'Record refund'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
      <header className="flex flex-col gap-0.5 border-b border-border pb-3">
        <h2 className="font-raleway text-base font-bold text-navy">{title}</h2>
        {subtitle && <p className="font-sans text-xs text-muted">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Line({
  label,
  value,
  bold = false,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: 'danger';
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={tone === 'danger' ? 'text-danger' : 'text-muted'}>{label}</dt>
      <dd
        className={`${bold ? 'font-raleway font-bold text-navy' : ''} ${
          tone === 'danger' ? 'text-danger' : 'text-charcoal'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function EventLine({ event }: { event: AdminOrderEvent }) {
  const at = new Date(event.createdAt).toLocaleString();
  const payload = event.payload as Record<string, unknown>;

  let title: React.ReactNode = event.type;
  let body: React.ReactNode = null;

  if (event.type === 'STATUS_CHANGED') {
    title = (
      <>
        Status changed{' '}
        <span className="font-mono text-xs text-muted">
          {String(payload.from)} → {String(payload.to)}
        </span>
      </>
    );
    if (payload.note) body = <p className="font-sans text-xs text-charcoal">{String(payload.note)}</p>;
  } else if (event.type === 'NOTE') {
    title = (
      <>
        Note{' '}
        {event.isCustomerVisible ? (
          <span className="rounded-full bg-navy/10 px-1.5 py-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn text-navy">
            Customer
          </span>
        ) : (
          <span className="rounded-full bg-border px-1.5 py-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn text-muted">
            Private
          </span>
        )}
      </>
    );
    body = (
      <p className="whitespace-pre-wrap font-sans text-xs text-charcoal">
        {String(payload.text ?? '')}
      </p>
    );
  } else if (event.type === 'REFUND_RECORDED') {
    title = <>Refund recorded</>;
    body = (
      <p className="font-sans text-xs text-charcoal">
        ₦{Number(payload.amount).toLocaleString()}
        {payload.reason ? ` — ${String(payload.reason)}` : ''}
        {payload.fullyRefunded ? ' · order fully refunded' : ''}
      </p>
    );
  } else if (event.type === 'CANCELLED') {
    title = <>Order cancelled</>;
    if (payload.note) body = <p className="font-sans text-xs text-charcoal">{String(payload.note)}</p>;
  }

  return (
    <li className="rounded-card border border-border bg-page p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-raleway text-sm font-semibold text-navy">{title}</p>
        <span className="font-sans text-[10px] text-muted">{at}</span>
      </div>
      {body && <div className="mt-1">{body}</div>}
    </li>
  );
}
