'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { OrderStatusPill } from '@/components/admin/OrderStatusPill';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminGetCustomer,
  adminUpdateCustomer,
  type AdminCustomerDetail,
  type CustomerRole,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';

interface PageProps {
  params: { id: string };
}

const ROLES: CustomerRole[] = ['CUSTOMER', 'SELLER', 'ADMIN'];

export default function AdminCustomerDetailPage({ params }: PageProps) {
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<CustomerRole>('CUSTOMER');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const c = await adminGetCustomer(params.id);
      setCustomer(c);
      setName(c.name ?? '');
      setRole(c.role);
    } catch (e) {
      if (e instanceof HttpApiError && e.status === 404) {
        setError('Customer not found.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load customer');
      }
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSave = async () => {
    if (!customer) return;
    setBusy(true);
    try {
      await adminUpdateCustomer(customer.id, {
        name: name.trim() || null,
        role,
      });
      toast('Customer updated');
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const dirty =
    customer != null &&
    ((customer.name ?? '') !== name.trim() || customer.role !== role);

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/customers"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-xs font-semibold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ChevronLeft size={14} aria-hidden /> Customers
      </Link>

      {error && (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-4 font-sans text-sm text-danger">
          {error}
        </div>
      )}
      {!error && !customer && (
        <p className="font-sans text-sm text-muted">Loading customer…</p>
      )}

      {customer && (
        <>
          <AdminPageHeader
            title={customer.name ?? customer.email}
            subtitle={`Member since ${new Date(customer.createdAt).toLocaleDateString()} · ${customer.email}`}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col gap-5 lg:col-span-8">
              <Panel title="Lifetime stats">
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Orders" value={customer.orderCount.toString()} />
                  <Stat
                    label="Lifetime value"
                    value={formatPriceNGN(customer.totalSpent)}
                  />
                  <Stat
                    label="Last order"
                    value={
                      customer.lastOrderAt
                        ? new Date(customer.lastOrderAt).toLocaleDateString()
                        : '—'
                    }
                  />
                </div>
              </Panel>

              <Panel
                title="Recent orders"
                subtitle={`Last ${customer.recentOrders.length} of ${customer.orderCount}`}
              >
                {customer.recentOrders.length === 0 ? (
                  <p className="font-sans text-sm text-muted">No orders yet.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border">
                    {customer.recentOrders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex flex-col leading-tight">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="font-raleway font-semibold text-navy hover:text-amber"
                          >
                            {o.orderNumber}
                          </Link>
                          <span className="font-sans text-[11px] text-muted">
                            {new Date(o.createdAt).toLocaleString()} ·{' '}
                            {o._count?.items ?? 0} item{(o._count?.items ?? 0) === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <OrderStatusPill status={o.status} />
                          <span className="font-raleway text-sm font-bold text-navy">
                            {formatPriceNGN(o.total)}
                          </span>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="text-muted hover:text-navy"
                            aria-label="Open order"
                          >
                            <ChevronRight size={14} aria-hidden />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-4">
              <Panel title="Profile" subtitle="Editable fields">
                <label className="flex flex-col gap-1.5">
                  <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                    Name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                    Role
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as CustomerRole)}
                    className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || busy}
                  className="flex items-center justify-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={13} aria-hidden /> {busy ? 'Saving…' : 'Save'}
                </button>
              </Panel>

              <Panel title="Account">
                <dl className="flex flex-col gap-2 font-sans text-sm">
                  <Line label="Email" value={customer.email} />
                  <Line
                    label="Joined"
                    value={new Date(customer.createdAt).toLocaleString()}
                  />
                  <Line label="ID" value={customer.id} mono />
                </dl>
              </Panel>
            </div>
          </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-page p-3">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </span>
      <span className="font-raleway text-xl font-bold text-navy">{value}</span>
    </div>
  );
}

function Line({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right ${mono ? 'font-mono text-[11px] text-charcoal' : 'text-charcoal'}`}>
        {value}
      </dd>
    </div>
  );
}
