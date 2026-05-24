'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Plus, Send } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminListCategories,
  internCreateProductSubmission,
  internListMyProductSubmissions,
  internUpdateProductSubmission,
  type AdminCategory,
  type ProductSubmission,
  type ProductSubmissionInput,
} from '@/lib/api/admin';

/**
 * /admin/product-submissions — interns with `products.submit` draft a
 * full product (name, copy, price, category, images) for review. A
 * reviewer approves it into the live catalog. Rejected drafts can be
 * edited + resubmitted here.
 *
 * Deliberately simpler than the full admin ProductForm: no placements
 * or custom-fields editor — a reviewer can add those after approval
 * via the real product editor. This keeps the intern surface focused
 * on getting the core product data + images in.
 */

const STATUS_META: Record<
  ProductSubmission['status'],
  { label: string; cls: string }
> = {
  PENDING_REVIEW: { label: 'In review', cls: 'bg-amber/15 text-navy' },
  APPROVED: { label: 'Approved', cls: 'bg-success/10 text-success' },
  REJECTED: { label: 'Needs changes', cls: 'bg-danger/10 text-danger' },
};

const EMPTY: ProductSubmissionInput = {
  name: '',
  slug: '',
  brand: '',
  shortDescription: '',
  description: '',
  ingredients: '',
  price: 0,
  comparePrice: null,
  origin: '',
  weightKg: null,
  images: [],
  categorySlug: '',
};

export default function InternProductSubmissionsPage() {
  const [items, setItems] = useState<ProductSubmission[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<ProductSubmissionInput>(EMPTY);
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

  const set = <K extends keyof ProductSubmissionInput>(
    k: K,
    v: ProductSubmissionInput[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const topLevel = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const current = categories.find((c) => c.slug === form.categorySlug);
  const parent = current?.parentId
    ? categories.find((c) => c.id === current.parentId) ?? null
    : current ?? null;
  const subOptions = parent ? categories.filter((c) => c.parentId === parent.id) : [];
  const currentSubSlug = current?.parentId ? current.slug : '';

  const startEdit = (s: ProductSubmission) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      slug: s.slug,
      brand: s.brand ?? '',
      shortDescription: s.shortDescription ?? '',
      description: s.description ?? '',
      ingredients: s.ingredients ?? '',
      price: s.price,
      comparePrice: s.comparePrice,
      origin: s.origin ?? '',
      weightKg: s.weightKg,
      images: s.images,
      categorySlug: s.categorySlug ?? '',
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Product name is required', 'error');
      return;
    }
    if (!form.price || form.price <= 0) {
      toast('Enter a price greater than zero', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload: ProductSubmissionInput = {
        ...form,
        name: form.name.trim(),
        slug: form.slug?.trim() || undefined,
        brand: form.brand?.trim() || null,
        shortDescription: form.shortDescription?.trim() || null,
        description: form.description?.trim() || null,
        ingredients: form.ingredients?.trim() || null,
        origin: form.origin?.trim() ? form.origin.trim().toUpperCase() : null,
        categorySlug: form.categorySlug || null,
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
        subtitle="Draft a full product for review. Once a reviewer approves it, it goes live in the catalog and counts toward your payout."
      />

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        <div className="flex flex-col gap-5 lg:col-span-8">
          <Section title="Basics">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Product name *">
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={inputClass}
                  maxLength={240}
                  placeholder="e.g. Aki & Ukwa Combo Pack"
                />
              </Field>
              <Field label="Slug" hint="Optional — auto-generated from the name if blank.">
                <input
                  value={form.slug ?? ''}
                  onChange={(e) => set('slug', e.target.value)}
                  className={inputClass}
                  placeholder="aki-and-ukwa-combo"
                />
              </Field>
              <Field label="Brand">
                <input
                  value={form.brand ?? ''}
                  onChange={(e) => set('brand', e.target.value)}
                  className={inputClass}
                  maxLength={120}
                />
              </Field>
              <Field label="Origin" hint="2-letter country code, e.g. NG.">
                <input
                  value={form.origin ?? ''}
                  onChange={(e) => set('origin', e.target.value)}
                  className={inputClass}
                  maxLength={2}
                  placeholder="NG"
                />
              </Field>
            </div>
          </Section>

          <Section title="Description">
            <Field label="Short description" hint="One-line summary shown on cards.">
              <input
                value={form.shortDescription ?? ''}
                onChange={(e) => set('shortDescription', e.target.value)}
                className={inputClass}
                maxLength={500}
              />
            </Field>
            <Field label="Full description">
              <textarea
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                className={`${inputClass} min-h-[140px]`}
                maxLength={20000}
              />
            </Field>
            <Field label="Ingredients" hint="Optional — for food / consumables.">
              <textarea
                value={form.ingredients ?? ''}
                onChange={(e) => set('ingredients', e.target.value)}
                className={`${inputClass} min-h-[80px]`}
                maxLength={4000}
              />
            </Field>
          </Section>

          <Section title="Images" caption="Add the product gallery. The first image is the main one.">
            <ImageUploader
              multi
              value={form.images ?? []}
              onChange={(next) => set('images', next)}
              folder="products"
            />
          </Section>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-4">
          <Section title="Pricing">
            <Field label="Price (₦) *">
              <input
                type="number"
                min={0}
                value={form.price || ''}
                onChange={(e) => set('price', Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Compare-at price (₦)" hint="Optional — the crossed-out 'was' price.">
              <input
                type="number"
                min={0}
                value={form.comparePrice ?? ''}
                onChange={(e) =>
                  set('comparePrice', e.target.value ? Number(e.target.value) : null)
                }
                className={inputClass}
              />
            </Field>
            <Field label="Weight (kg)" hint="Optional — used for shipping quotes.">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.weightKg ?? ''}
                onChange={(e) =>
                  set('weightKg', e.target.value ? Number(e.target.value) : null)
                }
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Category">
            <Field label="Category">
              <select
                value={parent?.slug ?? ''}
                onChange={(e) => set('categorySlug', e.target.value)}
                className={inputClass}
              >
                <option value="">— Choose —</option>
                {topLevel.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {parent && subOptions.length > 0 && (
              <Field label="Subcategory" hint="Optional.">
                <select
                  value={currentSubSlug}
                  onChange={(e) => set('categorySlug', e.target.value || parent.slug)}
                  className={inputClass}
                >
                  <option value="">— None —</option>
                  {subOptions.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </Section>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : editingId ? (
                <Send size={15} aria-hidden />
              ) : (
                <Plus size={15} aria-hidden />
              )}
              {submitting
                ? 'Submitting…'
                : editingId
                  ? 'Resubmit for review'
                  : 'Submit for review'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-btn border border-border px-6 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-muted hover:border-navy hover:text-navy"
              >
                Cancel edit — start a new one
              </button>
            )}
          </div>
        </div>
      </form>

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
                      className="shrink-0 rounded-btn border border-border px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:border-navy"
                    >
                      Edit
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

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 shadow-card">
      <div>
        <h2 className="font-raleway text-lg font-bold text-navy">{title}</h2>
        {caption ? <p className="mt-1 font-sans text-sm text-muted">{caption}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint ? <span className="font-sans text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
