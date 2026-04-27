'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

const FEATURE_ICONS = ['sparkles', 'leaf', 'globe', 'shield', 'heart', 'check', 'gem'] as const;
type FeatureIcon = (typeof FEATURE_ICONS)[number];

export interface ProductBundle {
  units: number;
  label: string;
  price: number;
  comparePrice: number;
  savings?: number;
  popular?: boolean;
}
export interface ProductFeature {
  icon: FeatureIcon;
  text: string;
}
export interface ProductSpec {
  label: string;
  value: string;
}
export interface ProductVariants {
  type: string;
  options: string[];
  default: string;
}
export interface ProductAttributes {
  bundles: ProductBundle[];
  features: ProductFeature[];
  specifications: ProductSpec[];
  variants?: ProductVariants;
  aboutTitle: string;
  aboutBody: string;
  aboutImage: string;
}

const EMPTY: ProductAttributes = {
  bundles: [],
  features: [],
  specifications: [],
  aboutTitle: '',
  aboutBody: '',
  aboutImage: '',
};

interface Props {
  value: ProductAttributes;
  onChange: (next: ProductAttributes) => void;
}

/**
 * Structured editor for the product `attributes` JSON column. Each
 * sub-editor (bundles / features / specifications / variants / about)
 * is a small repeater. Power users can flip to the raw JSON tab below
 * to edit the value directly.
 */
