'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Loader2, Package, Users } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminListTopProducts,
  type AdminTopProduct,
} from '@/lib/api/admin';

/**
 * /admin/views — view-tracking analytics dashboard. Lists the most
 * viewed products in a chosen window with per-product view counts,
 * distinct sessions, and distinct signed-in users.
 *
 * Window is capped at 90 days because that's our `ProductView`
 * retention — anything older has been pruned by the cron.
 *
 * CSV export is client-side: serialises the current table. No
 * server endpoint needed for a 50-200 row table.
 */

const RANGE_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const;

export default function AdminViewsPage() {
  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<{
    items: AdminTopProduct[];
    totalProducts: number;
    totalViews: number;
    since: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminListTopProducts({ days, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof HttpApiError || e instanceof Error
            ? e.message
            : 'Failed to load',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const items = data?.items ?? [];

  const sinceLabel = useMemo(() => {
    if (!data?.since) return '';
    return new Date(data.since).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [data]);

  const downloadCsv = () => {
    if (items.length === 0) return;
    const header = [
      'rank',
      'product_id',
      'slug',
      'name',
      'view_count',
      'unique_sessions',
      'unique_users',
    ];
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = items.map((p, i) =>
      [
        i + 1,
        p.productId,
        p.slug,
        p.name,
        p.viewCount,
        p.uniqueSessions,
        p.uniqueUsers,
      ]
        .map(escape)
        .join(','),
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afrizonemart-top-products-${days}d-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('CSV downloaded');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Product view analytics"
        subtitle="What customers are looking at, by window. Powers the For You feed's trending sort + the storefront's view-based merchandising."
      />

      {/* Window picker + headline stats + CSV */}
      <div className="rounded-card border border-border bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.days}
                type="button"
                onClick={() => setDays(o.days)}
                className={
                  days === o.days
                    ? 'rounded-pill bg-navy px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-white'
                    : 'rounded-pill border border-border bg-white px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy'
                }
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 rounded-btn border border-border bg-white px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={13} aria-hidden /> Export CSV
          </button>
        </div>

        {data ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatTile
              icon={<Eye size={16} />}
              label="Total views"
              value={data.totalViews.toLocaleString()}
              hint={`Since ${sinceLabel}`}
            />
            <StatTile
              icon={<Package size={16} />}
              label="Products viewed"
              value={data.totalProducts.toLocaleString()}
              hint={`Out of the catalog`}
            />
            <StatTile
              icon={<Users size={16} />}
              label="Showing top"
              value={`${items.length}`}
              hint="By view count, ties → newest"
            />
          </div>
        ) : null}
      </div>

      {/* Top products table */}
      <div className="overflow-hidden rounded-card border border-border bg-white">
        {loading ? (
          <div className="flex items-center gap-2 p-5 font-sans text-sm text-muted">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : error ? (
          <p className="p-5 font-sans text-sm text-danger">{error}</p>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-raleway font-semibold text-navy">
              No view data yet for the last {days} days.
            </p>
            <p className="mt-1 font-sans text-sm text-muted">
              Views are recorded after a user dwells on a PDP for 2+ seconds
              (mobile or web). Once traffic builds, this table fills up.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="border-b border-border bg-page">
              <tr className="text-left font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                <th className="px-3 py-2 md:px-4">#</th>
                <th className="px-3 py-2 md:px-4">Product</th>
                <th className="px-3 py-2 text-right md:px-4">Views</th>
                <th className="hidden px-3 py-2 text-right md:table-cell md:px-4">
                  Sessions
                </th>
                <th className="hidden px-3 py-2 text-right md:table-cell md:px-4">
                  Signed-in
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr
                  key={p.productId}
                  className="border-b border-border last:border-0 hover:bg-page"
                >
                  <td className="px-3 py-3 font-sans text-sm text-muted md:px-4">
                    {i + 1}
                  </td>
                  <td className="px-3 py-3 md:px-4">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-btn bg-page">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-btn bg-page" />
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="block truncate font-raleway font-semibold text-navy hover:text-amber"
                        >
                          {p.name}
                        </Link>
                        <p className="truncate font-sans text-xs text-muted">
                          /{p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-raleway font-bold text-navy md:px-4">
                    {p.viewCount.toLocaleString()}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-sans text-sm text-charcoal md:table-cell md:px-4">
                    {p.uniqueSessions.toLocaleString()}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-sans text-sm text-charcoal md:table-cell md:px-4">
                    {p.uniqueUsers.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="font-sans text-xs text-muted">
        Anonymous viewers count toward Sessions but never toward Signed-in.
        We don&apos;t fingerprint or store IPs — the only identifier is an
        opaque session id minted in the visitor&apos;s browser/app on first
        visit. Per-product drill (chart + who viewed) is a follow-up.
      </p>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-page p-3">
      <div className="flex items-center gap-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-raleway text-2xl font-bold text-navy">{value}</p>
      {hint ? <p className="mt-0.5 font-sans text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
