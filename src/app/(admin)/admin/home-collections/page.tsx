'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { SlideListEditor, validateSlides } from '@/components/admin/SlideListEditor';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminGetContentOverrides,
  adminUpdateContent,
} from '@/lib/api/admin';
import type { ImageWithAlt } from '@/lib/site-content';

/**
 * /admin/home-collections — admin editor for the mobile home
 * "collection chip" row that sits just below the hero.
 *
 * Writes a single content key: `content.home.collections`. Same
 * imageList shape as hero slides (url + alt + link), and reuses the
 * shared `SlideListEditor` so the UX is consistent with everything
 * else that edits a list of image slides.
 *
 * Chips render in the order you save them. Empty list → mobile
 * hides the section cleanly. No "Featured products" picker here —
 * chips are pure navigation tiles; the `enableProducts` extension
 * is reserved for category heroes.
 */
const CONTENT_KEY = 'content.home.collections';

function parseStored(raw: unknown): ImageWithAlt[] {
  if (!Array.isArray(raw)) return [];
  const out: ImageWithAlt[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as { url?: unknown; alt?: unknown; link?: unknown };
    if (typeof r.url !== 'string' || typeof r.alt !== 'string') continue;
    out.push({
      url: r.url,
      alt: r.alt,
      link: typeof r.link === 'string' && r.link.trim() ? r.link : undefined,
    });
  }
  return out;
}

export default function AdminHomeCollectionsPage() {
  const [stored, setStored] = useState<ImageWithAlt[] | null>(null);
  const [draft, setDraft] = useState<ImageWithAlt[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void adminGetContentOverrides()
      .then((res) => {
        if (cancelled) return;
        const parsed = parseStored(res.overrides[CONTENT_KEY]);
        setStored(parsed);
        setDraft(parsed);
      })
      .catch((e) => {
        if (cancelled) return;
        toast(e instanceof Error ? e.message : 'Failed to load', 'error');
        setStored([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (next: ImageWithAlt[]) => {
    setDraft(next);
    setDirty(true);
  };

  const handleSave = async () => {
    const invalid = validateSlides(draft);
    if (invalid) {
      toast(invalid, 'error');
      return;
    }
    setSaving(true);
    try {
      await adminUpdateContent([
        {
          key: CONTENT_KEY,
          /// Empty list → clear the override (mobile hides the row).
          value: draft.length === 0 ? null : draft,
        },
      ]);
      toast(
        draft.length === 0
          ? 'Cleared — the row will hide on the next mobile refresh'
          : `Saved ${draft.length} ${draft.length === 1 ? 'chip' : 'chips'}`,
      );
      setStored(draft);
      setDirty(false);
    } catch (e) {
      toast(
        e instanceof HttpApiError || e instanceof Error
          ? e.message
          : 'Save failed',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Home — collection chips"
        subtitle="The side-scrolling row of large image cards that sits below the home hero. Each chip is image + label + tap target (product, category, country, deals, or external URL). Empty list = the row hides on mobile."
      />

      {stored === null ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-4 rounded-card border border-border bg-white p-4 md:p-5">
          <SlideListEditor
            slides={draft}
            onChange={onChange}
            folder="banners"
            addLabel="Add chip"
            hint="Tip: 3:4 portrait art reads best (mobile cards are taller than wide). Label is the white text shown over the bottom of the card AND the screen-reader name — make it short and clear (&quot;Shop Nigeria&quot;, &quot;Aso-oke Picks&quot;)."
          />

          <div className="flex items-center justify-between">
            <p className="font-sans text-xs text-muted">
              {stored.length === draft.length && !dirty
                ? `${draft.length} ${draft.length === 1 ? 'chip' : 'chips'} live`
                : `${draft.length} ${draft.length === 1 ? 'chip' : 'chips'} pending save`}
            </p>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={13} aria-hidden />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
