'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2, Tag, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { EditablePriceCell } from '@/components/admin/EditablePriceCell';
import { PriceHistoryDrawer } from '@/components/admin/PriceHistoryDrawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminListProducts,
  adminUpdateProductPrice,
  type AdminProductListItem,
} from '@/lib/api/admin';

/// /admin/discounts — Magnus, 2026-05-18.
/// Dedicated view for products that currently show a strike-through
/// discount (comparePrice > price). Lets an admin re-price inline or
/// clear the discount in one click without hunting for the row on
/// the main products list.
export default function AdminDiscountsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    items: AdminProductListItem[];
    pagination: { page: number; pages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [historyFor, setHistoryFor] = useState<AdminProductListItem | null>(null);
  const [pendingClear, setPendingClear] = useState<AdminProductListItem | null>(null);
  const [clearing, setClearing] = useState(false);

  const patchRow = (
    productId: string,
    next: { price: number; comparePrice: number | null },
  ) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((p) =>
              p.id === productId ? { ...p, ...next } : p,
            ),
          }
        : prev,
    );
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListProducts({
          page,
          limit: 25,
          discounted: true,
        });
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled)
          toast(e instanceof Error ? e.message : 'Failed to load discounts', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, reloadToken]);

  const handleClear = async () => {
    if (!pendingClear) return;
    setClearing(true);
    try {
      const r = await adminUpdateProductPrice(pendingClear.id, {
        price: pendingClear.price,
        comparePrice: null,
      });
      toast(`Cleared discount on "${pendingClear.name}"`);
      /// Row no longer matches discounted=true; drop it from the
      /// current page rather than triggering a full refetch.
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((p) => p.id !== pendingClear.id),
              pagination: {
                ...prev.pagination,
                total: Math.max(0, prev.pagination.total - 1),
              },
            }
          : prev,
      );
      patchRow(pendingClear.id, {
        price: r.newPrice,
        comparePrice: r.newComparePrice,
      });
      setPendingClear(null);
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to clear discount',
        'error',
      );
    } finally {
      setClearing(false);
    }
  };

  const columns: Column<AdminProductListItem>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.images[0]}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-border bg-page object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-md border border-border bg-page" />
          )}
          <div className="flex flex-col">
            <Link
              href={`/admin/products/${p.id}/edit`}
              className="font-raleway font-semibold text-navy hover:underline"
            >
              {p.name}
            </Link>
            <span className="font-mono text-[11px] text-muted">{p.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'Origin',
      render: (p) => (
        <span className="font-sans text-sm text-charcoal">
          {p.origin ?? '—'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (p) => (
        <EditablePriceCell
          productId={p.id}
          productName={p.name}
          price={p.price}
          comparePrice={p.comparePrice ?? null}
          onChanged={(next) => {
            /// If the admin edits the price-pair such that comparePrice
            /// no longer exceeds price, the row leaves the discounted
            /// set. Drop it locally instead of leaving a ghost.
            const stillDiscounted =
              next.comparePrice != null && next.comparePrice > next.price;
            if (!stillDiscounted) {
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      items: prev.items.filter((x) => x.id !== p.id),
                      pagination: {
                        ...prev.pagination,
                        total: Math.max(0, prev.pagination.total - 1),
                      },
                    }
                  : prev,
              );
              return;
            }
            patchRow(p.id, next);
          }}
          onOpenHistory={() => setHistoryFor(p)}
        />
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (p) => {
        const cp = p.comparePrice ?? 0;
        if (!cp || cp <= p.price) return <span className="text-muted">—</span>;
        const pct = Math.round(((cp - p.price) / cp) * 100);
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 font-raleway text-xs font-bold text-navy">
            <Tag size={11} aria-hidden />
            {pct}% off
          </span>
        );
      },
      className: 'whitespace-nowrap',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <button
          type="button"
          onClick={() => setPendingClear(p)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 font-sans text-xs font-semibold text-charcoal transition-colors hover:border-danger hover:bg-danger/5 hover:text-danger"
          aria-label={`Clear discount on ${p.name}`}
        >
          <X size={12} aria-hidden />
          Clear discount
        </button>
      ),
    },
  ];

  const items = data?.items ?? [];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Discounts"
        subtitle={
          loading
            ? 'Loading…'
            : `${data?.pagination.total ?? 0} product${
                (data?.pagination.total ?? 0) === 1 ? '' : 's'
              } currently showing a discount (comparePrice > price).`
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          <span className="font-sans text-sm">Loading discounts…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-page px-6 py-12 text-center">
          <Tag size={28} aria-hidden className="mx-auto text-muted" />
          <p className="mt-3 font-raleway text-lg font-bold text-navy">
            No products are discounted right now.
          </p>
          <p className="mt-1 font-sans text-sm text-muted">
            A product shows a discount when its compare-at price is greater than
            its live price. Set one from the product edit page or via the
            inline price cell on{' '}
            <Link
              href="/admin/products"
              className="text-navy underline hover:text-amber"
            >
              /admin/products
            </Link>
            .
          </p>
        </div>
      ) : (
        <DataTable
          rows={items}
          columns={columns}
          rowKey={(p) => p.id}
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
      )}

      <PriceHistoryDrawer
        product={
          historyFor
            ? {
                id: historyFor.id,
                name: historyFor.name,
                price: historyFor.price,
                comparePrice: historyFor.comparePrice ?? null,
              }
            : null
        }
        onClose={() => setHistoryFor(null)}
        onReverted={(next) => {
          patchRow(next.productId, {
            price: next.price,
            comparePrice: next.comparePrice,
          });
          setReloadToken((t) => t + 1);
        }}
      />

      <ConfirmDialog
        open={pendingClear !== null}
        title="Clear discount?"
        message={
          pendingClear
            ? `Remove the compare-at price on "${pendingClear.name}". The product will keep its current live price (${pendingClear.price.toLocaleString()}) and stop showing the strike-through and discount badge on the storefront.`
            : ''
        }
        confirmLabel="Clear discount"
        destructive
        busy={clearing}
        onConfirm={handleClear}
        onCancel={() => setPendingClear(null)}
      />
    </div>
  );
}
