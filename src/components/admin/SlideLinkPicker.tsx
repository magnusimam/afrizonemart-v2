'use client';

import { useEffect, useMemo, useState } from 'react';
import { COUNTRIES, COUNTRY_CODES } from '@/lib/countries';
import { listCategories, type ApiCategory } from '@/lib/api/categories';

/**
 * Per-slide deep-link picker — used inside the SlideListEditor on
 * both `/admin/content` (global hero) and `/admin/category-heroes`.
 *
 * Stores a single string that mobile + web both parse via the same
 * path conventions:
 *
 *   /product/<slug>         → Product PDP
 *   /shop/<category-slug>   → Category landing
 *   /shop/country/<slug>    → Country landing
 *   /shop/countries         → Countries directory
 *   /supplier               → Become A Supplier
 *   https://...             → External (system browser)
 *
 * Empty/undefined → decorative slide, no tap action.
 *
 * UX: select dropdown chooses the "kind"; a contextual second input
 * appears for product/category/country/external. Preview of the
 * resolved path is shown below so admin sees what will be saved.
 */

type LinkKind =
  | 'none'
  | 'product'
  | 'category'
  | 'country'
  | 'countries'
  | 'supplier'
  | 'external';

interface ParsedLink {
  kind: LinkKind;
  value: string;
}

function parseLink(link: string | undefined): ParsedLink {
  if (!link || !link.trim()) return { kind: 'none', value: '' };
  const trimmed = link.trim();
  if (/^https?:\/\//i.test(trimmed)) return { kind: 'external', value: trimmed };
  const path = trimmed.replace(/^\/+/, '').split('?')[0]!.split('#')[0]!;
  if (path === 'shop/countries') return { kind: 'countries', value: '' };
  if (path === 'supplier' || path === 'suppliers') return { kind: 'supplier', value: '' };
  let m = path.match(/^product\/(.+)$/);
  if (m) return { kind: 'product', value: m[1]! };
  m = path.match(/^shop\/country\/(.+)$/);
  if (m) return { kind: 'country', value: m[1]! };
  m = path.match(/^shop\/(.+)$/);
  if (m) return { kind: 'category', value: m[1]! };
  /// Anything else — treat as external (admin can clean up).
  return { kind: 'external', value: trimmed };
}

function serialiseLink(parsed: ParsedLink): string {
  switch (parsed.kind) {
    case 'none':
      return '';
    case 'product':
      return parsed.value ? `/product/${parsed.value}` : '';
    case 'category':
      return parsed.value ? `/shop/${parsed.value}` : '';
    case 'country':
      return parsed.value ? `/shop/country/${parsed.value}` : '';
    case 'countries':
      return '/shop/countries';
    case 'supplier':
      return '/supplier';
    case 'external':
      return parsed.value.trim();
  }
}

export interface SlideLinkPickerProps {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}

export function SlideLinkPicker({ value, onChange }: SlideLinkPickerProps) {
  const parsed = useMemo(() => parseLink(value), [value]);
  const [kind, setKind] = useState<LinkKind>(parsed.kind);
  const [inputValue, setInputValue] = useState<string>(parsed.value);
  const [categories, setCategories] = useState<ApiCategory[] | null>(null);

  /// Re-sync when the upstream value changes (e.g. switching to a
  /// different slide).
  useEffect(() => {
    setKind(parsed.kind);
    setInputValue(parsed.value);
  }, [parsed.kind, parsed.value]);

  /// Lazy-load categories only when the admin picks "Category".
  useEffect(() => {
    if (kind === 'category' && categories === null) {
      void listCategories().then(setCategories).catch(() => setCategories([]));
    }
  }, [kind, categories]);

  const apply = (nextKind: LinkKind, nextValue: string) => {
    setKind(nextKind);
    setInputValue(nextValue);
    const resolved = serialiseLink({ kind: nextKind, value: nextValue });
    onChange(resolved ? resolved : undefined);
  };

  const handleKindChange = (k: LinkKind) => {
    /// Kind-only types (countries, supplier, none) clear the value;
    /// value-bearing kinds keep what was there so the admin can
    /// re-type.
    if (k === 'none' || k === 'countries' || k === 'supplier') {
      apply(k, '');
    } else {
      apply(k, inputValue);
    }
  };

  /// Flatten category tree to slug + breadcrumb name for the
  /// dropdown. Parents + subcategories both selectable.
  const flatCats = useMemo(() => {
    if (!categories) return [];
    const rows: { slug: string; label: string }[] = [];
    for (const top of categories) {
      rows.push({ slug: top.slug, label: top.name });
      for (const child of top.children ?? []) {
        rows.push({ slug: child.slug, label: `${top.name} › ${child.name}` });
      }
    }
    return rows;
  }, [categories]);

  return (
    <div className="flex flex-col gap-2 rounded-input border border-border bg-white p-2">
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          Link
        </span>
        <select
          value={kind}
          onChange={(e) => handleKindChange(e.target.value as LinkKind)}
          className="rounded-input border border-border bg-white px-2 py-1 font-sans text-xs text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="none">None (decorative)</option>
          <option value="product">Product</option>
          <option value="category">Category</option>
          <option value="country">Country</option>
          <option value="countries">All countries</option>
          <option value="supplier">Become a supplier</option>
          <option value="external">External URL</option>
        </select>

        {/* Contextual second input */}
        {kind === 'product' && (
          <input
            value={inputValue}
            onChange={(e) => apply('product', e.target.value)}
            placeholder="product-slug (from PDP URL)"
            className="flex-1 rounded-input border border-border bg-white px-2 py-1 font-mono text-xs text-charcoal focus:border-navy focus:outline-none"
          />
        )}
        {kind === 'category' && (
          <select
            value={inputValue}
            onChange={(e) => apply('category', e.target.value)}
            className="flex-1 rounded-input border border-border bg-white px-2 py-1 font-sans text-xs text-charcoal focus:border-navy focus:outline-none"
          >
            <option value="">— pick a category —</option>
            {flatCats.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        )}
        {kind === 'country' && (
          <select
            value={inputValue}
            onChange={(e) => apply('country', e.target.value)}
            className="flex-1 rounded-input border border-border bg-white px-2 py-1 font-sans text-xs text-charcoal focus:border-navy focus:outline-none"
          >
            <option value="">— pick a country —</option>
            {COUNTRY_CODES.map((code) => {
              const c = COUNTRIES[code];
              return (
                <option key={c.code} value={c.slug}>
                  {c.flag} {c.name}
                </option>
              );
            })}
          </select>
        )}
        {kind === 'external' && (
          <input
            value={inputValue}
            onChange={(e) => apply('external', e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded-input border border-border bg-white px-2 py-1 font-mono text-xs text-charcoal focus:border-navy focus:outline-none"
          />
        )}
      </div>

      {/* Resolved-path preview — admin sees what will be saved */}
      {kind !== 'none' && (
        <p className="font-mono text-[10px] text-muted">
          → {serialiseLink({ kind, value: inputValue }) || '(empty)'}
        </p>
      )}
    </div>
  );
}
