'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, FileText, ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateSitePage,
  adminListSitePages,
  type AdminPageSummary,
} from '@/lib/api/admin';

export default function AdminSitePagesPage() {
  const [items, setItems] = useState<AdminPageSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    adminListSitePages()
      .then((r) => setItems(r.items))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!newSlug.trim() || !newTitle.trim()) return;
    setBusy(true);
    try {
      const created = await adminCreateSitePage({
        slug: newSlug.trim(),
        title: newTitle.trim(),
      });
      toast(`Created "${created.title}"`);
      window.location.href = `/admin/site-pages/${created.id}`;
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to create', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Site builder — Pages"
        subtitle={
          items
            ? `${items.length} page${items.length === 1 ? '' : 's'} configured`
            : 'Loading…'
        }
        action={
          !creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
            >
              <Plus size={14} aria-hidden /> New page
            </button>
          )
        }
      />

      {creating && (
        <div className="mb-6 rounded-card border border-amber/40 bg-amber/10 p-4">
          <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
            New page
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-1 min-w-[200px] flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Title
              </span>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Black Friday landing"
                className={inputClass}
              />
            </label>
            <label className="flex flex-1 min-w-[200px] flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                URL slug
              </span>
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="black-friday"
                pattern="[a-z0-9]+(?:[-/][a-z0-9]+)*"
                className={`${inputClass} font-mono`}
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy || !newSlug.trim() || !newTitle.trim()}
                className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setNewSlug('');
                  setNewTitle('');
                }}
                disabled={busy}
                className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
              >
                Cancel
              </button>
            </div>
          </div>
          <p className="mt-3 font-sans text-xs text-muted">
            Slug becomes the URL: <code className="rounded bg-white px-1">/{`<slug>`}</code>.
            Use slashes for nesting (e.g. <code className="rounded bg-white px-1">shop/groceries</code>).
            "home" controls the homepage.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-border bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-page font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5">Sections</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Updated</th>
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
                  No pages yet. Create one to start composing the site.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-b-0 hover:bg-page/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/site-pages/${p.id}`}
                      className="flex items-center gap-2 font-raleway font-semibold text-navy hover:text-amber"
                    >
                      <FileText size={14} aria-hidden /> {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-charcoal">/{p.slug}</td>
                  <td className="px-4 py-3 font-sans text-sm text-charcoal">{p.sectionCount}</td>
                  <td className="px-4 py-3">
                    {p.publishedAt ? (
                      <span
                        className="rounded-full bg-success/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success"
                        title="The storefront is rendering this page from the builder."
                      >
                        Live · Custom
                      </span>
                    ) : (
                      <span
                        className="rounded-full bg-info/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-info"
                        title="The page is live on the storefront using its hardcoded default layout. Publish in the builder to take over."
                      >
                        Live · Default
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-sans text-xs text-muted">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.publishedAt && (
                      <Link
                        href={`/${p.slug === 'home' ? '' : p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:text-amber"
                      >
                        <ExternalLink size={12} aria-hidden /> View
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';
