'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { OrderStatusPill } from '@/components/admin/OrderStatusPill';
import { toast } from '@/components/admin/Toast';
import { adminListOrders, type AdminOrderListItem } from '@/lib/api/admin';
import type { OrderStatus } from '@/lib/api/orders';
import { formatPriceNGN } from '@/lib/format';

const STATUS_OPTIONS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING_PAYMENT', label: 'Pending payment' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FULFILLING', label: 'Fulfilling' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [data, setData] = useState<{
    items: AdminOrderListItem[];
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListOrders({
          page,
          limit: 25,
          q: debouncedQ || undefined,
          status: status || undefined,
        });
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load orders', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQ, status]);

  const columns: Column<AdminOrderListItem>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (o) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/orders/${o.id}`}
            className="font-raleway font-semibold text-navy hover:text-amber"
          >
            {o.orderNumber}
          </Link>
          <span className="font-sans text-[11px] text-muted">
            {new Date(o.createdAt).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div className="flex flex-col leading-tight">
          <span className="text-charcoal">{o.user?.name ?? o.shipFullName}</span>
          <span className="font-sans text-[11px] text-muted">{o.user?.email ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <OrderStatusPill status={o.status} />,
    },
    {
      key: 'items',
      header: 'Items',
      render: (o) => <span className="text-charcoal">{o._count?.items ?? 0}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      className: 'whitespace-nowrap',
      render: (o) => (
        <div className="flex flex-col leading-tight">
          <span className="font-raleway font-semibold text-navy">{formatPriceNGN(o.total)}</span>
          {o.refundedTotal > 0 && (
            <span className="font-sans text-[11px] text-danger">
              −{formatPriceNGN(o.refundedTotal)} refunded
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ship',
      header: 'Ship to',
      render: (o) => (
        <span className="text-charcoal">
          {o.shipCity}, {o.shipCountry}
        </span>
      ),
    },
    {
      key: 'open',
      header: '',
      className: 'text-right',
      render: (o) => (
        <Link
          href={`/admin/orders/${o.id}`}
          className="inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:text-amber"
        >
          Open <ChevronRight size={13} aria-hidden />
        </Link>
      ),
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Orders"
        subtitle={data ? `${data.pagination.total.toLocaleString()} total` : 'Loading…'}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order number, customer name or email…"
            className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | OrderStatus)}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        rowKey={(o) => o.id}
        loading={loading}
        emptyState="No orders match these filters."
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
    </div>
  );
}
