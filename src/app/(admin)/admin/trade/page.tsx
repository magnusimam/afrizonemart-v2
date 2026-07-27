'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, Rocket, ShoppingCart, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  cancelPurchaseOrder,
  getAdminPurchaseOrders,
  getAllSuppliers,
  getListings,
  issuePurchaseOrder,
  publishListing,
  type AdminListing,
  type AdminPO,
  type AdminPOItem,
  type AdminSupplier,
} from '@/lib/api/admin-suppliers';

type Tab = 'listings' | 'orders';

export default function AdminTradePage() {
  const [tab, setTab] = useState<Tab>('listings');
  return (
    <div>
      <AdminPageHeader
        title="Activation & trade"
        subtitle="Publish supplier listings and issue purchase orders to activated suppliers."
      />
      <div className="mb-5 flex gap-2">
        <TabBtn active={tab === 'listings'} onClick={() => setTab('listings')}>Listings</TabBtn>
        <TabBtn active={tab === 'orders'} onClick={() => setTab('orders')}>Purchase orders</TabBtn>
      </div>
      {tab === 'listings' ? <ListingsTab /> : <OrdersTab />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-btn px-4 py-2 font-raleway text-sm font-bold tracking-btn transition-colors ${active ? 'bg-navy text-white' : 'border border-border text-muted hover:border-navy hover:text-navy'}`}>
      {children}
    </button>
  );
}

function ListingsTab() {
  const [rows, setRows] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getListings()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reload]);

  const publish = async (l: AdminListing) => {
    try {
      await publishListing(l.supplierId);
      toast(`${l.company} published & advanced to Stage 9`);
      setReload((n) => n + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed', 'error');
    }
  };

  if (loading) return <p className="font-sans text-sm text-muted">Loading…</p>;
  if (rows.length === 0) return <p className="font-sans text-sm text-muted">No listing submissions yet.</p>;

  return (
    <div className="space-y-4">
      {rows.map((l) => (
        <div key={l.supplierId} className="rounded-card border border-border bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-raleway text-sm font-bold text-navy">{l.company}</p>
              <p className="font-sans text-xs text-muted">{l.email} · {l.category} · submitted {new Date(l.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
            </div>
            {l.publishedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 font-raleway text-xs font-bold text-success"><CheckCircle2 size={13} aria-hidden /> Published</span>
            ) : (
              <button type="button" onClick={() => publish(l)} className="inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-1.5 font-raleway text-xs font-bold tracking-btn text-white hover:bg-navy-dark">
                <Rocket size={14} aria-hidden /> Publish listing
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(l.photos).map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="group">
                <img src={url} alt={k} className="h-20 w-20 rounded-card border border-border object-cover" />
                <p className="mt-0.5 text-center font-sans text-[10px] text-muted">{k}</p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersTab() {
  const [rows, setRows] = useState<AdminPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminPurchaseOrders()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reload]);

  const cancel = async (po: AdminPO) => {
    try { await cancelPurchaseOrder(po.id); toast(`${po.poNumber} cancelled`); setReload((n) => n + 1); }
    catch (e) { toast(e instanceof HttpApiError ? e.message : 'Failed', 'error'); }
  };

  return (
    <>
      <div className="mb-4">
        <button type="button" onClick={() => setIssuing(true)} className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark">
          <Plus size={15} aria-hidden /> Issue purchase order
        </button>
      </div>
      {loading ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="font-sans text-sm text-muted">No purchase orders issued yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-border bg-page">
              <tr className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                <th className="px-4 py-3">PO</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((po) => (
                <tr key={po.id} className="font-sans text-sm hover:bg-page">
                  <td className="px-4 py-3 font-semibold text-navy">{po.poNumber}</td>
                  <td className="px-4 py-3">{po.company}<div className="text-xs text-muted">{po.email}</div></td>
                  <td className="px-4 py-3 text-right">{po.currency} {po.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-navy-light px-2.5 py-0.5 font-raleway text-xs font-bold text-navy">{po.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {po.status !== 'FULFILLED' && po.status !== 'CANCELLED' && (
                      <button type="button" onClick={() => cancel(po)} className="font-raleway text-xs font-semibold text-muted hover:text-danger">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {issuing && <IssuePOModal onClose={() => setIssuing(false)} onDone={() => { setIssuing(false); setReload((n) => n + 1); }} />}
    </>
  );
}

function IssuePOModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<AdminPOItem[]>([{ product: '', qty: undefined, unit: '', unitPrice: undefined }]);
  const [currency, setCurrency] = useState('NGN');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAllSuppliers().then((s) => setSuppliers(s.filter((x) => x.currentStage >= 9))).catch(() => {});
  }, []);

  const total = useMemo(() => items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0), [items]);

  const submit = async () => {
    if (!supplierId) return toast('Select a supplier.', 'error');
    const clean = items.filter((it) => it.product && (Number(it.qty) || 0) > 0);
    if (clean.length === 0) return toast('Add at least one line item.', 'error');
    setBusy(true);
    try {
      await issuePurchaseOrder(supplierId, { items: clean, currency, dueDate: dueDate || undefined, notes: notes || undefined });
      toast('Purchase order issued & supplier notified');
      onDone();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed', 'error');
    } finally { setBusy(false); }
  };

  const setItem = (i: number, patch: Partial<AdminPOItem>) =>
    setItems((arr) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 py-8">
      <div className="w-full max-w-2xl rounded-card bg-white shadow-card-hover">
        <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={20} aria-hidden className="text-navy" />
            <h2 className="font-raleway text-lg font-bold text-navy">Issue purchase order</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-page"><X size={18} aria-hidden /></button>
        </header>
        <div className="space-y-4 px-6 py-4">
          <Field label="Supplier (activated)">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputCls}>
              <option value="">Select a supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.company}</option>)}
            </select>
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Line items</span>
              <button type="button" onClick={() => setItems((a) => [...a, { product: '', qty: undefined, unit: '', unitPrice: undefined }])} className="inline-flex items-center gap-1 font-raleway text-xs font-bold text-navy hover:text-amber-dark"><Plus size={13} aria-hidden /> Add</button>
            </div>
            <div className="mt-2 space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input value={it.product ?? ''} onChange={(e) => setItem(i, { product: e.target.value })} placeholder="Product" className={inputCls + ' col-span-5'} />
                  <input type="number" value={it.qty ?? ''} onChange={(e) => setItem(i, { qty: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Qty" className={inputCls + ' col-span-2'} />
                  <input value={it.unit ?? ''} onChange={(e) => setItem(i, { unit: e.target.value })} placeholder="Unit" className={inputCls + ' col-span-2'} />
                  <input type="number" value={it.unitPrice ?? ''} onChange={(e) => setItem(i, { unitPrice: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Price" className={inputCls + ' col-span-2'} />
                  <button type="button" onClick={() => setItems((a) => a.filter((_, j) => j !== i))} aria-label="Remove" className="col-span-1 flex items-center justify-center text-muted hover:text-danger"><Trash2 size={15} aria-hidden /></button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-right font-raleway text-sm font-bold text-navy">Total: {currency} {total.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Currency"><input value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} /></Field>
            <Field label="Due date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Notes (sent to supplier)"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-btn border border-border px-4 py-2 font-raleway text-sm font-bold text-muted hover:border-navy hover:text-navy">Cancel</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-60">
            <ShoppingCart size={15} aria-hidden /> {busy ? 'Issuing…' : 'Issue & notify'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-amber focus:outline-none';
