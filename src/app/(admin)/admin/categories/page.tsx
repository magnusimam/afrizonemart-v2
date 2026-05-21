'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
  type AdminCategory,
} from '@/lib/api/admin';
import { uploadImage, UploadApiError } from '@/lib/api/uploads';

type Archetype = 'GROCERY' | 'WINE' | 'LIFESTYLE' | 'FASHION';

interface RowEdit {
  id: string;
  slug: string;
  name: string;
  image: string;
  archetype: Archetype;
}

const ARCHETYPE_OPTIONS: { value: Archetype; label: string; hint: string }[] = [
  { value: 'GROCERY', label: 'Grocery', hint: 'Soft amber tile, pill stepper, single Add-to-Bag' },
  { value: 'WINE', label: 'Wine', hint: 'Solid navy hero, vertical stepper, size pills' },
  { value: 'LIFESTYLE', label: 'Lifestyle', hint: 'Warm cream, image carousel, full-width checkout' },
  { value: 'FASHION', label: 'Fashion', hint: 'Amber-cream gradient, thumbnail strip, two CTAs' },
];

const ARCHETYPE_CHIP: Record<Archetype, { label: string; tone: string }> = {
  GROCERY: { label: 'Grocery', tone: 'bg-amber/15 text-navy' },
  WINE: { label: 'Wine', tone: 'bg-navy/10 text-navy' },
  LIFESTYLE: { label: 'Lifestyle', tone: 'bg-page text-charcoal' },
  FASHION: { label: 'Fashion', tone: 'bg-success/10 text-success' },
};

interface NewCategoryDraft {
  parentId: string | null;
  slug: string;
  name: string;
}

interface TreeNode extends AdminCategory {
  children: TreeNode[];
}

/** Builds a 2-level tree from the flat list returned by the admin
 *  endpoint. Top-level (parentId === null) at the root, direct children
 *  nested under each parent. Order: name asc within each level. */
