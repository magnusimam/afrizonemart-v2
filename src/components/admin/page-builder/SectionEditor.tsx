'use client';

import { Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import type { SectionType } from '@/lib/api/page-builder';

/**
 * Per-section configuration form. Switches on section type and renders
 * the right fields. Common fields (headline / subheadline / accent) are
 * handled by the parent — this component owns only the type-specific
 * `config` blob.
 *
 * Form state is uncontrolled w.r.t. parent — parent passes the value
 * once and receives change events via onChange. Saves are explicit
 * (parent calls the API on Save click).
 */
interface Props {
  type: SectionType;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function SectionEditor({ type, value, onChange }: Props) {
  switch (type) {
    case 'hero':
      return <HeroEditor value={value} onChange={onChange} />;
    case 'product-grid':
      return <ProductGridEditor value={value} onChange={onChange} />;
    case 'category-shelf':
      return <CategoryShelfEditor value={value} onChange={onChange} />;
    case 'image-banner':
      return <ImageBannerEditor value={value} onChange={onChange} />;
    case 'rich-text':
      return <RichTextEditor value={value} onChange={onChange} />;
    case 'africa-map':
      return <AfricaMapEditor value={value} onChange={onChange} />;
    case 'newsletter':
      return <NewsletterEditor value={value} onChange={onChange} />;
    case 'trust-bar':
      return <TrustBarEditor value={value} onChange={onChange} />;
    case 'quotation-form':
      return <QuotationFormEditor value={value} onChange={onChange} />;
    case 'country-shelf':
      return <CountryShelfEditor value={value} onChange={onChange} />;
    case 'feature-cards':
      return <FeatureCardsEditor value={value} onChange={onChange} />;
    case 'services-grid':
      return <ServicesGridEditor value={value} onChange={onChange} />;
    case 'text-strip':
      return <TextStripEditor value={value} onChange={onChange} />;
    case 'rewards-tiers':
      return <RewardsTiersEditor value={value} onChange={onChange} />;
    case 'cta-cards':
      return <CtaCardsEditor value={value} onChange={onChange} />;
    case 'marquee-strip':
      return <MarqueeStripEditor value={value} onChange={onChange} />;
    case 'final-cta':
      return <FinalCtaEditor value={value} onChange={onChange} />;
    default:
      return (
        <p className="font-sans text-sm text-muted">
          No editor for section type &quot;{type}&quot; yet.
        </p>
      );
  }
}

// ---- Hero ----

interface HeroSlide {
  imageUrl: string;
  imageAlt: string;
  eyebrow?: string | null;
  headline: string;
  subheadline?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  textAlign?: 'left' | 'center' | 'right' | null;
}

function HeroEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const slides = (value.slides as HeroSlide[] | undefined) ?? [];
  const autoplayMs = (value.autoplayMs as number | undefined) ?? 6000;
  const showDots = (value.showDots as boolean | undefined) ?? true;

  const updateSlide = (i: number, patch: Partial<HeroSlide>) => {
    const next = [...slides];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, slides: next });
  };
  const addSlide = () =>
    onChange({
      ...value,
      slides: [
        ...slides,
        { imageUrl: '', imageAlt: '', headline: 'New slide headline' } as HeroSlide,
      ],
    });
  const removeSlide = (i: number) => {
    const next = slides.filter((_, idx) => idx !== i);
    onChange({ ...value, slides: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Autoplay (ms)" hint="0 to disable">
          <input
            type="number"
            min={0}
            max={60000}
            value={autoplayMs}
            onChange={(e) =>
              onChange({ ...value, autoplayMs: Number(e.target.value) || 0 })
            }
            className={inputClass}
          />
        </Field>
        <label className="mb-1.5 flex items-center gap-2 font-sans text-sm text-charcoal">
          <input
            type="checkbox"
            checked={showDots}
            onChange={(e) => onChange({ ...value, showDots: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-navy"
          />
          Show pagination dots
        </label>
      </div>

      <div className="flex flex-col gap-4">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-page/40 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
                Slide {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeSlide(i)}
                className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                aria-label={`Remove slide ${i + 1}`}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>

            <div className="mb-3">
              <Field label="Image" hint="Upload to R2 — used as the slide background">
                <ImageUploader
                  value={slide.imageUrl ?? ''}
                  onChange={(url) => updateSlide(i, { imageUrl: url ?? '' })}
                  folder="hero-slides"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Image alt text" hint="Required for SEO + screen readers">
                <input
                  value={slide.imageAlt}
                  onChange={(e) => updateSlide(i, { imageAlt: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Eyebrow (small text above headline)">
                <input
                  value={slide.eyebrow ?? ''}
                  onChange={(e) => updateSlide(i, { eyebrow: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Headline" hint="Main message — required">
                <input
                  value={slide.headline}
                  onChange={(e) => updateSlide(i, { headline: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Subheadline">
                <input
                  value={slide.subheadline ?? ''}
                  onChange={(e) => updateSlide(i, { subheadline: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="CTA button label">
                <input
                  value={slide.ctaLabel ?? ''}
                  onChange={(e) => updateSlide(i, { ctaLabel: e.target.value })}
                  className={inputClass}
                  placeholder="Shop now"
                />
              </Field>
              <Field label="CTA link URL">
                <input
                  value={slide.ctaHref ?? ''}
                  onChange={(e) => updateSlide(i, { ctaHref: e.target.value })}
                  className={inputClass}
                  placeholder="/shop"
                />
              </Field>
              <Field label="Text alignment">
                <select
                  value={slide.textAlign ?? 'left'}
                  onChange={(e) =>
                    updateSlide(i, {
                      textAlign: e.target.value as HeroSlide['textAlign'],
                    })
                  }
                  className={inputClass}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Field>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSlide}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-navy px-4 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
      >
        <Plus size={14} aria-hidden /> Add slide
      </button>
    </div>
  );
}

// ---- Product grid ----

type ProductSourceKind =
  | 'category'
  | 'subcategory'
  | 'placement'
  | 'on-sale'
  | 'new-arrivals'
  | 'manual';

function ProductGridEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const source = (value.source as { kind: ProductSourceKind } & Record<string, unknown>) ?? {
    kind: 'on-sale',
  };
  const columns = (value.columns as number | undefined) ?? 4;
  const rows = (value.rows as number | undefined) ?? 2;
  const viewAllHref = (value.viewAllHref as string | undefined) ?? '';
  const viewAllLabel = (value.viewAllLabel as string | undefined) ?? '';

  const setSource = (kind: ProductSourceKind) => {
    let s: Record<string, unknown> = { kind };
    if (kind === 'category') s = { kind, categorySlug: '' };
    if (kind === 'subcategory') s = { kind, subcategorySlug: '' };
    if (kind === 'placement') s = { kind, placementKey: '' };
    if (kind === 'manual') s = { kind, productSlugs: [] };
    onChange({ ...value, source: s });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Product source">
        <select
          value={source.kind}
          onChange={(e) => setSource(e.target.value as ProductSourceKind)}
          className={inputClass}
        >
          <option value="category">Category — show all products in a category</option>
          <option value="subcategory">Subcategory</option>
          <option value="placement">
            Placement — products tagged with a placement key
          </option>
          <option value="on-sale">On sale — products with a comparePrice</option>
          <option value="new-arrivals">New arrivals — newest first</option>
          <option value="manual">Manual — specific product slugs</option>
        </select>
      </Field>

      {source.kind === 'category' && (
        <Field label="Category slug" hint="e.g. groceries, beauty, books">
          <input
            value={(source.categorySlug as string | undefined) ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                source: { kind: 'category', categorySlug: e.target.value },
              })
            }
            className={`${inputClass} font-mono`}
          />
        </Field>
      )}

      {source.kind === 'subcategory' && (
        <Field label="Subcategory slug">
          <input
            value={(source.subcategorySlug as string | undefined) ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                source: { kind: 'subcategory', subcategorySlug: e.target.value },
              })
            }
            className={`${inputClass} font-mono`}
          />
        </Field>
      )}

      {source.kind === 'placement' && (
        <Field label="Placement key" hint="Set on products via the placement field">
          <input
            value={(source.placementKey as string | undefined) ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                source: { kind: 'placement', placementKey: e.target.value },
              })
            }
            className={`${inputClass} font-mono`}
          />
        </Field>
      )}

      {source.kind === 'manual' && (
        <Field
          label="Product slugs"
          hint="One per line — order is preserved"
        >
          <textarea
            rows={5}
            value={((source.productSlugs as string[] | undefined) ?? []).join('\n')}
            onChange={(e) =>
              onChange({
                ...value,
                source: {
                  kind: 'manual',
                  productSlugs: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
            className={`${inputClass} font-mono`}
          />
        </Field>
      )}

      <Field label="Columns (desktop)">
        <input
          type="number"
          min={2}
          max={6}
          value={columns}
          onChange={(e) => onChange({ ...value, columns: Number(e.target.value) || 4 })}
          className={inputClass}
        />
      </Field>
      <Field label="Rows" hint={`Will show ${columns * rows} products`}>
        <input
          type="number"
          min={1}
          max={6}
          value={rows}
          onChange={(e) => onChange({ ...value, rows: Number(e.target.value) || 2 })}
          className={inputClass}
        />
      </Field>
      <Field label='"View all" button URL'>
        <input
          value={viewAllHref}
          onChange={(e) => onChange({ ...value, viewAllHref: e.target.value })}
          className={inputClass}
          placeholder="/shop/groceries"
        />
      </Field>
      <Field label='"View all" button label'>
        <input
          value={viewAllLabel}
          onChange={(e) => onChange({ ...value, viewAllLabel: e.target.value })}
          className={inputClass}
          placeholder="View all"
        />
      </Field>
    </div>
  );
}

// ---- Category shelf ----

function CategoryShelfEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const slugs = (value.categorySlugs as string[] | undefined) ?? [];
  const layout = (value.layout as 'grid' | 'scroll' | undefined) ?? 'grid';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Category slugs" hint="One per line — order is preserved">
        <textarea
          rows={6}
          value={slugs.join('\n')}
          onChange={(e) =>
            onChange({
              ...value,
              categorySlugs: e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className={`${inputClass} font-mono`}
        />
      </Field>
      <Field label="Layout">
        <select
          value={layout}
          onChange={(e) =>
            onChange({ ...value, layout: e.target.value as 'grid' | 'scroll' })
          }
          className={inputClass}
        >
          <option value="grid">Grid (wraps to multiple rows)</option>
          <option value="scroll">Scroll (horizontal carousel)</option>
        </select>
      </Field>
    </div>
  );
}

// ---- Image banner ----

function ImageBannerEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const imageUrl = (value.imageUrl as string | undefined) ?? '';
  const imageAlt = (value.imageAlt as string | undefined) ?? '';
  const href = (value.href as string | undefined) ?? '';
  const overlayHeadline = (value.overlayHeadline as string | undefined) ?? '';
  const overlayCtaLabel = (value.overlayCtaLabel as string | undefined) ?? '';
  const width = (value.width as 'full' | 'container' | undefined) ?? 'container';

  return (
    <div className="flex flex-col gap-4">
      <Field label="Image">
        <ImageUploader
          value={imageUrl}
          onChange={(url) => onChange({ ...value, imageUrl: url ?? '' })}
          folder="banners"
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Image alt text" hint="Required">
          <input
            value={imageAlt}
            onChange={(e) => onChange({ ...value, imageAlt: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Click-through URL">
          <input
            value={href}
            onChange={(e) => onChange({ ...value, href: e.target.value })}
            className={inputClass}
            placeholder="/deals"
          />
        </Field>
        <Field label="Overlay headline (optional)">
          <input
            value={overlayHeadline}
            onChange={(e) => onChange({ ...value, overlayHeadline: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Overlay CTA label">
          <input
            value={overlayCtaLabel}
            onChange={(e) => onChange({ ...value, overlayCtaLabel: e.target.value })}
            className={inputClass}
            placeholder="Shop now"
          />
        </Field>
        <Field label="Width">
          <select
            value={width}
            onChange={(e) =>
              onChange({ ...value, width: e.target.value as 'full' | 'container' })
            }
            className={inputClass}
          >
            <option value="container">Container (max-width)</option>
            <option value="full">Full bleed (edge-to-edge)</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

// ---- Rich text ----

function RichTextEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const html = (value.html as string | undefined) ?? '';
  const align = (value.align as 'left' | 'center' | undefined) ?? 'left';
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Body HTML"
        hint="Plain HTML for now — TipTap WYSIWYG editor coming soon"
      >
        <textarea
          rows={10}
          value={html}
          onChange={(e) => onChange({ ...value, html: e.target.value })}
          className={`${inputClass} font-mono`}
        />
      </Field>
      <Field label="Alignment">
        <select
          value={align}
          onChange={(e) =>
            onChange({ ...value, align: e.target.value as 'left' | 'center' })
          }
          className={inputClass}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
        </select>
      </Field>
    </div>
  );
}

// ---- Africa map ----

function AfricaMapEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Headline (override)">
        <input
          value={(value.headline as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Subheadline">
        <input
          value={(value.subheadline as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, subheadline: e.target.value })}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// ---- Newsletter ----

function NewsletterEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Headline">
        <input
          value={(value.headline as string | undefined) ?? 'Stay in the loop'}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Subheadline">
        <input
          value={(value.subheadline as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, subheadline: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Subscribe button label">
        <input
          value={(value.ctaLabel as string | undefined) ?? 'Subscribe'}
          onChange={(e) => onChange({ ...value, ctaLabel: e.target.value })}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// ---- Trust bar ----

interface TrustItem {
  icon: string;
  label: string;
  sublabel?: string | null;
}

function TrustBarEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const items = (value.items as TrustItem[] | undefined) ?? [];
  const updateItem = (i: number, patch: Partial<TrustItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, items: next });
  };
  const addItem = () =>
    onChange({
      ...value,
      items: [...items, { icon: 'shield-check', label: 'New item' } as TrustItem],
    });
  const removeItem = (i: number) =>
    onChange({ ...value, items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_2fr_2fr_auto] items-end gap-2 rounded-card border border-border bg-page/40 p-3"
        >
          <Field label="Icon" hint="lucide-react name (kebab-case)">
            <input
              value={it.icon}
              onChange={(e) => updateItem(i, { icon: e.target.value })}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Label">
            <input
              value={it.label}
              onChange={(e) => updateItem(i, { label: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Sublabel">
            <input
              value={it.sublabel ?? ''}
              onChange={(e) => updateItem(i, { sublabel: e.target.value })}
              className={inputClass}
            />
          </Field>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger"
            aria-label={`Remove item ${i + 1}`}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
      >
        <Plus size={14} aria-hidden /> Add item
      </button>
    </div>
  );
}

// ---- Quotation form ----

function QuotationFormEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Headline">
        <input
          value={(value.headline as string | undefined) ?? 'Need a custom quote?'}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Subheadline">
        <input
          value={(value.subheadline as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, subheadline: e.target.value })}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// ---- Country shelf ----

function CountryShelfEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const headline = (value.headline as string | undefined) ?? 'Shop By Country';
  const countries = ((value.countryCodes as string[] | undefined) ?? []).join(', ');
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Section headline">
        <input
          value={headline}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field
        label="Countries"
        hint="ISO-2 codes, comma-separated. Empty = all African countries."
      >
        <input
          value={countries}
          onChange={(e) =>
            onChange({
              ...value,
              countryCodes: e.target.value
                .split(',')
                .map((c) => c.trim().toUpperCase())
                .filter((c) => c.length === 2),
            })
          }
          className={`${inputClass} font-mono uppercase`}
          placeholder="NG, KE, ZA"
        />
      </Field>
    </div>
  );
}

// ---- Feature cards ----

interface FeatureCard {
  imageUrl: string;
  imageAlt: string;
  name: string;
  description?: string | null;
  href: string;
  ctaLabel?: string | null;
}

function FeatureCardsEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const cards = (value.cards as FeatureCard[] | undefined) ?? [];
  const cardsPerRow = (value.cardsPerRow as number | undefined) ?? 3;

  const updateCard = (i: number, patch: Partial<FeatureCard>) => {
    const next = [...cards];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, cards: next });
  };
  const addCard = () =>
    onChange({
      ...value,
      cards: [
        ...cards,
        { imageUrl: '', imageAlt: '', name: 'New card', href: '/' } as FeatureCard,
      ],
    });
  const removeCard = (i: number) =>
    onChange({ ...value, cards: cards.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-4">
      <Field label="Cards per row (desktop)">
        <input
          type="number"
          min={1}
          max={4}
          value={cardsPerRow}
          onChange={(e) =>
            onChange({ ...value, cardsPerRow: Number(e.target.value) || 3 })
          }
          className={inputClass}
        />
      </Field>

      {cards.map((c, i) => (
        <div key={i} className="rounded-card border border-border bg-page/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
              Card {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCard(i)}
              className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label={`Remove card ${i + 1}`}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>

          <div className="mb-3">
            <Field label="Image">
              <ImageUploader
                value={c.imageUrl ?? ''}
                onChange={(url) => updateCard(i, { imageUrl: url ?? '' })}
                folder="banners"
              />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Image alt text" hint="Required">
              <input
                value={c.imageAlt}
                onChange={(e) => updateCard(i, { imageAlt: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Card title">
              <input
                value={c.name}
                onChange={(e) => updateCard(i, { name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={2}
                value={c.description ?? ''}
                onChange={(e) => updateCard(i, { description: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Link URL">
              <input
                value={c.href}
                onChange={(e) => updateCard(i, { href: e.target.value })}
                className={inputClass}
                placeholder="/shop/groceries"
              />
            </Field>
            <Field label="CTA button label (optional)">
              <input
                value={c.ctaLabel ?? ''}
                onChange={(e) => updateCard(i, { ctaLabel: e.target.value })}
                className={inputClass}
                placeholder="Shop now"
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCard}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-navy px-4 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
      >
        <Plus size={14} aria-hidden /> Add card
      </button>
    </div>
  );
}

// ---- Services grid ----

interface ServiceItem {
  icon: string;
  name: string;
  href: string;
}

function ServicesGridEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const services = (value.services as ServiceItem[] | undefined) ?? [];
  const heroCard = value.heroCard as
    | { imageUrl: string; imageAlt: string; href: string }
    | null
    | undefined;

  const updateService = (i: number, patch: Partial<ServiceItem>) => {
    const next = [...services];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, services: next });
  };
  const addService = () =>
    onChange({
      ...value,
      services: [...services, { icon: 'shield-check', name: 'New service', href: '/' }],
    });
  const removeService = (i: number) =>
    onChange({ ...value, services: services.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-page/40 p-4">
        <p className="mb-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          Hero card (optional — left side)
        </p>
        <div className="mb-3">
          <Field label="Image">
            <ImageUploader
              value={heroCard?.imageUrl ?? ''}
              onChange={(url) =>
                onChange({
                  ...value,
                  heroCard: url
                    ? {
                        imageUrl: url,
                        imageAlt: heroCard?.imageAlt ?? '',
                        href: heroCard?.href ?? '/',
                      }
                    : null,
                })
              }
              folder="banners"
            />
          </Field>
        </div>
        {heroCard && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Alt text">
              <input
                value={heroCard.imageAlt}
                onChange={(e) =>
                  onChange({ ...value, heroCard: { ...heroCard, imageAlt: e.target.value } })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Link URL">
              <input
                value={heroCard.href}
                onChange={(e) =>
                  onChange({ ...value, heroCard: { ...heroCard, href: e.target.value } })
                }
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </div>

      <p className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        Service tiles
      </p>
      {services.map((s, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_2fr_2fr_auto] items-end gap-2 rounded-card border border-border bg-page/40 p-3"
        >
          <Field label="Icon" hint="lucide-react name">
            <input
              value={s.icon}
              onChange={(e) => updateService(i, { icon: e.target.value })}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Service name">
            <input
              value={s.name}
              onChange={(e) => updateService(i, { name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Link URL">
            <input
              value={s.href}
              onChange={(e) => updateService(i, { href: e.target.value })}
              className={inputClass}
            />
          </Field>
          <button
            type="button"
            onClick={() => removeService(i)}
            className="rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger"
            aria-label={`Remove service ${i + 1}`}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addService}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
      >
        <Plus size={14} aria-hidden /> Add service
      </button>
    </div>
  );
}

// ---- Text strip ----

function TextStripEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Text" hint="Single line — uppercase styling auto-applied">
        <input
          value={(value.text as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field
        label="Background color (override)"
        hint="Falls back to the section's accent color (default: amber)"
      >
        <input
          value={(value.bgColor as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, bgColor: e.target.value })}
          className={`${inputClass} font-mono`}
          placeholder="amber, navy, or #hex"
        />
      </Field>
    </div>
  );
}

// ---- Rewards tiers ----

interface RewardsTier {
  name: string;
  minPoints: number;
  accentColor?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  intro?: string | null;
  perks: string[];
  readMoreHref?: string | null;
  readMoreLabel?: string | null;
}

function RewardsTiersEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const tiers = (value.tiers as RewardsTier[] | undefined) ?? [];
  const layout = (value.layout as 'cards' | 'ladder' | undefined) ?? 'cards';

  const updateTier = (i: number, patch: Partial<RewardsTier>) => {
    const next = [...tiers];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, tiers: next });
  };
  const addTier = () =>
    onChange({
      ...value,
      tiers: [
        ...tiers,
        { name: 'New tier', minPoints: 0, perks: [] } as RewardsTier,
      ],
    });
  const removeTier = (i: number) =>
    onChange({ ...value, tiers: tiers.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-4">
      <Field label="Layout">
        <select
          value={layout}
          onChange={(e) =>
            onChange({ ...value, layout: e.target.value as 'cards' | 'ladder' })
          }
          className={inputClass}
        >
          <option value="cards">Cards (horizontal grid)</option>
          <option value="ladder">Ladder (vertical timeline)</option>
        </select>
      </Field>

      {tiers.map((tier, i) => (
        <div key={i} className="rounded-card border border-border bg-page/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
              Tier {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeTier(i)}
              className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label={`Remove tier ${i + 1}`}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>

          <div className="mb-3">
            <Field label="Tier image">
              <ImageUploader
                value={tier.imageUrl ?? ''}
                onChange={(url) => updateTier(i, { imageUrl: url || null })}
                folder="banners"
              />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tier name">
              <input
                value={tier.name}
                onChange={(e) => updateTier(i, { name: e.target.value })}
                className={inputClass}
                placeholder="Blue / Gold / VIP / Ambassador / Dorime"
              />
            </Field>
            <Field label="Minimum points">
              <input
                type="number"
                min={0}
                value={tier.minPoints}
                onChange={(e) =>
                  updateTier(i, { minPoints: Number(e.target.value) || 0 })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Image alt text">
              <input
                value={tier.imageAlt ?? ''}
                onChange={(e) => updateTier(i, { imageAlt: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Accent color" hint="hex or palette key (navy/amber/...)">
              <input
                value={tier.accentColor ?? ''}
                onChange={(e) => updateTier(i, { accentColor: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field
              label="Intro paragraph"
              hint="Shown beside the image, before the perks list"
            >
              <textarea
                rows={2}
                value={tier.intro ?? ''}
                onChange={(e) => updateTier(i, { intro: e.target.value })}
                className={inputClass}
                placeholder="Sign up now and enjoy exclusive..."
              />
            </Field>
            <Field label="Perks" hint="One per line">
              <textarea
                rows={4}
                value={tier.perks.join('\n')}
                onChange={(e) =>
                  updateTier(i, {
                    perks: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="“Read more” link URL (optional)">
              <input
                value={tier.readMoreHref ?? ''}
                onChange={(e) => updateTier(i, { readMoreHref: e.target.value })}
                className={inputClass}
                placeholder="/continental-rewards#blue"
              />
            </Field>
            <Field label="“Read more” link label">
              <input
                value={tier.readMoreLabel ?? ''}
                onChange={(e) => updateTier(i, { readMoreLabel: e.target.value })}
                className={inputClass}
                placeholder="Read full benefits"
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addTier}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-navy px-4 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
      >
        <Plus size={14} aria-hidden /> Add tier
      </button>
    </div>
  );
}

// ---- CTA cards ----

interface CtaCard {
  headline: string;
  subheadline?: string | null;
  href: string;
  background?: string | null;
}

function CtaCardsEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const cards = (value.cards as CtaCard[] | undefined) ?? [];
  const updateCard = (i: number, patch: Partial<CtaCard>) => {
    const next = [...cards];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, cards: next });
  };
  const addCard = () =>
    onChange({
      ...value,
      cards: [...cards, { headline: 'New CTA', href: '/' } as CtaCard],
    });
  const removeCard = (i: number) =>
    onChange({ ...value, cards: cards.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-3">
      {cards.map((c, i) => (
        <div key={i} className="rounded-card border border-border bg-page/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
              Card {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCard(i)}
              className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label={`Remove card ${i + 1}`}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Headline">
              <input
                value={c.headline}
                onChange={(e) => updateCard(i, { headline: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Subheadline">
              <input
                value={c.subheadline ?? ''}
                onChange={(e) => updateCard(i, { subheadline: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Link URL">
              <input
                value={c.href}
                onChange={(e) => updateCard(i, { href: e.target.value })}
                className={inputClass}
                placeholder="/register"
              />
            </Field>
            <Field
              label="Background"
              hint="amber, navy, charcoal, or hex (#RRGGBB). First defaults to amber."
            >
              <input
                value={c.background ?? ''}
                onChange={(e) => updateCard(i, { background: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addCard}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
      >
        <Plus size={14} aria-hidden /> Add card
      </button>
    </div>
  );
}

// ---- Marquee strip ----

function MarqueeStripEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const items = (value.items as string[] | undefined) ?? [];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Items" hint="One per line — emojis welcome">
        <textarea
          rows={6}
          value={items.join('\n')}
          onChange={(e) =>
            onChange({
              ...value,
              items: e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className={inputClass}
          placeholder={'Up to 50% off Beauty\n🎁 Free shipping over ₦15,000'}
        />
      </Field>
      <Field label="Background" hint="amber / navy / danger / hex">
        <input
          value={(value.background as string | undefined) ?? 'amber'}
          onChange={(e) => onChange({ ...value, background: e.target.value })}
          className={`${inputClass} font-mono`}
        />
      </Field>
      <Field
        label="Loop duration (seconds)"
        hint="Time for one full pass — higher = slower"
      >
        <input
          type="number"
          min={5}
          max={120}
          value={(value.durationSeconds as number | undefined) ?? 30}
          onChange={(e) =>
            onChange({ ...value, durationSeconds: Number(e.target.value) || 30 })
          }
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// ---- Final CTA ----

function FinalCtaEditor({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const primary = value.primaryCta as { label: string; href: string } | null | undefined;
  const secondary = value.secondaryCta as { label: string; href: string } | null | undefined;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Eyebrow (small label above headline)">
        <input
          value={(value.eyebrow as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          className={inputClass}
          placeholder="Limited time"
        />
      </Field>
      <Field label="Background" hint="navy, amber, gradient-navy, or hex">
        <input
          value={(value.background as string | undefined) ?? 'gradient-navy'}
          onChange={(e) => onChange({ ...value, background: e.target.value })}
          className={`${inputClass} font-mono`}
        />
      </Field>
      <Field label="Headline">
        <input
          value={(value.headline as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
          className={inputClass}
          required
        />
      </Field>
      <Field label="Body paragraph">
        <textarea
          rows={2}
          value={(value.body as string | undefined) ?? ''}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Primary button label">
        <input
          value={primary?.label ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              primaryCta: e.target.value
                ? { label: e.target.value, href: primary?.href ?? '/' }
                : null,
            })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Primary button URL">
        <input
          value={primary?.href ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              primaryCta: primary ? { ...primary, href: e.target.value } : null,
            })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Secondary button label (optional)">
        <input
          value={secondary?.label ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              secondaryCta: e.target.value
                ? { label: e.target.value, href: secondary?.href ?? '/' }
                : null,
            })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Secondary button URL">
        <input
          value={secondary?.href ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              secondaryCta: secondary ? { ...secondary, href: e.target.value } : null,
            })
          }
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// ---- Shared ----

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';

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
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
