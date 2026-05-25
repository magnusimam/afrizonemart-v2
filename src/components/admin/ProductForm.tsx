'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import type {
  AdminCategory,
  AdminProductInput,
  CustomFieldDef,
  PlacementInput,
} from '@/lib/api/admin';
import { adminListCustomFields } from '@/lib/api/admin';
import {
  AttributesEditor,
  type ProductAttributes,
} from '@/components/admin/AttributesEditor';
import { DynamicFieldInput } from '@/components/admin/DynamicFieldInput';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { PlacementsEditor } from '@/components/admin/PlacementsEditor';
import { COUNTRIES } from '@/lib/countries';

interface Props {
  initial?: Partial<AdminProductInput>;
  categories: AdminCategory[];
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (input: AdminProductInput) => void | Promise<void>;
  onCancel?: () => void;
  /// Hide the manual placements section — it's a reviewer/admin
  /// concern (a product isn't pinned to shelves until it's live), so
  /// the intern submission flow hides it.
  hidePlacements?: boolean;
  /// Hide the in-stock toggle — stock is set by the reviewer at
  /// approval, not by the submitting intern.
  hideInventory?: boolean;
  /// Make the slug field optional — the submission flow auto-derives a
  /// slug from the name at approval, so interns needn't supply one.
  slugOptional?: boolean;
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
  hidePlacements = false,
  hideInventory = false,
  slugOptional = false,
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
  const [weightKg, setWeightKg] = useState(
    initial.weightKg != null ? String(initial.weightKg) : '',
  );
  const [inStock, setInStock] = useState(initial.inStock ?? true);
  const [categorySlug, setCategorySlug] = useState(initial.categorySlug ?? '');
  const [images, setImages] = useState<string[]>(initial.images ?? []);
  const [attributes, setAttributes] = useState<ProductAttributes>(() => ({
    ...EMPTY_ATTRIBUTES,
    ...((initial.attributes ?? {}) as Partial<ProductAttributes>),
  }));
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>(() => {
    const a = (initial.attributes ?? {}) as Record<string, unknown>;
    // Custom-field values are anything in `attributes` that ISN'T one of
    // the legacy hardcoded keys; we read them back when defs load below.
    return a;
  });
  const [placements, setPlacements] = useState<PlacementInput[]>(
    (initial.placements ?? []).map((p) => ({
      placement: p.placement,
      sortOrder: p.sortOrder,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      countries: p.countries ?? [],
    })),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await adminListCustomFields({ scope: 'PRODUCT' });
        if (!cancelled) setCustomFieldDefs(r.items);
      } catch {
        /* fail-soft: form still works without custom fields */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCustomValue = (key: string, value: unknown) => {
    setCustomValues((prev) => ({ ...prev, [key]: value }));
  };

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
      weightKg: weightKg.trim() ? Number(weightKg) : null,
      inStock,
      rating: initial.rating ?? 0,
      reviewCount: initial.reviewCount ?? 0,
      images,
      // Merge: legacy structured attributes (bundles/features/specs/about)
      // first, then custom-field values overlay on top using their own keys.
      attributes: {
        ...(attributes as unknown as Record<string, unknown>),
        ...customValues,
      },
      categorySlug: categorySlug || null,
      placements,
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
          <Field
            label="Slug"
            required={!slugOptional}
            hint={
              slugOptional
                ? 'Optional — auto-generated from the name if left blank.'
                : 'lowercase-with-hyphens; used in URLs'
            }
          >
            <input
              required={!slugOptional}
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
            <Field
              label="Weight (kg)"
              hint="Used by the shipping quote to pick the right rate. Leave blank to use the system default (0.5 kg)."
            >
              <input
                type="number"
                min={0}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className={inputClass}
                placeholder="e.g. 1.5"
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

        {customFieldDefs.length > 0 && (
          <Section
            title="Custom fields"
            subtitle="Fields added from Settings → Custom Fields. Render automatically on the storefront."
          >
            <div className="grid grid-cols-1 gap-4">
              {customFieldDefs.map((def) => (
                <DynamicFieldInput
                  key={def.id}
                  def={def}
                  value={customValues[def.key]}
                  onChange={(v) => setCustomValue(def.key, v)}
                />
              ))}
            </div>
          </Section>
        )}

        {!hidePlacements && (
        <Section
          title="Where this product appears"
          subtitle="Auto-derived chips (read-only) reflect what the product's data already does. Manual placements pin the product to specific pages, shelves, hero rotations or custom CMS pages."
        >
          <PlacementsEditor
            value={placements}
            onChange={setPlacements}
            autoChips={(() => {
              const compare =
                comparePrice.trim() && Number(comparePrice) > Number(price);
              const originCountry = origin
                ? COUNTRIES[origin.toUpperCase() as keyof typeof COUNTRIES]
                : null;
              return [
                {
                  label: compare ? 'On sale' : 'Not on sale',
                  active: !!compare,
                  hint: compare
                    ? 'Auto: comparePrice > price → shows on /deals + /special-discount'
                    : 'Set a higher compare-at price to enable.',
                },
                {
                  label: originCountry ? `Origin: ${originCountry.name}` : 'Origin: not set',
                  active: !!originCountry,
                  hint: originCountry
                    ? `Auto: surfaces on /shop/country/${originCountry.slug} and the New Arrivals map.`
                    : 'Pick an origin country to enable country pages.',
                },
                {
                  label: categorySlug
                    ? `Category: ${categorySlug}`
                    : 'Category: not set',
                  active: !!categorySlug,
                  hint: 'Auto: surfaces on the matching category page and shelves.',
                },
                {
                  label: inStock ? 'In stock' : 'Out of stock — hidden',
                  active: inStock,
                  hint: inStock
                    ? 'Visible to customers.'
                    : 'Hidden from public listings until back in stock.',
                },
                {
                  label: 'New arrival (auto)',
                  active: true,
                  hint: 'Products created in the last 30 days appear in /new-arrivals automatically. Use the New Arrivals — pin placement below to keep an older product featured.',
                },
              ];
            })()}
          />
        </Section>
        )}
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

        {!hideInventory && (
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
        )}

        <Section title="Organisation">
          {(() => {
            // Resolve which category the product is currently assigned to,
            // and split it into "top-level + (optional) subcategory" so we
            // can render two cascading selects. The product's `categorySlug`
            // is always the leaf — pointing at a sub when one is selected,
            // else the top-level category.
            const topLevel = categories.filter((c) => !c.parentId);
            const current = categories.find((c) => c.slug === categorySlug);
            const parent = current?.parentId
              ? categories.find((c) => c.id === current.parentId) ?? null
              : current ?? null;
            const subOptions = parent
              ? categories.filter((c) => c.parentId === parent.id)
              : [];
            const currentSubSlug = current?.parentId ? current.slug : '';

            const onParentChange = (slug: string) => {
              // Switching the parent always clears any previously chosen
              // subcategory — the old sub may not belong to the new parent.
              setCategorySlug(slug);
            };
            const onSubChange = (slug: string) => {
              // Empty sub means "stay on the parent" — fall back to the
              // currently selected top-level slug.
              setCategorySlug(slug || parent?.slug || '');
            };

            return (
              <>
                <Field label="Category">
                  <select
                    value={parent?.slug ?? ''}
                    onChange={(e) => onParentChange(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— Uncategorised —</option>
                    {topLevel.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {parent && (
                  <Field
                    label="Subcategory"
                    hint={
                      subOptions.length === 0
                        ? `No subcategories under "${parent.name}" yet — create one in /admin/categories.`
                        : 'Optional — leave empty to keep the product at the top-level category.'
                    }
                  >
                    <select
                      value={currentSubSlug}
                      onChange={(e) => onSubChange(e.target.value)}
                      disabled={subOptions.length === 0}
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
              </>
            );
          })()}
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
