'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminGetContentOverrides,
  adminListCategories,
  adminUpdateContent,
  type AdminCategory,
  type ContentEntry,
} from '@/lib/api/admin';

/**
 * /admin/category-subtabs — admin editor for the mobile category
 * sub-tab strip. Each top-level category can be customised with a
 * curated row of tabs that re-filter the products grid in-place.
 *
 * Content key written per category:
 *   content.category.<slug>.subtabs
 *
 * Shape (matches the mobile `parseCategorySubtabs` guard):
 *   [
 *     { "label": "All" },
 *     { "label": "Tops",    "subcategory": "tops" },
 *     { "label": "Bottoms", "subcategory": "bottoms" }
 *   ]
 *
 * A tab with no `subcategory` shows everything in the parent. With one,
 * the mobile screen narrows the `/api/products?category=` filter to
 * that descendant slug. (The products endpoint walks descendants, so
 * the narrower slug naturally limits to that subtree.)
 *
 * Subcategory dropdown options are this category's children — picked
 * from `adminListCategories` filtered by `parentId === category.id`.
 * Categories with no children only let you set labels (rare; mostly
 * useful for fancy future filter types like sort/onSale).
 */

interface SubtabDraft {
  label: string;
  subcategory: string; // '' = no filter (= "All")
}

const subtabsKey = (slug: string) => `content.category.${slug}.subtabs`;

function parseStored(raw: unknown): SubtabDraft[] {
  if (!Array.isArray(raw)) return [];
  const out: SubtabDraft[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as { label?: unknown; subcategory?: unknown };
    if (typeof r.label !== 'string') continue;
    out.push({
      label: r.label,
      subcategory: typeof r.subcategory === 'string' ? r.subcategory : '',
    });
  }
  return out;
}

export default function AdminCategorySubtabsPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [overrides, setOverrides] = useState<Record<string, unknown> | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, SubtabDraft[]>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [catRes, contentRes] = await Promise.all([
        adminListCategories(),
        adminGetContentOverrides(),
      ]);
      setCategories(catRes.items);
      setOverrides(contentRes.overrides);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const topLevel = useMemo(
    () =>
      (categories ?? [])
        .filter((c) => !c.parentId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const childrenOf = (parentId: string) =>
    (categories ?? [])
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

  const tabsForSlug = (slug: string): SubtabDraft[] => {
    if (edits[slug] !== undefined) return edits[slug]!;
    return parseStored(overrides?.[subtabsKey(slug)]);
  };

  const setTabsForSlug = (slug: string, next: SubtabDraft[]) => {
    setEdits((prev) => ({ ...prev, [slug]: next }));
  };

  const isDirty = (slug: string) => edits[slug] !== undefined;

  const toggle = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleSave = async (slug: string) => {
    const tabs = edits[slug];
    if (!tabs) return;

    /// Validate locally before sending — empty labels = bad UX.
    for (const t of tabs) {
      if (!t.label.trim()) {
        toast('Every tab needs a label', 'error');
        return;
      }
    }

    setSavingSlug(slug);
    try {
      const value =
        tabs.length === 0
          ? null
          : tabs.map((t) => ({
              label: t.label.trim(),
              ...(t.subcategory ? { subcategory: t.subcategory } : {}),
            }));
      const entry: ContentEntry = { key: subtabsKey(slug), value };
      await adminUpdateContent([entry]);
      toast(`Saved ${slug} sub-tabs`);
      setOverrides((prev) => ({
        ...(prev ?? {}),
        [subtabsKey(slug)]: value ?? undefined,
      }));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
    } catch (e) {
      toast(
        e instanceof HttpApiError || e instanceof Error ? e.message : 'Save failed',
        'error',
      );
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Category sub-tabs"
        subtitle="Curate the row of tabs shown between the hero and the product grid on each mobile category page. A tab can be a plain label, or it can narrow the grid to a specific subcategory."
      />

      {categories === null || overrides === null ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : topLevel.length === 0 ? (
        <p className="font-sans text-sm text-muted">
          No top-level categories found. Add some in /admin/categories first.
        </p>
      ) : (
        <ul className="space-y-2">
          {topLevel.map((cat) => {
            const open = expanded.has(cat.slug);
            const tabs = tabsForSlug(cat.slug);
            const dirty = isDirty(cat.slug);
            const saving = savingSlug === cat.slug;
            const children = childrenOf(cat.id);
            return (
              <li
                key={cat.id}
                className="overflow-hidden rounded-card border border-border bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggle(cat.slug)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-page"
                >
                  {open ? (
                    <ChevronDown size={16} className="text-muted" aria-hidden />
                  ) : (
                    <ChevronRight size={16} className="text-muted" aria-hidden />
                  )}
                  <span className="flex-1 font-raleway font-semibold text-navy">
                    {cat.name}
                    <span className="ml-2 font-sans text-xs font-normal text-muted">
                      /{cat.slug}
                    </span>
                  </span>
                  <span className="rounded-pill bg-page px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                    {tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}
                  </span>
                </button>

                {open && (
                  <div className="space-y-3 border-t border-border bg-page p-4">
                    {tabs.length === 0 ? (
                      <p className="font-sans text-xs text-muted">
                        No tabs yet. Add one below — the mobile screen will
                        show the strip as soon as you save at least one tab.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {tabs.map((t, i) => (
                          <li
                            key={i}
                            className="flex flex-col gap-2 rounded-card border border-border bg-white p-3 md:flex-row md:items-end"
                          >
                            <div className="flex-1">
                              <Label>Label</Label>
                              <input
                                value={t.label}
                                onChange={(e) =>
                                  setTabsForSlug(cat.slug, [
                                    ...tabs.slice(0, i),
                                    { ...t, label: e.target.value },
                                    ...tabs.slice(i + 1),
                                  ])
                                }
                                placeholder='e.g. "All" or "Top Rated"'
                                className={inputClass}
                                maxLength={60}
                              />
                            </div>
                            <div className="flex-1">
                              <Label>Subcategory filter</Label>
                              <select
                                value={t.subcategory}
                                onChange={(e) =>
                                  setTabsForSlug(cat.slug, [
                                    ...tabs.slice(0, i),
                                    { ...t, subcategory: e.target.value },
                                    ...tabs.slice(i + 1),
                                  ])
                                }
                                className={inputClass}
                                disabled={children.length === 0}
                              >
                                <option value="">— No filter (show all) —</option>
                                {children.map((c) => (
                                  <option key={c.id} value={c.slug}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                              {children.length === 0 ? (
                                <p className="mt-1 font-sans text-[11px] text-muted">
                                  No subcategories under{' '}
                                  <span className="font-mono">/{cat.slug}</span>{' '}
                                  yet — tab will show all products.
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setTabsForSlug(cat.slug, [
                                  ...tabs.slice(0, i),
                                  ...tabs.slice(i + 1),
                                ])
                              }
                              className="self-end rounded-btn border border-border bg-white px-3 py-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-danger hover:border-danger"
                              aria-label={`Remove tab ${i + 1}`}
                            >
                              <Trash2 size={13} aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTabsForSlug(cat.slug, [
                            ...tabs,
                            { label: '', subcategory: '' },
                          ])
                        }
                        className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-white px-3 py-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:border-navy"
                      >
                        <Plus size={13} aria-hidden /> Add tab
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(cat.slug)}
                        disabled={!dirty || saving}
                        className="inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save size={13} aria-hidden />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
      {children}
    </span>
  );
}
