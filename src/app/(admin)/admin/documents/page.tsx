'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Edit, ExternalLink, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { getCountry } from '@/lib/countries';
import {
  adminDeleteDocument,
  adminListDocuments,
  type AdminLibraryDocument,
} from '@/lib/api/admin';

export default function AdminDocumentsListPage() {
  const [items, setItems] = useState<AdminLibraryDocument[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AdminLibraryDocument | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = () =>
    adminListDocuments({
      status: statusFilter,
      q: debouncedQ || undefined,
      limit: 50,
    })
      .then((r) => setItems(r.items))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, [statusFilter, debouncedQ]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteDocument(pendingDelete.id);
      toast(`Deleted "${pendingDelete.title}"`);
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Civic Library"
        subtitle={items ? `${items.length} document${items.length === 1 ? '' : 's'}` : 'Loading…'}
        action={
          <Link
            href="/admin/documents/new"
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
          >
            <Plus size={14} aria-hidden /> New document
          </Link>
        }
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
            placeholder="Search by title or slug…"
            className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'DRAFT' | 'PUBLISHED')}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-page font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Country</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Downloads</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-sans text-sm text-muted">
                  No documents yet.
                </td>
              </tr>
            ) : (
              items.map((d) => {
                const country = getCountry(d.country);
                return (
                  <tr key={d.id} className="border-b border-border/60 last:border-b-0 hover:bg-page/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/documents/${d.id}`}
                        className="flex items-center gap-2 font-raleway font-semibold text-navy hover:text-amber"
                      >
                        <FileText size={14} aria-hidden /> {d.title}
                      </Link>
                      <span className="font-mono text-[11px] text-muted">/library/{d.slug}</span>
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-charcoal">
                      {country ? `${country.flag} ${country.name}` : d.country}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-navy/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                        {d.docType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3 font-sans text-xs text-muted">
                      {d.downloadCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md p-1.5 text-muted hover:bg-page hover:text-navy"
                          aria-label="View PDF"
                        >
                          <ExternalLink size={14} aria-hidden />
                        </a>
                        <Link
                          href={`/admin/documents/${d.id}`}
                          className="rounded-md p-1.5 text-muted hover:bg-page hover:text-navy"
                          aria-label="Edit"
                        >
                          <Edit size={14} aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(d)}
                          className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete document"
        message={
          pendingDelete
            ? `Permanently delete "${pendingDelete.title}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => !busy && setPendingDelete(null)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: AdminLibraryDocument['status'] }) {
  if (status === 'PUBLISHED') {
    return (
      <span className="rounded-full bg-success/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
        Published
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
      Draft
    </span>
  );
}
