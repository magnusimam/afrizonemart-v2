'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, PackageCheck, ShoppingCart, Truck } from 'lucide-react';
import {
  acknowledgePurchaseOrder,
  fulfillPurchaseOrder,
  getPurchaseOrders,
  type PurchaseOrder,
} from '@/lib/api/supplier';

/**
 * Stage 9 — Procurement & Trade. The supplier sees purchase orders AZM has
 * issued, acknowledges them, and marks them fulfilled once shipped.
 */

const STATUS: Record<string, { label: string; cls: string }> = {
  ISSUED: { label: 'New — action needed', cls: 'bg-amber-light text-amber-dark' },
  ACKNOWLEDGED: { label: 'Acknowledged', cls: 'bg-navy-light text-navy' },
  FULFILLED: { label: 'Fulfilled', cls: 'bg-success/10 text-success' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-page text-muted' },
};

function money(currency: string, n: number) {
  return `${currency} ${n.toLocaleString()}`;
}

export function Stage9TradeEngagement() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['supplier', 'purchase-orders'],
    queryFn: getPurchaseOrders,
    retry: false,
  });

  const ack = useMutation({
    mutationFn: (id: string) => acknowledgePurchaseOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplier', 'purchase-orders'] }),
  });
  const fulfill = useMutation({
    mutationFn: (id: string) => fulfillPurchaseOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplier', 'purchase-orders'] }),
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-card bg-white shadow-card" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-start gap-3 rounded-card border border-border bg-white p-5 shadow-card">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-light text-navy">
          <ShoppingCart size={20} aria-hidden />
        </span>
        <div>
          <h2 className="font-raleway text-lg font-bold text-navy">Purchase orders</h2>
          <p className="mt-1 max-w-lg font-sans text-sm leading-relaxed text-muted">
            As an activated supplier you receive purchase orders directly from
            AZM Procurement. Acknowledge each one, then mark it fulfilled when
            you’ve shipped.
          </p>
        </div>
      </section>

      {!orders || orders.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-white p-8 text-center">
          <PackageCheck size={28} aria-hidden className="mx-auto text-muted" />
          <p className="mt-2 font-raleway text-sm font-bold text-navy">No purchase orders yet</p>
          <p className="mt-1 font-sans text-sm text-muted">
            When AZM Procurement places an order, it’ll appear here and you’ll get an email.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((po) => (
            <POCard
              key={po.id}
              po={po}
              onAck={() => ack.mutate(po.id)}
              onFulfill={() => fulfill.mutate(po.id)}
              busy={(ack.isPending && ack.variables === po.id) || (fulfill.isPending && fulfill.variables === po.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function POCard({ po, onAck, onFulfill, busy }: { po: PurchaseOrder; onAck: () => void; onFulfill: () => void; busy: boolean }) {
  const s = STATUS[po.status] ?? STATUS.ISSUED;
  return (
    <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <p className="font-raleway text-sm font-bold text-navy">{po.poNumber}</p>
          <p className="font-sans text-xs text-muted">
            Issued {new Date(po.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {po.dueDate ? ` · due ${new Date(po.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 font-raleway text-xs font-bold ${s.cls}`}>{s.label}</span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-page">
            <tr className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
              <th className="px-5 py-2">Product</th>
              <th className="px-5 py-2 text-right">Qty</th>
              <th className="px-5 py-2 text-right">Unit price</th>
              <th className="px-5 py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {po.items.map((it, i) => (
              <tr key={i} className="font-sans text-charcoal">
                <td className="px-5 py-2">{it.product ?? '—'}</td>
                <td className="px-5 py-2 text-right">{it.qty ?? 0}{it.unit ? ` ${it.unit}` : ''}</td>
                <td className="px-5 py-2 text-right">{money(po.currency, Number(it.unitPrice) || 0)}</td>
                <td className="px-5 py-2 text-right">{money(po.currency, (Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-raleway text-sm font-bold text-navy">
              <td className="px-5 py-2" colSpan={3}>Total</td>
              <td className="px-5 py-2 text-right">{money(po.currency, po.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {po.notes && <p className="border-t border-border px-5 py-3 font-sans text-sm text-charcoal">{po.notes}</p>}

      {(po.status === 'ISSUED' || po.status === 'ACKNOWLEDGED') && (
        <div className="flex justify-end gap-3 border-t border-border px-5 py-3">
          {po.status === 'ISSUED' && (
            <button type="button" onClick={onAck} disabled={busy} className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-60">
              {busy ? <Loader2 size={15} aria-hidden className="animate-spin" /> : <CheckCircle2 size={15} aria-hidden />} Acknowledge order
            </button>
          )}
          {po.status === 'ACKNOWLEDGED' && (
            <button type="button" onClick={onFulfill} disabled={busy} className="inline-flex items-center gap-2 rounded-btn bg-success px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:brightness-110 disabled:opacity-60">
              {busy ? <Loader2 size={15} aria-hidden className="animate-spin" /> : <Truck size={15} aria-hidden />} Mark fulfilled
            </button>
          )}
        </div>
      )}
    </section>
  );
}
