'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Edit,
  FileUp,
  FolderInput,
  Package,
  PackageX,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Column, DataTable } from '@/components/admin/DataTable';
import { ImportCsvDialog } from '@/components/admin/ImportCsvDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminBulkProductAction,
  adminDeleteProduct,
  adminListCategories,
  adminListProducts,
  type AdminBulkAction,
  type AdminCategory,
  type AdminProductListItem,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';
import { COUNTRIES } from '@/lib/countries';

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [data, setData] = useState<{
    items: AdminProductListItem[];
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [pendingDelete, setPendingDelete] = useState<AdminProductListItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  // Multi-select state. IDs are tracked across pages so an admin can
  // page through results and accumulate a selection.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | 'delete'>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, category, country, stockFilter]);

  useEffect(() => {
    void adminListCategories().then((r) => setCategories(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListProducts({
          page,
          limit: 25,
          q: debouncedQ || undefined,
          category: category || undefined,
          origin: country || undefined,
          inStock: stockFilter === 'all' ? undefined : stockFilter === 'in',
        });
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load products', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQ, category, country, stockFilter, reloadToken]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteProduct(pendingDelete.id);
      toast(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
      setReloadToken((t) => t + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ---- Selection helpers ----

  const visibleIds = useMemo(
    () => (data?.items ?? []).map((p) => p.id),
    [data?.items],
  );
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = !allVisibleSelected && visibleIds.some((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const runBulk = async (action: AdminBulkAction) => {
    if (selectedIds.size === 0) return;
    setBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const r = await adminBulkProductAction(ids, action);
      const verb =
        action.kind === 'delete'
          ? 'Deleted'
          : action.kind === 'set-in-stock'
            ? action.value
              ? 'Marked in stock'
              : 'Marked out of stock'
            : 'Moved';
      if (r.skipped.length > 0) {
        toast(
          `${verb} ${r.affected} · ${r.skipped.length} skipped (${r.skipped[0].reason})`,
          'info',
        );
      } else {
        toast(`${verb} ${r.affected} product${r.affected === 1 ? '' : 's'}`);
      }
      clearSelection();
      setBulkConfirm(null);
      setReloadToken((t) => t + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Bulk action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ---- Columns ----

  const columns: Column<AdminProductListItem>[] = [
    {
      key: 'select',
      header: (
        <SelectAllCheckbox
          checked={allVisibleSelected}
          indeterminate={someVisibleSelected}
          onChange={toggleAllVisible}
          disabled={visibleIds.length === 0}
        />
      ),
      render: (p) => (
        <input
          type="checkbox"
          aria-label={`Select ${p.name}`}
          className="h-4 w-4 cursor-pointer accent-navy"
          checked={selectedIds.has(p.id)}
          onChange={() => toggleRow(p.id)}
          // Stop the row click from doing anything unexpected (DataTable
          // doesn't currently treat the row as a link, but future-proofs
          // against that).
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: 'w-10',
    },
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/products/${p.id}/edit`}
            className="font-raleway font-semibold text-navy hover:text-amber"
          >
            {p.name}
          </Link>
          <span className="font-mono text-[11px] text-muted">{p.slug}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => (
        <span className="text-charcoal">{p.category?.name ?? '—'}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (p) => (
        <div className="flex flex-col leading-tight">
          <span className="font-raleway font-semibold text-navy">
            {formatPriceNGN(p.price)}
          </span>
          {p.comparePrice && p.comparePrice > p.price && (
            <span className="font-sans text-[11px] text-muted line-through">
              {formatPriceNGN(p.comparePrice)}
            </span>
          )}
        </div>
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) =>
        p.inStock ? (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
            In stock
          </span>
        ) : (
          <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger">
            Out
          </span>
        ),
    },
    {
      key: 'reviews',
      header: 'Reviews',
      render: (p) => (
        <span className="text-charcoal">
          {(p._count?.reviews ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/products/${p.id}/edit`}
            className="rounded-md p-1.5 text-muted hover:bg-page hover:text-navy"
            aria-label={`Edit ${p.name}`}
          >
            <Edit size={15} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setPendingDelete(p)}
            className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
            aria-label={`Delete ${p.name}`}
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
        title="Products"
        subtitle={data ? `${data.pagination.total.toLocaleString()} total` : 'Loading…'}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 rounded-btn border border-navy bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
            >
              <FileUp size={14} aria-hidden /> Import CSV
            </button>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
            >
              <Plus size={14} aria-hidden /> New product
            </Link>
          </div>
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
            placeholder="Search name, slug, brand…"
            className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
          aria-label="Filter by country of origin"
        >
          <option value="">All countries</option>
          {Object.values(COUNTRIES)
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as 'all' | 'in' | 'out')}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="all">All stock</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {/* Bulk action bar — only shown when at least one product is selected. */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-card border border-navy/30 bg-navy text-white shadow-card">
          <div className="flex items-center gap-2 px-4 py-3">
            <CheckSquare size={16} aria-hidden />
            <span className="font-raleway text-sm font-bold">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2 px-2 py-2">
            <BulkButton
              icon={<Package size={14} aria-hidden />}
              label="Mark in stock"
              onClick={() => runBulk({ kind: 'set-in-stock', value: true })}
              disabled={busy}
            />
            <BulkButton
              icon={<PackageX size={14} aria-hidden />}
              label="Mark out of stock"
              onClick={() => runBulk({ kind: 'set-in-stock', value: false })}
              disabled={busy}
            />
            <BulkCategoryButton
              categories={categories}
              disabled={busy}
              onPick={(slug) => runBulk({ kind: 'set-category', categorySlug: slug })}
            />
            <BulkButton
              icon={<Trash2 size={14} aria-hidden />}
              label="Delete"
              onClick={() => setBulkConfirm('delete')}
              disabled={busy}
              danger
            />
          </div>
          <button
            type="button"
            onClick={clearSelection}
            disabled={busy}
            className="ml-auto flex items-center gap-1 px-4 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white/80 hover:text-white disabled:opacity-50"
          >
            <X size={14} aria-hidden /> Clear
          </button>
        </div>
      )}

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        emptyState="No products match these filters."
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete product"
        message={
          pendingDelete
            ? `Permanently delete "${pendingDelete.name}"? Cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => !busy && setPendingDelete(null)}
      />

      <ConfirmDialog
        open={bulkConfirm === 'delete'}
        title={`Delete ${selectedIds.size} product${selectedIds.size === 1 ? '' : 's'}?`}
        message={
          `Cannot be undone. Products that have been ordered will be skipped — ` +
          `the API will tell you which ones (mark them out of stock instead).`
        }
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={() => runBulk({ kind: 'delete' })}
        onCancel={() => !busy && setBulkConfirm(null)}
      />

      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => setReloadToken((t) => t + 1)}
      />
    </div>
  );
}

// ---- Small components ----

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all on this page"
      className="h-4 w-4 cursor-pointer accent-navy disabled:cursor-not-allowed disabled:opacity-40"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

function BulkButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn transition disabled:opacity-50 ${
        danger
          ? 'bg-danger/20 text-white hover:bg-danger'
          : 'bg-white/10 text-white hover:bg-white hover:text-navy'
      }`}
    >
      {icon} {label}
    </button>
  );
}

/** Compact "Move to category" picker — opens a small dropdown of all
 *  categories. Top-level categories first; subcategories indented. */
function BulkCategoryButton({
  categories,
  disabled,
  onPick,
}: {
  categories: AdminCategory[];
  disabled?: boolean;
  onPick: (slug: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Build a 2-level nested list for display order: parent → its children.
  const ordered = useMemo(() => {
    const tops = categories.filter((c) => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
    const out: AdminCategory[] = [];
    for (const t of tops) {
      out.push(t);
      const subs = categories
        .filter((c) => c.parentId === t.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      out.push(...subs);
    }
    return out;
  }, [categories]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-btn bg-white/10 px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white transition hover:bg-white hover:text-navy disabled:opacity-50"
      >
        <FolderInput size={14} aria-hidden /> Move to…
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 max-h-72 w-64 overflow-auto rounded-card border border-border bg-white p-1 shadow-card">
          <button
            type="button"
            onClick={() => {
              onPick(null);
              setOpen(false);
            }}
            className="block w-full rounded-md px-3 py-1.5 text-left font-sans text-xs text-charcoal hover:bg-page"
          >
            — Uncategorised —
          </button>
          {ordered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onPick(c.slug);
                setOpen(false);
              }}
              className="block w-full rounded-md px-3 py-1.5 text-left font-sans text-xs text-charcoal hover:bg-page"
              style={{ paddingLeft: c.parentId ? 28 : 12 }}
            >
              {c.parentId && <span className="text-muted">↳ </span>}
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
