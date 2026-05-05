'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ProductForm } from '@/components/admin/ProductForm';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminDeleteProduct,
  adminGetProduct,
  adminListCategories,
  adminUpdateProduct,
  type AdminCategory,
  type AdminProductInput,
  type AdminProductListItem,
} from '@/lib/api/admin';

interface PageProps {
  params: { id: string };
}

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<AdminProductListItem | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [p, cats] = await Promise.all([
          adminGetProduct(params.id),
          adminListCategories(),
        ]);
        setProduct(p);
        setCategories(cats.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load product');
      }
    })();
  }, [params.id]);

  const handleSubmit = async (input: AdminProductInput) => {
    setSubmitting(true);
    try {
      const updated = await adminUpdateProduct(params.id, input);
      setProduct(updated);
      toast(`Saved "${updated.name}"`);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setBusyDelete(true);
    try {
      await adminDeleteProduct(product.id);
      toast(`Deleted "${product.name}"`);
      router.push('/admin/products');
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
      setBusyDelete(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-xs font-semibold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ChevronLeft size={14} aria-hidden /> Products
      </Link>

      {error && (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-4 font-sans text-sm text-danger">
          {error}
        </div>
      )}

      {!error && !product && <p className="font-sans text-sm text-muted">Loading product…</p>}

      {product && (
        <>
          <AdminPageHeader
            title={product.name}
            subtitle={`Slug: ${product.slug}`}
            action={
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 rounded-btn border border-danger/40 bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:bg-danger hover:text-white"
              >
                <Trash2 size={14} aria-hidden /> Delete
              </button>
            }
          />

          <ProductForm
            initial={{
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              shortDescription: product.shortDescription,
              description: product.description,
              ingredients: product.ingredients,
              price: product.price,
              comparePrice: product.comparePrice,
              origin: product.origin,
              inStock: product.inStock,
              rating: product.rating,
              reviewCount: product.reviewCount,
              images: product.images,
              attributes: product.attributes as unknown as Record<string, unknown>,
              categorySlug: product.category?.slug ?? null,
              placements: (
                (product as unknown as {
                  placements?: Array<{
                    placement: string;
                    sortOrder?: number;
                    startsAt?: string | null;
                    endsAt?: string | null;
                    countries?: string[];
                  }>;
                }).placements ?? []
              ).map((p) => ({
                placement: p.placement,
                sortOrder: p.sortOrder ?? 100,
                startsAt: p.startsAt ?? null,
                endsAt: p.endsAt ?? null,
                countries: p.countries ?? [],
              })),
            }}
            categories={categories}
            submitting={submitting}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/products')}
          />

          <ConfirmDialog
            open={confirmDelete}
            title="Delete product"
            message={`Permanently delete "${product.name}"? This cannot be undone. (Products that have been ordered cannot be deleted — mark them out of stock instead.)`}
            confirmLabel="Delete"
            destructive
            busy={busyDelete}
            onConfirm={handleDelete}
            onCancel={() => !busyDelete && setConfirmDelete(false)}
          />
        </>
      )}
    </div>
  );
}
