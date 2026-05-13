'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCheck,
  Eye,
  MailCheck,
  MousePointerClick,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminListNotifications,
  adminResendNotification,
  type AdminNotification,
  type NotificationStatus,
} from '@/lib/api/admin';

const STATUS_STYLES: Record<NotificationStatus, string> = {
  SENT: 'bg-success/10 text-success border-success/30',
  PENDING: 'bg-amber/10 text-amber border-amber/30',
  FAILED: 'bg-danger/10 text-danger border-danger/30',
};

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'' | NotificationStatus>('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState<{
    items: AdminNotification[];
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [status, type, q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListNotifications({
          page,
          limit: 25,
          status: status || undefined,
          type: type || undefined,
          q: q || undefined,
        });
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled)
          toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, status, type, q, refreshKey]);

  const onResend = async (id: string) => {
    setResending(id);
    try {
      await adminResendNotification(id);
      toast('Email re-sent', 'success');
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Resend failed', 'error');
    } finally {
      setResending(null);
    }
  };

  const columns: Column<AdminNotification>[] = [
    {
      key: 'when',
      header: 'When',
      render: (n) => (
        <span className="font-sans text-[12px] text-charcoal">
          {new Date(n.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (n) => (
        <span className="font-mono text-[11px] text-navy">{n.type}</span>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (n) => (
        <div className="flex flex-col leading-tight">
          <span className="font-sans text-sm text-charcoal">{n.recipient}</span>
          {n.subject && (
            <span className="font-sans text-[11px] text-muted">{n.subject}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (n) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${STATUS_STYLES[n.status]}`}
        >
          {n.status}
        </span>
      ),
    },
    {
      key: 'engagement',
      header: 'Engagement',
      render: (n) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {n.deliveredAt && (
            <EngagementChip
              tone="ok"
              Icon={MailCheck}
              label="Delivered"
              detail={new Date(n.deliveredAt).toLocaleString()}
            />
          )}
          {n.openCount > 0 && (
            <EngagementChip
              tone="ok"
              Icon={Eye}
              label={`Opened ×${n.openCount}`}
              detail={
                n.lastOpenedAt
                  ? `Last: ${new Date(n.lastOpenedAt).toLocaleString()}`
                  : undefined
              }
            />
          )}
          {n.clickCount > 0 && (
            <EngagementChip
              tone="ok"
              Icon={MousePointerClick}
              label={`Clicked ×${n.clickCount}`}
              detail={
                n.lastClickedAt
                  ? `Last: ${new Date(n.lastClickedAt).toLocaleString()}`
                  : undefined
              }
            />
          )}
          {n.bouncedAt && (
            <EngagementChip
              tone="bad"
              Icon={AlertTriangle}
              label="Bounced"
              detail={n.bounceReason ?? new Date(n.bouncedAt).toLocaleString()}
            />
          )}
          {n.complainedAt && (
            <EngagementChip
              tone="bad"
              Icon={ShieldAlert}
              label="Complaint"
              detail={new Date(n.complainedAt).toLocaleString()}
            />
          )}
          {!n.deliveredAt &&
            n.openCount === 0 &&
            n.clickCount === 0 &&
            !n.bouncedAt &&
            !n.complainedAt && (
              <span className="font-sans text-[11px] text-muted">—</span>
            )}
        </div>
      ),
    },
    {
      key: 'error',
      header: 'Error',
      render: (n) =>
        n.error ? (
          <span className="block max-w-xs truncate font-mono text-[10px] text-danger" title={n.error}>
            {n.error}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (n) => (
        <button
          type="button"
          onClick={() => onResend(n.id)}
          disabled={resending === n.id}
          className="flex items-center gap-1.5 rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={12} aria-hidden />
          {resending === n.id ? 'Resending…' : 'Resend'}
        </button>
      ),
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Notifications"
        subtitle={
          data
            ? `${data.pagination.total.toLocaleString()} email${data.pagination.total === 1 ? '' : 's'} sent`
            : 'Loading…'
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipient or subject…"
          className="flex-1 min-w-[240px] rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        />
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Type (order.confirmed, payment.received…)"
          className="flex-1 min-w-[240px] rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as NotificationStatus | '')}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        rowKey={(n) => n.id}
        loading={loading}
        emptyState="No notifications match these filters yet."
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

/// Tracker #49 — small chip for the engagement column. `tone` decides
/// the accent colour; pass `detail` for an on-hover tooltip with the
/// timestamp / reason.
function EngagementChip({
  tone,
  Icon,
  label,
  detail,
}: {
  tone: 'ok' | 'bad';
  Icon: LucideIcon;
  label: string;
  detail?: string;
}) {
  const styles =
    tone === 'ok'
      ? 'border-success/30 bg-success/10 text-success'
      : 'border-danger/30 bg-danger/10 text-danger';
  return (
    <span
      title={detail}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${styles}`}
    >
      <Icon size={10} aria-hidden />
      {label}
    </span>
  );
}

// Suppress unused-import warning if the success icon gets removed
// later.
void CheckCheck;
