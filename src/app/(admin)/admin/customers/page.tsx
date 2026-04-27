'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminListCustomers,
  type AdminCustomerListItem,
  type CustomerRole,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';

const ROLE_OPTIONS: { value: '' | CustomerRole; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [role, setRole] = useState<'' | CustomerRole>('');
  const [sort, setSort] = useState<'newest' | 'name-asc' | 'spend-desc'>('newest');
  const [data, setData] = useState<{
    items: AdminCustomerListItem[];
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, role, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListCustomers({
          page,
          limit: 25,
          q: debouncedQ || undefined,
          role: role || undefined,
          sort,
        });
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQ, role, sort]);

  const columns: Column<AdminCustomerListItem>[] = [
    {
      key: 'who',
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 font-raleway text-xs font-bold text-navy">
            {(c.name?.[0] ?? c.email[0]).toUpperCase()}
          </span>
          <div className="flex flex-col leading-tight">
            <Link
              href={`/admin/customers/${c.id}`}
              className="font-raleway font-semibold text-navy hover:text-amber"
            >
              {c.name ?? c.email}
            </Link>
            {c.name && (
              <span className="font-sans text-[11px] text-muted">{c.email}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (c) => <RoleBadge role={c.role} />,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (c) => (
        <span className="text-charcoal">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (c) => <span className="text-charcoal">{c.orderCount}</span>,
    },
    {
      key: 'ltv',
      header: 'Lifetime value',
      className: 'whitespace-nowrap',
      render: (c) => (
        <span className="font-raleway font-semibold text-navy">
          {formatPriceNGN(c.totalSpent)}
        </span>
      ),
    },
    {
      key: 'last',
      header: 'Last order',
      render: (c) => (
        <span className="text-charcoal">
          {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'open',
      header: '',
      className: 'text-right',
      render: (c) => (
        <Link
          href={`/admin/customers/${c.id}`}
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
        title="Customers"
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
            placeholder="Search name or email…"
            className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as '' | CustomerRole)}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="name-asc">Name A–Z</option>
          <option value="spend-desc">Top spenders</option>
        </select>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        rowKey={(c) => c.id}
        loading={loading}
        emptyState="No customers match these filters."
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

function RoleBadge({ role }: { role: CustomerRole }) {
  const styles: Record<CustomerRole, { bg: string; text: string }> = {
    CUSTOMER: { bg: 'bg-border/50', text: 'text-charcoal' },
    SELLER: { bg: 'bg-navy/15', text: 'text-navy' },
    ADMIN: { bg: 'bg-amber/30', text: 'text-navy' },
  };
  const s = styles[role];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${s.bg} ${s.text}`}
    >
      {role.toLowerCase()}
    </span>
  );
}
