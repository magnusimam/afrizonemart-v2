'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminCreateCmsPage,
  adminListCmsPages,
  type CmsPageRow,
} from '@/lib/api/admin';

export default function AdminCmsPagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<CmsPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListCmsPages();
        if (!cancelled) setItems(r.items);
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const columns: Column<CmsPageRow>[] = [
    {
      key: 'title',
      header: 'Page',
      render: (p) => (
        <Link
          href={`/admin/pages/${p.id}`}
          className="flex flex-col text-left leading-tight hover:underline"
        >
          <span className="font-raleway text-sm font-bold text-navy">{p.title}</span>
          <span className="font-mono text-[10px] text-muted">/p/{p.slug}</span>
        </Link>
      ),
    },
    {
      key: 'blocks',
      header: 'Blocks',
      render: (p) => (
        <span className="font-sans text-xs text-muted">
          {(p.blocks ?? []).length} block{(p.blocks ?? []).length === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      key: 'isPublished',
      header: 'Status',
      render: (p) => (
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
            p.isPublished
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-muted/30 bg-muted/10 text-muted'
          }`}
        >
          {p.isPublished ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'view',
      header: '',
      render: (p) =>
        p.isPublished ? (
          <a
            href={`/p/${p.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-navy hover:underline"
          >
            View <ExternalLink size={10} aria-hidden />
          </a>
        ) : null,
    },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Pages"
        subtitle="Custom landing pages, About, FAQs, deals — anything that lives at /p/<slug>. Edit copy, add blocks, publish without filing a ticket."
        action={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy"
          >
            <Plus size={14} aria-hidden />
            New page
          </button>
        }
      />

      <DataTable
        rows={items}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        emptyState='No pages yet — click "New page" to start.'
      />

      {showForm && (
        <NewPageDialog
          onClose={() => setShowForm(false)}
          onCreated={(id) => router.push(`/admin/pages/${id}`)}
        />
      )}
    </div>
  );
}

function NewPageDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setSlug(
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120),
    );
  }, [title]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const created = await adminCreateCmsPage({
        title,
        slug,
        blocks: [
          { type: 'hero', heading: title, subheading: '' },
        ],
        isPublished: false,
      });
      onCreated(created.id);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-card bg-white p-6 shadow-card"
      >
        <h2 className="font-raleway text-xl font-bold text-navy">New page</h2>
        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z0-9]+(?:[-/][a-z0-9]+)*"
            className="rounded-input border border-border bg-white px-3 py-2 font-mono text-sm focus:border-navy focus:outline-none"
          />
          <span className="font-sans text-[11px] text-muted">URL: /p/{slug}</span>
        </label>
        {err && (
          <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger">{err}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:border-navy"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create & edit'}
          </button>
        </div>
      </form>
    </div>
  );
}
