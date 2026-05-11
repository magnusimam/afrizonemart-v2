'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CircleDashed,
  Clock,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { EditableNameCell } from '@/components/admin/EditableNameCell';
import { EditablePriceCell } from '@/components/admin/EditablePriceCell';
import { PriceHistoryDrawer } from '@/components/admin/PriceHistoryDrawer';
import { toast } from '@/components/admin/Toast';
import {
  internGetMyQueue,
  type InternQueueItem,
} from '@/lib/api/admin';

/**
 * /admin/intern-queue/list — leaner table view of the intern's own
 * products, filtered by status (?status=todo|pending|approved|rejected).
 *
 * Why this page exists alongside the card view:
 *  - The card view at /admin/intern-queue is image-upload-centric.
 *    Approved / pending products don't need that UI; they just
 *    need to be seen.
 *  - This list adds inline name + price quick-edit so the intern
 *    can fix typos and tune prices without opening the full
 *    /admin/products/[id] editor.
 *
 * Editing requires `products.write` on the intern's permissions
 * — granted to existing interns by the 20260511150000 migration
 * and to new interns via /admin/staff. Without it, the PATCH
 * calls return 403 and the toast surfaces the error.
 */

type StatusKey = 'todo' | 'pending' | 'approved' | 'rejected';

const STATUS_META: Record<
  StatusKey,
  { label: string; icon: typeof CircleDashed }
> = {
  todo: { label: 'To do', icon: CircleDashed },
  pending: { label: 'Pending review', icon: Clock },
  approved: { label: 'Approved', icon: ShieldCheck },
  rejected: { label: 'Needs rework', icon: AlertTriangle },
};

function parseStatus(value: string | null): StatusKey {
  if (
    value === 'todo' ||
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected'
  ) {
    return value;
  }
  return 'approved';
}

export default function InternProductsListPage() {
  const params = useSearchParams();
  const status = parseStatus(params.get('status'));
  const StatusIcon = STATUS_META[status].icon;

  const [data, setData] = useState<{
    items: InternQueueItem[];
    stats: { todo: number; pending: number; approved: number; rejected: number };
  } | null>(null);
  const [historyFor, setHistoryFor] = useState<InternQueueItem | null>(null);

  useEffect(() => {
    void internGetMyQueue()
      .then(setData)
      .catch((e) =>
        toast(
          e instanceof Error ? e.message : 'Failed to load your products',
          'error',
        ),
      );
  }, []);

  // Filter to the requested status. The cards page handles all
  // statuses in one view; here we slice to keep the table focused.
  const items = useMemo(
    () => (data?.items ?? []).filter((it) => it.status === status),
    [data, status],
  );

  // Local patches so quick-edits reflect immediately without a
  // re-fetch. We mutate the items array in-place via setData; the
  // shape matches what /api/intern/queue returns so subsequent
  // refreshes restore the canonical state.
  const patchItem = (id: string, next: Partial<InternQueueItem>) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) =>
              it.id === id ? { ...it, ...next } : it,
            ),
          }
        : prev,
    );
  };

  const columns: Column<InternQueueItem>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <EditableNameCell
            productId={item.id}
            name={item.name}
            onChanged={(next) => patchItem(item.id, { name: next })}
          />
          <span className="font-sans text-[11px] text-muted">
            {item.brand ?? '—'}
            {item.category?.name ? ` · ${item.category.name}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (item) => (
        <EditablePriceCell
          productId={item.id}
          productName={item.name}
          price={item.price}
          comparePrice={item.comparePrice ?? null}
          onChanged={(next) =>
            patchItem(item.id, {
              price: next.price,
              comparePrice: next.comparePrice,
            })
          }
          onOpenHistory={() => setHistoryFor(item)}
        />
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'last-action',
      header: 'Last action',
      render: (item) => {
        const sub = item.latestSubmission;
        if (!sub) {
          return (
            <span className="font-sans text-xs text-muted">Not submitted</span>
          );
        }
        const ts = sub.reviewedAt ?? sub.createdAt;
        return (
          <span className="font-sans text-xs text-charcoal">
            {new Date(ts).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (item) => {
        // Only To-Do / Rework benefit from jumping to the card
        // view (where upload UI lives). Approved / Pending don't
        // need any action.
        if (item.status === 'todo' || item.status === 'rejected') {
          return (
            <Link
              href={`/admin/intern-queue#${item.id}`}
              className="inline-flex items-center gap-1 rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
            >
              <Upload size={10} aria-hidden /> Upload
            </Link>
          );
        }
        return null;
      },
      className: 'whitespace-nowrap text-right',
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title={`${STATUS_META[status].label} (${items.length})`}
        subtitle={
          status === 'approved'
            ? "Products you've completed that admin approved — counts toward payment."
            : status === 'pending'
              ? 'Submitted and awaiting admin review.'
              : status === 'rejected'
                ? 'Admin asked for changes. Click Upload to fix and resubmit.'
                : 'Products waiting on your image uploads.'
        }
        action={
          <Link
            href="/admin/intern-queue"
            className="flex items-center gap-2 rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:border-navy hover:text-navy"
          >
            <ArrowLeft size={14} aria-hidden /> Back to queue
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(STATUS_META) as StatusKey[]).map((key) => {
          const isActive = key === status;
          const Icon = STATUS_META[key].icon;
          const count = data?.stats[key] ?? 0;
          return (
            <Link
              key={key}
              href={`/admin/intern-queue/list?status=${key}`}
              className={`flex items-center gap-1.5 rounded-btn border px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
                isActive
                  ? 'border-navy bg-navy text-white'
                  : 'border-border bg-white text-charcoal hover:border-navy'
              }`}
            >
              <Icon size={12} aria-hidden />
              {STATUS_META[key].label}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? 'bg-white/20' : 'bg-page'
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {data === null ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-card border border-border bg-white p-8 text-center font-sans text-sm text-muted">
          <StatusIcon size={28} className="mx-auto mb-2 text-border" aria-hidden />
          No {STATUS_META[status].label.toLowerCase()} products yet.
        </p>
      ) : (
        <DataTable rows={items} columns={columns} rowKey={(r) => r.id} />
      )}

      <PriceHistoryDrawer
        product={
          historyFor
            ? {
                id: historyFor.id,
                name: historyFor.name,
                price: historyFor.price,
                comparePrice: historyFor.comparePrice ?? null,
              }
            : null
        }
        onClose={() => setHistoryFor(null)}
        onReverted={(next) =>
          patchItem(next.productId, {
            price: next.price,
            comparePrice: next.comparePrice,
          })
        }
      />
    </div>
  );
}
