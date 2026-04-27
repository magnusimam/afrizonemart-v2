'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Package, TrendingUp, Users } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import {
  adminReportLowStock,
  adminReportSales,
  adminReportTopCustomers,
  adminReportTopProducts,
  type LowStockItem,
  type SalesReport,
  type TopCustomer,
  type TopProduct,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';

type Preset = '7d' | '30d' | '90d' | 'ytd';

function rangeFromPreset(preset: Preset): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (preset === '7d') from.setDate(to.getDate() - 7);
  else if (preset === '30d') from.setDate(to.getDate() - 30);
  else if (preset === '90d') from.setDate(to.getDate() - 90);
  else if (preset === 'ytd') from.setMonth(0, 1);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[] | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[] | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[] | null>(null);

  const range = useMemo(() => rangeFromPreset(preset), [preset]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [s, p, c, l] = await Promise.all([
          adminReportSales({ ...range, granularity }),
          adminReportTopProducts({ ...range, limit: 10 }),
          adminReportTopCustomers({ ...range, limit: 10 }),
          adminReportLowStock({ limit: 25 }),
        ]);
        if (cancelled) return;
        setSales(s);
        setTopProducts(p.items);
        setTopCustomers(c.items);
        setLowStock(l.items);
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load reports', 'error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, granularity]);

  const maxRevenue = sales ? Math.max(1, ...sales.buckets.map((b) => b.revenue)) : 1;

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Reports"
        subtitle={`${range.from.slice(0, 10)} → ${range.to.slice(0, 10)}`}
        action={
          <div className="flex items-center gap-2">
            <PresetGroup value={preset} onChange={setPreset} />
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
              className="rounded-input border border-border bg-white px-3 py-1.5 font-sans text-xs text-charcoal focus:border-navy focus:outline-none"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        }
      />

      {/* Headline KPIs */}
      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi
          Icon={TrendingUp}
          label="Net revenue"
          value={sales ? formatPriceNGN(sales.totals.net) : '—'}
          hint={
            sales
              ? `${formatPriceNGN(sales.totals.revenue)} gross − ${formatPriceNGN(sales.totals.refunded)} refunded`
              : 'Loading…'
          }
        />
        <Kpi
          Icon={BarChart3}
          label="Orders"
          value={sales ? sales.totals.orders.toLocaleString() : '—'}
        />
        <Kpi
          Icon={Users}
          label="Buying customers"
          value={topCustomers ? topCustomers.length.toString() : '—'}
        />
        <Kpi
          Icon={AlertTriangle}
          label="Out of stock"
          value={lowStock ? lowStock.length.toString() : '—'}
          tone={lowStock && lowStock.length > 0 ? 'warn' : 'ok'}
        />
      </section>

      {/* Sales over time */}
      <Panel title="Sales over time" subtitle={`Per ${granularity}, cancelled orders excluded.`}>
        {!sales ? (
          <p className="font-sans text-sm text-muted">Loading…</p>
        ) : sales.buckets.length === 0 ? (
          <p className="font-sans text-sm text-muted">No orders in this range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-2 py-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">When</th>
                  <th className="px-2 py-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">Orders</th>
                  <th className="px-2 py-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">Revenue</th>
                  <th className="px-2 py-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">Refunded</th>
                  <th className="w-1/3 px-2 py-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">Bar</th>
                </tr>
              </thead>
              <tbody>
                {sales.buckets.map((b) => (
                  <tr key={b.at} className="border-b border-border last:border-b-0">
                    <td className="px-2 py-2 text-charcoal">{b.at}</td>
                    <td className="px-2 py-2 text-charcoal">{b.orders}</td>
                    <td className="px-2 py-2 font-raleway font-semibold text-navy">
                      {formatPriceNGN(b.revenue)}
                    </td>
                    <td className="px-2 py-2 text-danger">
                      {b.refunded > 0 ? `−${formatPriceNGN(b.refunded)}` : '—'}
                    </td>
                    <td className="px-2 py-2">
                      <div className="h-3 w-full rounded bg-page">
                        <div
                          className="h-full rounded bg-navy"
                          style={{ width: `${Math.round((b.revenue / maxRevenue) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top products */}
        <Panel title="Top products" subtitle="By revenue, cancelled orders excluded." Icon={Package}>
          {!topProducts ? (
            <p className="font-sans text-sm text-muted">Loading…</p>
          ) : topProducts.length === 0 ? (
            <p className="font-sans text-sm text-muted">No sales in this range.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 py-2">
                  <span className="w-5 text-right font-mono text-[11px] text-muted">{i + 1}</span>
                  <Link
                    href={`/product/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 font-raleway text-sm font-semibold text-navy hover:text-amber"
                  >
                    {p.name}
                  </Link>
                  <span className="font-sans text-[11px] text-muted">{p.units} units</span>
                  <span className="font-raleway text-sm font-bold text-navy">
                    {formatPriceNGN(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        {/* Top customers */}
        <Panel title="Top customers" subtitle="By net spend (refunds subtracted)." Icon={Users}>
          {!topCustomers ? (
            <p className="font-sans text-sm text-muted">Loading…</p>
          ) : topCustomers.length === 0 ? (
            <p className="font-sans text-sm text-muted">No customers in this range.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {topCustomers.map((c, i) => (
                <li key={c.userId} className="flex items-center gap-3 py-2">
                  <span className="w-5 text-right font-mono text-[11px] text-muted">{i + 1}</span>
                  <Link
                    href={`/admin/customers/${c.userId}`}
                    className="flex-1 font-raleway text-sm font-semibold text-navy hover:text-amber"
                  >
                    {c.name ?? c.email}
                  </Link>
                  <span className="font-sans text-[11px] text-muted">{c.orderCount} orders</span>
                  <span className="font-raleway text-sm font-bold text-navy">
                    {formatPriceNGN(c.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Low stock"
          subtitle="Out-of-stock items right now. Per-SKU quantities land with the Inventory module."
          Icon={AlertTriangle}
        >
          {!lowStock ? (
            <p className="font-sans text-sm text-muted">Loading…</p>
          ) : lowStock.length === 0 ? (
            <p className="font-sans text-sm text-muted">Nothing out of stock — nice.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-card border border-border bg-page p-3"
                >
                  <div className="flex flex-col leading-tight">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-raleway text-sm font-semibold text-navy hover:text-amber"
                    >
                      {p.name}
                    </Link>
                    <span className="font-sans text-[11px] text-muted">
                      {p.category?.name ?? 'Uncategorised'} · {formatPriceNGN(p.price)}
                    </span>
                  </div>
                  <span className="rounded-full bg-danger/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-danger">
                    Out
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function PresetGroup({
  value,
  onChange,
}: {
  value: Preset;
  onChange: (p: Preset) => void;
}) {
  const opts: { value: Preset; label: string }[] = [
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
    { value: 'ytd', label: 'YTD' },
  ];
  return (
    <div className="flex overflow-hidden rounded-input border border-border">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
            value === o.value ? 'bg-navy text-white' : 'bg-white text-charcoal hover:bg-page'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({
  Icon,
  label,
  value,
  hint,
  tone,
}: {
  Icon: typeof Package;
  label: string;
  value: string;
  hint?: string;
  tone?: 'ok' | 'warn';
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          {label}
        </span>
        <Icon
          size={16}
          className={tone === 'warn' ? 'text-danger' : 'text-navy'}
          aria-hidden
        />
      </header>
      <span className="font-raleway text-2xl font-bold text-navy">{value}</span>
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  Icon?: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 shadow-card">
      <header className="flex items-center gap-2 border-b border-border pb-3">
        {Icon && <Icon size={16} className="text-navy" aria-hidden />}
        <div className="flex flex-col">
          <h2 className="font-raleway text-base font-bold text-navy">{title}</h2>
          {subtitle && <p className="font-sans text-xs text-muted">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
