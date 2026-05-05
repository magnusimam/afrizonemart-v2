'use client';

import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import { adminListAudit, type AuditLogEntry } from '@/lib/api/admin';

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [data, setData] = useState<{
    items: AuditLogEntry[];
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [entityType, action]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListAudit({
          page,
          limit: 50,
          entityType: entityType || undefined,
          action: action || undefined,
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
  }, [page, entityType, action]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'when',
      header: 'When',
      render: (e) => (
        <span className="font-sans text-[12px] text-charcoal">
          {new Date(e.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'who',
      header: 'Actor',
      render: (e) => (
        <span className="font-sans text-sm text-charcoal">
          {e.actorEmail ?? <span className="text-muted">system</span>}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (e) => (
        <span className="font-mono text-[11px] text-navy">{e.action}</span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (e) => (
        <div className="flex flex-col leading-tight">
          <span className="font-raleway text-xs font-semibold text-navy">{e.entityType}</span>
          {e.entityId && (
            <span className="font-mono text-[10px] text-muted">{e.entityId}</span>
          )}
        </div>
      ),
    },
    {
      key: 'changes',
      header: 'Changes',
      render: (e) => (
        <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-words rounded bg-page p-2 font-mono text-[10px] text-charcoal">
          {Object.keys(e.changes).length === 0 ? '—' : JSON.stringify(e.changes, null, 2)}
        </pre>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Audit log"
        subtitle={data ? `${data.pagination.total.toLocaleString()} entries` : 'Loading…'}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          placeholder="Entity type (order / product / staff …)"
          className="flex-1 min-w-[220px] rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        />
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Action (e.g. order.refund_recorded)"
          className="flex-1 min-w-[220px] rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        />
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        rowKey={(e) => e.id}
        loading={loading}
        emptyState="No audit entries match these filters yet."
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
