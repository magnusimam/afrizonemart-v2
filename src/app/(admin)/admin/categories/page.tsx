'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
  type AdminCategory,
} from '@/lib/api/admin';

interface RowEdit {
  id: string;
  slug: string;
  name: string;
  image: string;
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<AdminCategory[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<RowEdit | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');

  const load = () =>
    adminListCategories().then((r) => setItems(r.items)).catch((e) =>
      toast(e instanceof Error ? e.message : 'Failed to load categories', 'error'),
    );

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!newSlug.trim() || !newName.trim()) return;
    setBusy(true);
    try {
      await adminCreateCategory({ slug: newSlug.trim(), name: newName.trim() });
      toast(`Created "${newName.trim()}"`);
      setNewSlug('');
      setNewName('');
      setCreating(false);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to create', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!edit) return;
    setBusy(true);
    try {
      await adminUpdateCategory(edit.id, {
        slug: edit.slug.trim(),
        name: edit.name.trim(),
        image: edit.image.trim() || null,
      });
      toast('Saved');
      setEdit(null);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteCategory(pendingDelete.id);
      toast(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminCategory>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) =>
        edit?.id === c.id ? (
          <input
            value={edit.name}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            className={cellInput}
          />
        ) : (
          <span className="font-raleway font-semibold text-navy">{c.name}</span>
        ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (c) =>
        edit?.id === c.id ? (
          <input
            value={edit.slug}
            onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={`${cellInput} font-mono`}
          />
        ) : (
          <span className="font-mono text-[12px] text-charcoal">{c.slug}</span>
        ),
    },
    {
      key: 'image',
      header: 'Image URL',
      render: (c) =>
        edit?.id === c.id ? (
          <input
            value={edit.image}
            onChange={(e) => setEdit({ ...edit, image: e.target.value })}
            placeholder="https://…"
            className={`${cellInput} font-mono text-[11px]`}
          />
        ) : (
          <span className="line-clamp-1 font-mono text-[11px] text-muted">{c.image ?? '—'}</span>
        ),
    },
    {
      key: 'count',
      header: 'Products',
      render: (c) => <span className="text-charcoal">{c._count?.products ?? 0}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) =>
        edit?.id === c.id ? (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={busy}
              className="rounded-md p-1.5 text-success hover:bg-success/10 disabled:opacity-50"
              aria-label="Save"
            >
              <Save size={15} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setEdit(null)}
              disabled={busy}
              className="rounded-md p-1.5 text-muted hover:bg-page disabled:opacity-50"
              aria-label="Cancel"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() =>
                setEdit({ id: c.id, slug: c.slug, name: c.name, image: c.image ?? '' })
              }
              className="rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(c)}
              className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label={`Delete ${c.name}`}
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Categories"
        subtitle={items ? `${items.length} categories` : 'Loading…'}
        action={
          !creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
            >
              <Plus size={14} aria-hidden /> New category
            </button>
          )
        }
      />

      {creating && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-amber/40 bg-amber/10 p-4">
          <label className="flex flex-1 min-w-[160px] flex-col gap-1">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              Name
            </span>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={cellInput}
            />
          </label>
          <label className="flex flex-1 min-w-[160px] flex-col gap-1">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              Slug
            </span>
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className={`${cellInput} font-mono`}
            />
          </label>
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy || !newSlug.trim() || !newName.trim()}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewSlug('');
              setNewName('');
            }}
            disabled={busy}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
          >
            Cancel
          </button>
        </div>
      )}

      <DataTable
        rows={items ?? []}
        columns={columns}
        rowKey={(c) => c.id}
        loading={items === null}
        emptyState="No categories yet."
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete category"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? Categories with products attached cannot be deleted.`
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

const cellInput =
  'w-full rounded-input border border-border bg-white px-2 py-1.5 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';