function buildTree(items: AdminCategory[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const c of items) byId.set(c.id, { ...c, children: [] });
  const all: TreeNode[] = Array.from(byId.values());
  const roots: TreeNode[] = [];
  for (const node of all) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortByName = (a: TreeNode, b: TreeNode) => a.name.localeCompare(b.name);
  for (const node of all) node.children.sort(sortByName);
  roots.sort(sortByName);
  return roots;
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<AdminCategory[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<RowEdit | null>(null);
  const [draft, setDraft] = useState<NewCategoryDraft | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = () =>
    adminListCategories()
      .then((r) => setItems(r.items))
      .catch((e) =>
        toast(e instanceof Error ? e.message : 'Failed to load categories', 'error'),
      );

  useEffect(() => {
    void load();
  }, []);

  const tree = useMemo(() => (items ? buildTree(items) : []), [items]);
  const totalCount = items?.length ?? 0;
  const topLevelCount = tree.length;

  const handleCreate = async () => {
    if (!draft || !draft.slug.trim() || !draft.name.trim()) return;
    setBusy(true);
    try {
      await adminCreateCategory({
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        parentId: draft.parentId,
      });
      toast(`Created "${draft.name.trim()}"`);
      setDraft(null);
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
        archetype: edit.archetype,
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

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRow = (node: TreeNode, depth: number) => {
    const isEditing = edit?.id === node.id;
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);
    const showSubDraft = draft?.parentId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-3 border-b border-border/60 px-4 py-3 ${
            depth > 0 ? 'bg-page/40' : 'bg-white'
          }`}
          style={{ paddingLeft: 16 + depth * 28 }}
        >
          {/* Collapse handle (parent rows only) */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCollapse(node.id)}
              className="rounded-md p-1 text-muted hover:bg-page hover:text-navy"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? (
                <ChevronRight size={14} aria-hidden />
              ) : (
                <ChevronDown size={14} aria-hidden />
              )}
            </button>
          ) : (
            <span className="w-[22px]" aria-hidden />
          )}

          <div className="grid flex-1 grid-cols-[2fr_1.4fr_1.4fr_1fr_70px] items-center gap-3">
            {/* Name */}
            {isEditing ? (
              <input
                value={edit!.name}
                onChange={(e) => setEdit({ ...edit!, name: e.target.value })}
                className={cellInput}
              />
            ) : (
              <span className="font-raleway font-semibold text-navy">
                {node.name}
                {depth > 0 && (
                  <span className="ml-2 rounded bg-page px-1.5 py-0.5 font-sans text-[10px] font-normal uppercase tracking-wider text-muted">
                    sub
                  </span>
                )}
              </span>
            )}

            {/* Slug */}
            {isEditing ? (
              <input
                value={edit!.slug}
                onChange={(e) => setEdit({ ...edit!, slug: e.target.value })}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className={`${cellInput} font-mono`}
              />
            ) : (
              <span className="font-mono text-[12px] text-charcoal">{node.slug}</span>
            )}

            {/* Image — compact picker (edit) / thumbnail (read).
                The full <ImageUploader> is too tall for an inline
                row, so we have a tight 28x28 thumb + an Upload
                button that fires the same /api/uploads endpoint. */}
            {isEditing ? (
              <CategoryImageCell
                value={edit!.image}
                onChange={(url) => setEdit({ ...edit!, image: url })}
              />
            ) : node.image ? (
              <span className="relative h-7 w-7 overflow-hidden rounded-md border border-border bg-page">
                <Image
                  src={node.image}
                  alt=""
                  fill
                  sizes="28px"
                  unoptimized
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="font-raleway text-[10px] uppercase tracking-wider text-muted">
                — no image —
              </span>
            )}

            {/* Archetype — dropdown when editing, chip otherwise.
                Drives mobile PDP visual treatment (S2 pattern). */}
            {isEditing ? (
              <select
                value={edit!.archetype}
                onChange={(e) =>
                  setEdit({ ...edit!, archetype: e.target.value as Archetype })
                }
                className={`${cellInput} font-raleway`}
                title={
                  ARCHETYPE_OPTIONS.find((o) => o.value === edit!.archetype)?.hint
                }
              >
                {ARCHETYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={`inline-flex w-fit items-center rounded px-1.5 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-wider ${
                  ARCHETYPE_CHIP[(node.archetype ?? 'FASHION') as Archetype].tone
                }`}
              >
                {ARCHETYPE_CHIP[(node.archetype ?? 'FASHION') as Archetype].label}
              </span>
            )}

            {/* Product count */}
            <span className="text-charcoal text-sm">{node._count?.products ?? 0}</span>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            {isEditing ? (
              <>
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
              </>
            ) : (
              <>
                {/* Only top-level rows can spawn subcategories (max depth 2). */}
                {depth === 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ parentId: node.id, slug: '', name: '' })
                    }
                    className="rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-amber hover:bg-amber/10"
                    title="Add subcategory"
                  >
                    + Sub
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setEdit({
                      id: node.id,
                      slug: node.slug,
                      name: node.name,
                      image: node.image ?? '',
                      archetype: node.archetype ?? 'FASHION',
                    })
                  }
                  className="rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(node)}
                  className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label={`Delete ${node.name}`}
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline draft for adding a subcategory under this row */}
        {showSubDraft && draft && (
          <div
            className="flex flex-wrap items-end gap-2 border-b border-amber/40 bg-amber/10 px-4 py-3"
            style={{ paddingLeft: 16 + (depth + 1) * 28 }}
          >
            <label className="flex flex-1 min-w-[160px] flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Subcategory name
              </span>
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={cellInput}
              />
            </label>
            <label className="flex flex-1 min-w-[160px] flex-col gap-1">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Slug
              </span>
              <input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className={`${cellInput} font-mono`}
              />
            </label>
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy || !draft.slug.trim() || !draft.name.trim()}
              className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={busy}
              className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Render children when expanded */}
        {hasChildren && !isCollapsed && node.children.map((c) => renderRow(c, depth + 1))}
      </div>
    );
  };

  const renderTopLevelDraft = () => {
    if (!draft || draft.parentId !== null) return null;
    return (
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-amber/40 bg-amber/10 p-4">
        <label className="flex flex-1 min-w-[160px] flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
            Name
          </span>
          <input
            autoFocus
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={cellInput}
          />
        </label>
        <label className="flex flex-1 min-w-[160px] flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
            Slug
          </span>
          <input
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={`${cellInput} font-mono`}
          />
        </label>
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy || !draft.slug.trim() || !draft.name.trim()}
          className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => setDraft(null)}
          disabled={busy}
          className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
        >
          Cancel
        </button>
      </div>
    );
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Categories"
        subtitle={
          items
            ? `${topLevelCount} top-level · ${totalCount - topLevelCount} subcategor${
                totalCount - topLevelCount === 1 ? 'y' : 'ies'
              }`
            : 'Loading…'
        }
        action={
          !draft && (
            <button
              type="button"
              onClick={() => setDraft({ parentId: null, slug: '', name: '' })}
              className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
            >
              <Plus size={14} aria-hidden /> New category
            </button>
          )
        }
      />

      {renderTopLevelDraft()}

      <div className="overflow-hidden rounded-card border border-border bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-page px-4 py-2.5">
          <span className="w-[22px]" aria-hidden />
          <div className="grid flex-1 grid-cols-[2fr_1.4fr_1.4fr_1fr_70px] items-center gap-3 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
            <span>Name</span>
            <span>Slug</span>
            <span>Image URL</span>
            <span>Archetype</span>
            <span>Products</span>
          </div>
          <span className="w-[180px]" aria-hidden />
        </div>

        {items === null ? (
          <div className="px-4 py-10 text-center font-sans text-sm text-muted">Loading…</div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-10 text-center font-sans text-sm text-muted">
            No categories yet.
          </div>
        ) : (
          tree.map((node) => renderRow(node, 0))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete category"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? Categories with products attached or subcategories nested under them cannot be deleted.`
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

/**
 * Compact inline image picker for the categories row.
 *
 * Click the thumbnail (or the upload button when empty) → file
 * picker → posts to /api/uploads?folder=categories → URL fills
 * the row. Trash icon clears the value back to empty. Designed to
 * fit inline in the row's 1fr column without the vertical real
 * estate of the full ImageUploader component used elsewhere in
 * admin.
 */
function CategoryImageCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = () => inputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadImage(file, 'categories');
      onChange(uploaded.url);
    } catch (e) {
      setError(
        e instanceof UploadApiError || e instanceof Error
          ? e.message
          : 'Upload failed',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {value ? (
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-page transition-opacity hover:opacity-80 disabled:opacity-50"
          aria-label="Replace image"
          title="Click to replace"
        >
          <Image
            src={value}
            alt=""
            fill
            sizes="36px"
            unoptimized
            className="object-cover"
          />
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-charcoal/50">
              <Loader2 size={14} className="animate-spin text-white" aria-hidden />
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-navy/40 bg-page text-navy hover:bg-navy/5 disabled:opacity-50"
          aria-label="Upload image"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : (
            <Upload size={14} aria-hidden />
          )}
        </button>
      )}

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
          aria-label="Remove image"
          title="Remove"
        >
          <X size={13} aria-hidden />
        </button>
      )}

      {error && (
        <span className="font-sans text-[10px] text-danger" title={error}>
          ⚠
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}
