'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Save } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { SlideListEditor, validateSlides } from '@/components/admin/SlideListEditor';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminGetContentOverrides,
  adminListCategories,
  adminUpdateContent,
  type AdminCategory,
} from '@/lib/api/admin';
import type { ImageWithAlt } from '@/lib/site-content';

/**
 * Per-category hero admin — sets the slide list mobile reads at
 * `content.category.<slug>.hero.slides`. Same imageList shape as
 * the global home hero, just keyed per category.
 *
 * Mobile (afrizonemart-mobile) reads this on the Category landing
 * screen above the product grid. Empty list → no hero shown for
 * that category. New categories added in `/admin/categories`
 * automatically appear here on next refresh.
 *
 * UX:
 *   - One collapsible row per top-level category. Expand → edit
 *     the slide list inline. Save button per category (independent
 *     PUTs, doesn't block the others).
 *   - "Has slides" badge on the right of the row title so admins
 *     can see at a glance which categories have a hero.
 *   - Subcategories don't get their own hero today; mobile shows
 *     the parent's hero on a subcategory landing if needed (we
 *     can revisit if requested).
 */
const heroKey = (slug: string) => `content.category.${slug}.hero.slides`;

export default function AdminCategoryHeroesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [overrides, setOverrides] = useState<Record<string, unknown> | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /// Edit buffer — keyed by slug. Lets each row save independently
  /// without re-fetching the whole tree on every keystroke.
  const [edits, setEdits] = useState<Record<string, ImageWithAlt[]>>({});
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
      toast(
        e instanceof Error ? e.message : 'Failed to load',
        'error',
      );
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

  const getSlidesForSlug = (slug: string): ImageWithAlt[] => {
    if (edits[slug] !== undefined) return edits[slug]!;
    const raw = overrides?.[heroKey(slug)];
    if (!Array.isArray(raw)) return [];
    return (raw as ImageWithAlt[]) ?? [];
  };

  const setSlidesForSlug = (slug: string, next: ImageWithAlt[]) => {
    setEdits((prev) => ({ ...prev, [slug]: next }));
  };

  const isDirty = (slug: string) => edits[slug] !== undefined;

  const handleSave = async (slug: string) => {
    if (!edits[slug]) return;
    const invalid = validateSlides(edits[slug]!);
    if (invalid) {
      toast(invalid, 'error');
      return;
    }
    setSavingSlug(slug);
    try {
      await adminUpdateContent([
        {
          key: heroKey(slug),
          /// Empty list → clear the override so the slot returns
          /// the component default (mobile = no hero).
          value: edits[slug]!.length === 0 ? null : edits[slug]!,
        },
      ]);
      toast(`Saved ${slug}`);
      /// Move the edit into the local overrides so the badge
      /// reflects the new state immediately.
      setOverrides((prev) => ({
        ...(prev ?? {}),
        [heroKey(slug)]: edits[slug]!.length === 0 ? undefined : edits[slug]!,
      }));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
    } catch (e) {
      toast(
        e instanceof HttpApiError || e instanceof Error
          ? e.message
          : 'Save failed',
        'error',
      );
    } finally {
      setSavingSlug(null);
    }
  };

  const toggle = (slug: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  if (!categories) {
    return (
      <div className="p-6">
        <p className="font-sans text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Category Heroes"
        subtitle="Set the hero slide list shown on each Category landing screen on mobile. Same imageList shape as the home hero."
      />

      <div className="overflow-hidden rounded-card border border-border bg-white">
        {topLevel.length === 0 ? (
          <p className="p-6 font-sans text-sm text-muted">
            No top-level categories yet — create one in /admin/categories first.
          </p>
        ) : (
          <ul>
            {topLevel.map((cat) => {
              const isOpen = expanded.has(cat.slug);
              const slides = getSlidesForSlug(cat.slug);
              const dirty = isDirty(cat.slug);
              const hasPersistedSlides =
                Array.isArray(overrides?.[heroKey(cat.slug)]) &&
                (overrides?.[heroKey(cat.slug)] as unknown[]).length > 0;
              return (
                <li
                  key={cat.id}
                  className="border-b border-border last:border-b-0"
                >
                  {/* Row header */}
                  <button
                    type="button"
                    onClick={() => toggle(cat.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-page"
                  >
                    {isOpen ? (
                      <ChevronDown size={16} aria-hidden />
                    ) : (
                      <ChevronRight size={16} aria-hidden />
                    )}
                    {cat.image ? (
                      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-page">
                        <Image
                          src={cat.image}
                          alt=""
                          fill
                          sizes="36px"
                          unoptimized
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span className="h-9 w-9 shrink-0 rounded-md border border-dashed border-border bg-page" />
                    )}
                    <div className="flex-1">
                      <p className="font-raleway font-semibold text-navy">
                        {cat.name}
                      </p>
                      <p className="font-mono text-[11px] text-muted">
                        {heroKey(cat.slug)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {dirty ? (
                        <span className="rounded-full bg-amber/15 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                          Unsaved
                        </span>
                      ) : hasPersistedSlides ? (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
                          {(overrides![heroKey(cat.slug)] as unknown[]).length} slide
                          {(overrides![heroKey(cat.slug)] as unknown[]).length === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span className="rounded-full bg-page px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                          empty
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Editor */}
                  {isOpen && (
                    <div className="space-y-3 border-t border-border bg-page/40 p-4">
                      <SlideListEditor
                        slides={slides}
                        onChange={(next) => setSlidesForSlug(cat.slug, next)}
                        hint="Tip: 16:9 art reads best (mobile renders the slider full-bleed at 16:9). Add a link per slide if tapping should route somewhere — products, categories, countries, or external URLs all work."
                      />
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleSave(cat.slug)}
                          disabled={!dirty || savingSlug === cat.slug}
                          className="flex items-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-amber-dark disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Save size={13} aria-hidden />
                          {savingSlug === cat.slug ? 'Saving…' : 'Save'}
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
    </div>
  );
}

