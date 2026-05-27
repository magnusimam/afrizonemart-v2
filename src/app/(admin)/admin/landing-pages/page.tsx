'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Save, Search } from 'lucide-react';
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
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from '@/lib/countries';

/**
 * /admin/landing-pages — admin editor for the country × category SEO
 * landing pages at `/shop/country/<country>/<category>`.
 *
 * Each page reads two content slots; the storefront falls back to a
 * generated default if either is empty. Editing here writes both keys
 * via the existing `adminUpdateContent` PUT — no new API needed:
 *   • `content.shop.cc.<countrySlug>.<categorySlug>.headline`
 *   • `content.shop.cc.<countrySlug>.<categorySlug>.intro`
 *
 * Layout: search + accordion per country → list of top-level categories
 * inside. One save per (country, category) cell so editing one combo
 * never blocks the others.
 */

const headlineKey = (country: string, category: string) =>
  `content.shop.cc.${country}.${category}.headline`;
const introKey = (country: string, category: string) =>
  `content.shop.cc.${country}.${category}.intro`;

interface CellEdit {
  headline?: string;
  intro?: string;
}

export default function AdminLandingPagesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [overrides, setOverrides] = useState<Record<string, unknown> | null>(null);
  const [expanded, setExpanded] = useState<Set<CountryCode>>(new Set());
  const [filter, setFilter] = useState('');
  /// Edit buffer keyed by `${country}::${category}` → CellEdit.
  const [edits, setEdits] = useState<Record<string, CellEdit>>({});
  const [savingCell, setSavingCell] = useState<string | null>(null);

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

  const visibleCountries = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter((code) => {
      const c = COUNTRIES[code];
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q
      );
    });
  }, [filter]);

  const toggle = (code: CountryCode) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const cellKey = (country: string, category: string) => `${country}::${category}`;

  const fieldValue = (
    country: string,
    category: string,
    field: 'headline' | 'intro',
  ): string => {
    const ck = cellKey(country, category);
    const edited = edits[ck]?.[field];
    if (edited !== undefined) return edited;
    const raw =
      overrides?.[field === 'headline' ? headlineKey(country, category) : introKey(country, category)];
    return typeof raw === 'string' ? raw : '';
  };

  const setField = (
    country: string,
    category: string,
    field: 'headline' | 'intro',
    value: string,
  ) => {
    const ck = cellKey(country, category);
    setEdits((prev) => ({
      ...prev,
      [ck]: { ...(prev[ck] ?? {}), [field]: value },
    }));
  };

  const isDirty = (country: string, category: string) =>
    edits[cellKey(country, category)] !== undefined;

  const hasOverride = (country: string, category: string) => {
    const h = overrides?.[headlineKey(country, category)];
    const i = overrides?.[introKey(country, category)];
    return (typeof h === 'string' && h.length > 0) || (typeof i === 'string' && i.length > 0);
  };

  const countOverridesForCountry = (country: string): number =>
    topLevel.reduce(
      (n, c) => (hasOverride(country, c.slug) ? n + 1 : n),
      0,
    );

  const handleSave = async (country: string, category: string) => {
    const ck = cellKey(country, category);
    const edit = edits[ck];
    if (!edit) return;
    setSavingCell(ck);
    try {
      const entries: ContentEntry[] = [];
      if (edit.headline !== undefined) {
        entries.push({
          key: headlineKey(country, category),
          /// Empty string → clear the override (page falls back to default).
          value: edit.headline.trim() === '' ? null : edit.headline.trim(),
        });
      }
      if (edit.intro !== undefined) {
        entries.push({
          key: introKey(country, category),
          value: edit.intro.trim() === '' ? null : edit.intro.trim(),
        });
      }
      if (entries.length === 0) {
        setSavingCell(null);
        return;
      }
      await adminUpdateContent(entries);
      toast(`Saved ${country} · ${category}`);
      /// Reflect locally so badges update without a full refetch.
      setOverrides((prev) => {
        const next = { ...(prev ?? {}) };
        for (const e of entries) {
          if (e.value === null) delete next[e.key];
          else next[e.key] = e.value;
        }
        return next;
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[ck];
        return next;
      });
    } catch (e) {
      toast(
        e instanceof HttpApiError || e instanceof Error ? e.message : 'Save failed',
        'error',
      );
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Country × category landing pages"
        subtitle="Edit the headline + intro copy each /shop/country/<country>/<category> page shows. Leave blank to use the generated default."
      />

      <div className="flex items-center gap-2 rounded-card border border-border bg-white px-3 py-2">
        <Search size={16} className="text-muted" aria-hidden />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter countries by name, slug, or code (e.g. NG)"
          className="w-full bg-transparent font-sans text-sm text-charcoal placeholder:text-muted focus:outline-none"
        />
      </div>

      {categories === null || overrides === null ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : topLevel.length === 0 ? (
        <p className="font-sans text-sm text-muted">
          No top-level categories found. Add them in /admin/categories first.
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleCountries.map((code) => {
            const country = COUNTRIES[code];
            const open = expanded.has(code);
            const overridesHere = countOverridesForCountry(country.slug);
            return (
              <li
                key={code}
                className="overflow-hidden rounded-card border border-border bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggle(code)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-page"
                >
                  {open ? (
                    <ChevronDown size={16} className="text-muted" aria-hidden />
                  ) : (
                    <ChevronRight size={16} className="text-muted" aria-hidden />
                  )}
                  <span className="text-lg" aria-hidden>
                    {country.flag}
                  </span>
                  <span className="flex-1 font-raleway font-semibold text-navy">
                    {country.name}
                    <span className="ml-2 font-sans text-xs font-normal text-muted">
                      ({country.code})
                    </span>
                  </span>
                  <span className="rounded-pill bg-page px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                    {overridesHere}/{topLevel.length} customised
                  </span>
                </button>

                {open && (
                  <div className="divide-y divide-border border-t border-border">
                    {topLevel.map((cat) => {
                      const ck = cellKey(country.slug, cat.slug);
                      const headline = fieldValue(country.slug, cat.slug, 'headline');
                      const intro = fieldValue(country.slug, cat.slug, 'intro');
                      const dirty = isDirty(country.slug, cat.slug);
                      const saving = savingCell === ck;
                      const previewUrl = `/shop/country/${country.slug}/${cat.slug}`;
                      return (
                        <div key={cat.id} className="space-y-3 p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="font-raleway font-bold text-navy">
                              {cat.name}{' '}
                              <span className="font-sans text-xs font-normal text-muted">
                                /{cat.slug}
                              </span>
                            </h3>
                            <a
                              href={previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:text-amber"
                            >
                              Preview →
                            </a>
                          </div>

                          <Field
                            label="Headline"
                            hint={`Defaults to: "${cat.name} from ${country.name}"`}
                          >
                            <input
                              value={headline}
                              onChange={(e) =>
                                setField(country.slug, cat.slug, 'headline', e.target.value)
                              }
                              placeholder={`${cat.name} from ${country.name}`}
                              className={inputClass}
                              maxLength={140}
                            />
                          </Field>

                          <Field
                            label="Intro paragraph"
                            hint="Shown under the headline. Aim for 1–3 sentences with the country + category named — that's what Google ranks."
                          >
                            <textarea
                              value={intro}
                              onChange={(e) =>
                                setField(country.slug, cat.slug, 'intro', e.target.value)
                              }
                              placeholder={`Discover authentic ${cat.name.toLowerCase()} made in ${country.name}…`}
                              className={`${inputClass} min-h-[110px]`}
                              maxLength={1200}
                            />
                          </Field>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleSave(country.slug, cat.slug)}
                              disabled={!dirty || saving}
                              className="inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Save size={13} aria-hidden />
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint ? <span className="font-sans text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}
