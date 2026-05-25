'use client';

import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ProductForm } from '@/components/admin/ProductForm';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminListCategories,
  internCreateProductSubmission,
  internListMyProductSubmissions,
  internUpdateProductSubmission,
  type AdminCategory,
  type AdminProductInput,
  type ProductSubmission,
  type ProductSubmissionInput,
} from '@/lib/api/admin';

/**
 * /admin/product-submissions — interns with `products.submit` draft a
 * full product for review. A reviewer approves it into the live
 * catalog. Rejected drafts can be edited + resubmitted here.
 *
 * Uses the SAME detailed `ProductForm` as the admin product editor so
 * interns get every standard-product field (bundles, features, specs,
 * about, gallery, pricing, category) — not a stripped-down form. The
 * only sections hidden are reviewer concerns: manual placements and
 * the in-stock toggle are set after approval, and slug is optional
 * (auto-derived from the name). Everything an intern enters, including
 * the `attributes` JSON, is carried straight onto the live Product at
 * approval time.
 */

const STATUS_META: Record<
  ProductSubmission['status'],
  { label: string; cls: string }
> = {
  PENDING_REVIEW: { label: 'In review', cls: 'bg-amber/15 text-navy' },
  APPROVED: { label: 'Approved', cls: 'bg-success/10 text-success' },
  REJECTED: { label: 'Needs changes', cls: 'bg-danger/10 text-danger' },
};

/// Map a saved submission back into the form's input shape so a
/// rejected draft re-opens with everything (incl. bundles/specs in
/// `attributes`) populated. Reviewer-only fields fall back to defaults.
function submissionToInitial(s: ProductSubmission): Partial<AdminProductInput> {
  return {
    slug: s.slug,
    name: s.name,
    brand: s.brand,
    shortDescription: s.shortDescription,
    description: s.description,
    ingredients: s.ingredients,
    price: s.price,
    comparePrice: s.comparePrice,
    origin: s.origin,
    weightKg: s.weightKg,
    images: s.images,
    attributes: s.attributes,
    categorySlug: s.categorySlug,
  };
}

export default function InternProductSubmissionsPage() {
  const [items, setItems] = useState<ProductSubmission[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    try {
      const res = await internListMyProductSubmissions();
      setItems(res.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      setItems([]);
    }
  };

  useEffect(() => {
    void refresh();
    void adminListCategories()
      .then((r) => setCategories(r.items))
      .catch(() => setCategories([]));
  }, []);

  const editing = editingId
    ? (items?.find((s) => s.id === editingId) ?? null)
    : null;

  const startEdit = (s: ProductSubmission) => {
    setEditingId(s.id);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => setEditingId(null);

  const handleSubmit = async (input: AdminProductInput) => {
    setSubmitting(true);
    try {
      const payload: ProductSubmissionInput = {
        name: input.name.trim(),
        slug: input.slug?.trim() || undefined,
        brand: input.brand ?? null,
        shortDescription: input.shortDescription ?? null,
        description: input.description ?? null,
        ingredients: input.ingredients ?? null,
        price: input.price,
        comparePrice: input.comparePrice ?? null,
        origin: input.origin ?? null,
        weightKg: input.weightKg ?? null,
        images: input.images,
        attributes: input.attributes,
        categorySlug: input.categorySlug ?? null,
      };
      if (editingId) {
        await internUpdateProductSubmission(editingId, payload);
        toast('Submission updated + sent for review');
      } else {
        await internCreateProductSubmission(payload);
        toast('Product submitted for review');
      }
      resetForm();
      await refresh();
    } catch (err) {
      toast(
        err instanceof HttpApiError || err instanceof Error ? err.message : 'Submit failed',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title={editingId ? 'Edit submission' : 'Submit a product'}
        subtitle="Fill in the full product details. Once a reviewer approves it, it goes live in the catalog and counts toward your payout."
      />

      <ProductForm
        key={editingId ?? 'new'}
        initial={editing ? submissionToInitial(editing) : undefined}
        categories={categories}
        submitting={submitting}
        submitLabel={editingId ? 'Resubmit for review' : 'Submit for review'}
        hidePlacements
        hideInventory
        slugOptional
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
      />

      {/* My submissions */}
      <section className="rounded-card border border-border bg-white">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-raleway text-lg font-bold text-navy">My submissions</h2>
        </header>
        {items === null ? (
          <p className="p-5 font-sans text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-5 font-sans text-sm text-muted">
            No submissions yet. Fill the form above to submit your first product.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1">
                    <p className="font-raleway font-semibold text-navy">{s.name}</p>
                    <p className="font-sans text-xs text-muted">
                      ₦{s.price.toLocaleString()} · {new Date(s.createdAt).toLocaleDateString()}
                      {s.createdProductId ? ' · published' : ''}
                    </p>
                    {s.status === 'REJECTED' && s.rejectionReason ? (
                      <p className="mt-1 font-sans text-xs text-danger">
                        Reviewer: {s.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                  {s.status !== 'APPROVED' ? (
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className={`shrink-0 rounded-btn border px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn ${
                        editingId === s.id
                          ? 'border-navy bg-navy text-white'
                          : 'border-border text-navy hover:border-navy'
                      }`}
                    >
                      {editingId === s.id ? 'Editing' : 'Edit'}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