export function AttributesEditor({ value, onChange }: Props) {
  const v: ProductAttributes = {
    ...EMPTY,
    ...value,
  };

  const [tab, setTab] = useState<'structured' | 'raw'>('structured');
  const [rawText, setRawText] = useState(JSON.stringify(v, null, 2));
  const [rawError, setRawError] = useState<string | null>(null);

  // ----- Bundles -----
  const updateBundle = (i: number, patch: Partial<ProductBundle>) => {
    const next = [...v.bundles];
    next[i] = { ...next[i], ...patch };
    onChange({ ...v, bundles: next });
  };
  const addBundle = () =>
    onChange({
      ...v,
      bundles: [...v.bundles, { units: 1, label: '1 Pack', price: 0, comparePrice: 0 }],
    });
  const removeBundle = (i: number) =>
    onChange({ ...v, bundles: v.bundles.filter((_, idx) => idx !== i) });

  // ----- Features -----
  const updateFeature = (i: number, patch: Partial<ProductFeature>) => {
    const next = [...v.features];
    next[i] = { ...next[i], ...patch };
    onChange({ ...v, features: next });
  };
  const addFeature = () =>
    onChange({ ...v, features: [...v.features, { icon: 'check', text: '' }] });
  const removeFeature = (i: number) =>
    onChange({ ...v, features: v.features.filter((_, idx) => idx !== i) });

  // ----- Specifications -----
  const updateSpec = (i: number, patch: Partial<ProductSpec>) => {
    const next = [...v.specifications];
    next[i] = { ...next[i], ...patch };
    onChange({ ...v, specifications: next });
  };
  const addSpec = () =>
    onChange({ ...v, specifications: [...v.specifications, { label: '', value: '' }] });
  const removeSpec = (i: number) =>
    onChange({ ...v, specifications: v.specifications.filter((_, idx) => idx !== i) });

  // ----- Variants -----
  const variants = v.variants ?? { type: '', options: [], default: '' };
  const updateVariant = (patch: Partial<ProductVariants>) => {
    const next = { ...variants, ...patch };
    const cleared = !next.type && next.options.length === 0;
    onChange({ ...v, variants: cleared ? undefined : next });
  };

  // ----- About -----
  const updateAbout = (patch: Partial<Pick<ProductAttributes, 'aboutTitle' | 'aboutBody' | 'aboutImage'>>) =>
    onChange({ ...v, ...patch });

  // ----- Raw JSON tab -----
  const switchTo = (next: 'structured' | 'raw') => {
    if (next === 'raw') {
      setRawText(JSON.stringify(v, null, 2));
      setRawError(null);
    }
    setTab(next);
  };
  const applyRaw = () => {
    try {
      const parsed = JSON.parse(rawText);
      onChange({ ...EMPTY, ...parsed });
      setRawError(null);
      setTab('structured');
    } catch (err) {
      setRawError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1 border-b border-border">
        <TabButton active={tab === 'structured'} onClick={() => switchTo('structured')}>
          Structured
        </TabButton>
        <TabButton active={tab === 'raw'} onClick={() => switchTo('raw')}>
          Raw JSON
        </TabButton>
      </div>

      {tab === 'structured' ? (
        <div className="flex flex-col gap-5">
          <Subsection
            title="Bundles"
            subtitle="Pricing tiers (1 pack, 3 pack, 6 pack, …)."
            onAdd={addBundle}
            count={v.bundles.length}
          >
            {v.bundles.map((b, i) => (
              <Row key={i} index={i} onRemove={() => removeBundle(i)}>
                <NumberCell
                  label="Units"
                  value={b.units}
                  onChange={(n) => updateBundle(i, { units: n })}
                />
                <TextCell
                  label="Label"
                  value={b.label}
                  onChange={(s) => updateBundle(i, { label: s })}
                  className="flex-1 min-w-[120px]"
                />
                <NumberCell
                  label="Price"
                  value={b.price}
                  onChange={(n) => updateBundle(i, { price: n })}
                />
                <NumberCell
                  label="Compare"
                  value={b.comparePrice}
                  onChange={(n) => updateBundle(i, { comparePrice: n })}
                />
                <NumberCell
                  label="Savings %"
                  value={b.savings ?? 0}
                  onChange={(n) => updateBundle(i, { savings: n || undefined })}
                />
                <CheckCell
                  label="Popular"
                  value={Boolean(b.popular)}
                  onChange={(c) => updateBundle(i, { popular: c || undefined })}
                />
              </Row>
            ))}
          </Subsection>

          <Subsection
            title="Features"
            subtitle="Bullet-point selling points shown on the product page."
            onAdd={addFeature}
            count={v.features.length}
          >
            {v.features.map((f, i) => (
              <Row key={i} index={i} onRemove={() => removeFeature(i)}>
                <SelectCell
                  label="Icon"
                  value={f.icon}
                  options={FEATURE_ICONS.map((icon) => ({ value: icon, label: icon }))}
                  onChange={(val) => updateFeature(i, { icon: val as FeatureIcon })}
                />
                <TextCell
                  label="Text"
                  value={f.text}
                  onChange={(s) => updateFeature(i, { text: s })}
                  className="flex-1 min-w-[240px]"
                />
              </Row>
            ))}
          </Subsection>

          <Subsection
            title="Specifications"
            subtitle="Label / value rows (Net Weight: 120g, etc.)."
            onAdd={addSpec}
            count={v.specifications.length}
          >
            {v.specifications.map((s, i) => (
              <Row key={i} index={i} onRemove={() => removeSpec(i)}>
                <TextCell
                  label="Label"
                  value={s.label}
                  onChange={(val) => updateSpec(i, { label: val })}
                  className="flex-1 min-w-[140px]"
                />
                <TextCell
                  label="Value"
                  value={s.value}
                  onChange={(val) => updateSpec(i, { value: val })}
                  className="flex-1 min-w-[140px]"
                />
              </Row>
            ))}
          </Subsection>

          <Subsection
            title="Variants"
            subtitle="Optional. Single variant axis (Size, Color, etc.) — leave blank for none."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <CellLabel label="Type">
                <input
                  value={variants.type}
                  onChange={(e) => updateVariant({ type: e.target.value })}
                  placeholder="Size"
                  className={baseInput}
                />
              </CellLabel>
              <CellLabel label="Options (comma-separated)">
                <input
                  value={variants.options.join(', ')}
                  onChange={(e) =>
                    updateVariant({
                      options: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="50ml, 100ml, 200ml"
                  className={baseInput}
                />
              </CellLabel>
              <CellLabel label="Default">
                <select
                  value={variants.default}
                  onChange={(e) => updateVariant({ default: e.target.value })}
                  disabled={variants.options.length === 0}
                  className={baseInput}
                >
                  <option value="">— Pick one —</option>
                  {variants.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </CellLabel>
            </div>
          </Subsection>

          <Subsection
            title="About this product"
            subtitle="The longer story shown below the product gallery."
          >
            <CellLabel label="Title">
              <input
                value={v.aboutTitle}
                onChange={(e) => updateAbout({ aboutTitle: e.target.value })}
                className={baseInput}
              />
            </CellLabel>
            <CellLabel label="Body">
              <textarea
                value={v.aboutBody}
                onChange={(e) => updateAbout({ aboutBody: e.target.value })}
                rows={5}
                className={baseInput}
              />
            </CellLabel>
            <CellLabel label="Image">
              <ImageUploader
                value={v.aboutImage}
                onChange={(url) => updateAbout({ aboutImage: url })}
                folder="about"
                emptyHint="Single image · used in the About section on the product page"
              />
            </CellLabel>
          </Subsection>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rawError && (
            <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger">
              {rawError}
            </p>
          )}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={20}
            spellCheck={false}
            className={`${baseInput} font-mono text-xs leading-relaxed`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => switchTo('structured')}
              className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={applyRaw}
              className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
            >
              Apply JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const baseInput =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px border-b-2 px-3 py-2 font-raleway text-[11px] font-bold uppercase tracking-btn transition-colors ${
        active
          ? 'border-navy text-navy'
          : 'border-transparent text-muted hover:text-charcoal'
      }`}
    >
      {children}
    </button>
  );
}

function Subsection({
  title,
  subtitle,
  count,
  onAdd,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-card border border-border bg-page/30 p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-left"
        >
          {open ? (
            <ChevronUp size={14} className="text-muted" aria-hidden />
          ) : (
            <ChevronDown size={14} className="text-muted" aria-hidden />
          )}
          <div>
            <h3 className="font-raleway text-sm font-bold text-navy">
              {title}
              {typeof count === 'number' && (
                <span className="ml-2 rounded-full bg-border/50 px-1.5 py-0.5 font-sans text-[10px] text-muted">
                  {count}
                </span>
              )}
            </h3>
            {subtitle && <p className="font-sans text-[11px] text-muted">{subtitle}</p>}
          </div>
        </button>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
          >
            <Plus size={12} aria-hidden /> Add
          </button>
        )}
      </header>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </section>
  );
}

function Row({
  index,
  onRemove,
  children,
}: {
  index: number;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-card border border-border bg-white p-2.5">
      <span className="flex h-7 items-center text-muted" title={`Row ${index + 1}`}>
        <GripVertical size={14} aria-hidden />
      </span>
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto flex h-7 items-center rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
        aria-label="Remove row"
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </div>
  );
}

function CellLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextCell({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <CellLabel label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInput} ${className ?? ''}`}
      />
    </CellLabel>
  );
}

function NumberCell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <CellLabel label={label}>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`${baseInput} w-24`}
      />
    </CellLabel>
  );
}

function SelectCell({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <CellLabel label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInput} w-32`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </CellLabel>
  );
}

function CheckCell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <CellLabel label={label}>
      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-input border border-border bg-white px-3">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-navy"
        />
      </label>
    </CellLabel>
  );
}
