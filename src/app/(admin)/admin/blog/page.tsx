'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Edit, ExternalLink, Newspaper, Plus, Search, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminDeleteBlogPost,
  adminListBlogPosts,
  type AdminBlogPost,
} from '@/lib/api/admin';

export default function AdminBlogListPage() {
  const [items, setItems] = useState<AdminBlogPost[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'>(
    'ALL',
  );
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AdminBlogPost | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = () =>
    adminListBlogPosts({
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
      await adminDeleteBlogPost(pendingDelete.id);
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
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Blog"
        subtitle={items ? `${items.length} post${items.length === 1 ? '' : 's'}` : 'Loading…'}
        action={
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
          >
            <Plus size={14} aria-hidden /> New post
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
          onChange={(e) =>
            setStatusFilter(e.target.value as 'ALL' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED')
          }
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-page font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Tags</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-muted">
                  No posts yet.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-b-0 hover:bg-page/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="flex items-center gap-2 font-raleway font-semibold text-navy hover:text-amber"
                    >
                      <Newspaper size={14} aria-hidden /> {p.title}
                    </Link>
                    <span className="font-mono text-[11px] text-muted">/blog/{p.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} publishedAt={p.publishedAt} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-amber/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans text-xs text-muted">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === 'PUBLISHED' && (
                        <Link
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md p-1.5 text-muted hover:bg-page hover:text-navy"
                          aria-label="View on site"
                        >
                          <ExternalLink size={14} aria-hidden />
                        </Link>
                      )}
                      <Link
                        href={`/admin/blog/${p.id}`}
                        className="rounded-md p-1.5 text-muted hover:bg-page hover:text-navy"
                        aria-label="Edit"
                      >
                        <Edit size={14} aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(p)}
                        className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete post"
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

function StatusBadge({
  status,
  publishedAt,
}: {
  status: AdminBlogPost['status'];
  publishedAt: string | null;
}) {
  if (status === 'PUBLISHED') {
    return (
      <span className="rounded-full bg-success/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
        Published
      </span>
    );
  }
  if (status === 'SCHEDULED') {
    return (
      <span
        className="rounded-full bg-info/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-info"
        title={publishedAt ? `Scheduled for ${new Date(publishedAt).toLocaleString()}` : ''}
      >
        Scheduled
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
      Draft
    </span>
  );
}
