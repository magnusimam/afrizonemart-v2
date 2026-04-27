'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { AdminCategory, AdminProductInput } from '@/lib/api/admin';
import {
  AttributesEditor,
  type ProductAttributes,
} from '@/components/admin/AttributesEditor';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface Props {
  initial?: Partial<AdminProductInput>;
  categories: AdminCategory[];
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (input: AdminProductInput) => void | Promise<void>;
  onCancel?: () => void;
}

const EMPTY_ATTRIBUTES: ProductAttributes = {
  bundles: [],
  features: [],
  specifications: [],
  aboutTitle: '',
  aboutBody: '',
  aboutImage: '/images/featured/for-her.jpg',
};

export function ProductForm({
  initial = {},
  categories,
  submitting = false,
  submitLabel = 'Save product',
  onSubmit,
  onCancel,
}: Props) {
  const [slug, setSlug] = useState(initial.slug ?? '');
  const [name, setName] = useState(initial.name ?? '');
  const [brand, setBrand] = useState(initial.brand ?? '');
  const [shortDescription, setShortDescription] = useState(initial.shortDescription ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [ingredients, setIngredients] = useState(initial.ingredients ?? '');
  const [price, setPrice] = useState(String(initial.price ?? ''));
  const [comparePrice, setComparePrice] = useState(
    initial.comparePrice != null ? String(initial.comparePrice) : '',
  );
  const [origin, setOrigin] = useState(initial.origin ?? '');
  const [inStock, setInStock] = useState(initial.inStock ?? true);
  const [categorySlug, setCategorySlug] = useState(initial.categorySlug ?? '');
  const [images, setImages] = useState<string[]>(initial.images ?? []);
  const [attributes, setAttributes] = useState<ProductAttributes>(() => ({
    ...EMPTY_ATTRIBUTES,
    ...((initial.attributes ?? {}) as Partial<ProductAttributes>),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: AdminProductInput = {
      slug: slug.trim(),
      name: name.trim(),
      brand: brand.trim() || null,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      ingredients: ingredients.trim() || null,
      price: Number(price) || 0,
      comparePrice: comparePrice.trim() ? Number(comparePrice) : null,
      origin: origin.trim() ? origin.trim().toUpperCase() : null,
      inStock,
      rating: initial.rating ?? 0,
      reviewCount: initial.reviewCount ?? 0,
      images,
      attributes: attributes as unknown as Record<string, unknown>,
      categorySlug: categorySlug || null,
    };

    void onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="flex flex-col gap-5 lg:col-span-8">
        <Section title="Basics">
          <Field label="Name" required>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Slug" required hint="lowercase-with-hyphens; used in URLs">
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Brand">
              <input
                value={brand ?? ''}
                onChange={(e) => setBrand(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Origin (2-letter code)" hint="e.g. NG, KE, ZA">
              <input
                value={origin ?? ''}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                maxLength={2}
                className={`${inputClass} uppercase`}
              />
            </Field>
          </div>
        </Section>

        <Section title="Copy">
          <Field label="Short description" hint="Used as the page meta description and product card summary">
            <textarea
              value={shortDescription ?? ''}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
          <Field label="Full description">
            <textarea
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className={inputClass}
            />
          </Field>
          <Field label="Ingredients / what's inside">
            <textarea
              value={ingredients ?? ''}
              onChange={(e) => setIngredients(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section
          title="Bundles, features, specs, variants, about"
          subtitle="The rich content shown on the product detail page."
        >
          <AttributesEditor value={attributes} onChange={setAttributes} />
        </Section>
      </div>

      <div className="flex flex-col gap-5 lg:col-span-4">
        <Section title="Pricing">
          <Field label="Price (NGN, whole units)" required>
            <input
              required
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Compare-at price (NGN)" hint="Was-price; leave blank for no discount badge">
            <input
              type="number"
              min={0}
              step={1}
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section title="Inventory">
          <label className="flex cursor-pointer items-center gap-3 rounded-input border border-border bg-page px-3 py-2.5 font-sans text-sm text-charcoal">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-navy"
            />
            In stock
          </label>
        </Section>

        <Section title="Organisation">
          <Field label="Category">
            <select
              value={categorySlug ?? ''}
              onChange={(e) => setCategorySlug(e.target.value)}
              className={inputClass}
            >
              <option value="">— Uncategorised —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section
          title="Gallery images"
          subtitle="Drag-drop or click to upload. First image is the primary; reorder with the arrows."
        >
          <ImageUploader multi value={images} onChange={setImages} folder="products" />
        </Section>

        <div className="sticky bottom-4 flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-btn bg-navy px-4 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} aria-hidden /> {submitting ? 'Saving…' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
      <header className="flex flex-col gap-0.5 border-b border-border pb-3">
        <h2 className="font-raleway text-base font-bold text-navy">{title}</h2>
        {subtitle && <p className="font-sans text-xs text-muted">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between gap-3">
        <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </span>
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
