'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Edit, FileUp, Plus, Search, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Column, DataTable } from '@/components/admin/DataTable';
import { ImportCsvDialog } from '@/components/admin/ImportCsvDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminDeleteProduct,
  adminListCategories,
  adminListProducts,
  type AdminCategory,
  type AdminProductListItem,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState<string>('');
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, category, stockFilter]);

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
  }, [page, debouncedQ, category, stockFilter, reloadToken]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteProduct(pendingDelete.id);
      toast(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
      setReloadToken((t) => t + 1);
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to delete',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminProductListItem>[] = [
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
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as 'all' | 'in' | 'out')}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="all">All stock</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

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

      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => setReloadToken((t) => t + 1)}
      />
    </div>
  );
}
