'use client';

import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ProductMultiPicker } from './ProductMultiPicker';
import { SlideLinkPicker } from './SlideLinkPicker';
import type { ImageWithAlt } from '@/lib/site-content';

/**
 * Returns a human-readable error message describing the first
 * invalid slide, or `null` when the list is OK to save. Use this
 * inside `handleSave` so the admin sees a useful toast instead of
 * a generic "Invalid request payload" from the API (which strips
 * field-level zod errors in prod).
 *
 * Rules:
 *   - every slide must have a `url` (uploaded image).
 *   - every slide must have non-empty `alt` text. The API enforces
 *     this for accessibility + SEO; matching it client-side is the
 *     difference between "Save failed" and "Slide 3 is missing
 *     alt text".
 */
export function validateSlides(slides: ImageWithAlt[]): string | null {
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i]!;
    if (!s.url || s.url.trim() === '') {
      return `Slide ${i + 1} is missing an image. Upload one or remove the row.`;
    }
    if (!s.alt || s.alt.trim() === '') {
      return `Slide ${i + 1} is missing alt text. Describe the image (e.g. "Plantain chips on a wooden board") so screen readers can read it.`;
    }
  }
  return null;
}

/**
 * Shared slide-list editor — used by `/admin/content` (global hero)
 * and `/admin/category-heroes` (per-category hero).
 *
 * Each row has: image picker, alt text input, link picker, remove
 * button. Adding a slide appends an empty `{url, alt, link}` entry.
 *
 * The link picker writes the resolved path string into the slide's
 * `link` field. Empty/none → undefined (no tap action on mobile).
 */
export interface SlideListEditorProps {
  slides: ImageWithAlt[];
  onChange: (next: ImageWithAlt[]) => void;
  /// Uploads go into this R2 folder. Defaults to `hero-slides` —
  /// callers (e.g. per-category heroes) can override if they want
  /// to organise per surface.
  folder?: 'hero-slides' | 'banners' | 'misc';
  /// Optional helper tip rendered below the Add button.
  hint?: string;
  /// When true, each slide gets a "Featured products" picker that
  /// writes up to 2 product slugs into `slide.products`. Mobile
  /// renders them as floating cards on top of the slide image (used
  /// by category heroes only — Home heroes deliberately leave this
  /// off so Home stays editorial).
  enableProducts?: boolean;
  /// Wording for the Add button — defaults to "Add image" which is
  /// right for hero slides but wrong for collection chips. Callers
  /// like /admin/home-collections override to "Add chip".
  addLabel?: string;
}

export function SlideListEditor({
  slides,
  onChange,
  folder = 'hero-slides',
  hint,
  enableProducts = false,
  addLabel = 'Add image',
}: SlideListEditorProps) {
  const update = (i: number, patch: Partial<ImageWithAlt>) =>
    onChange(slides.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(slides.filter((_, idx) => idx !== i));
  const add = () => onChange([...slides, { url: '', alt: '' }]);

  return (
    <div className="flex flex-col gap-3">
      {slides.map((it, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-card border border-border bg-white p-3"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start">
            <div className="md:w-44">
              <ImageUploader
                value={it.url}
                onChange={(next) => update(i, { url: next ?? '' })}
                folder={folder}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-1">
                <input
                  value={it.alt}
                  onChange={(e) => update(i, { alt: e.target.value })}
                  className={`rounded-input border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:outline-none ${
                    it.url && !it.alt.trim()
                      ? 'border-danger focus:border-danger'
                      : 'border-border focus:border-navy'
                  }`}
                  placeholder="Alt text — required, describes the image to screen readers"
                  aria-invalid={it.url && !it.alt.trim() ? true : undefined}
                />
                {it.url && !it.alt.trim() ? (
                  <p className="flex items-center gap-1.5 font-sans text-[11px] text-danger">
                    <AlertCircle size={11} aria-hidden />
                    Alt text is required so screen readers can describe the image.
                  </p>
                ) : null}
              </div>
              <SlideLinkPicker
                value={it.link}
                onChange={(next) => update(i, { link: next ?? undefined })}
              />
              {enableProducts ? (
                <div className="flex flex-col gap-1.5 rounded-input border border-border bg-page p-3">
                  <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
                    Featured products on this slide
                  </span>
                  <span className="font-sans text-[11px] text-muted">
                    Up to 2. Mobile floats these as small cards on the
                    right side of the slide; tapping a card opens the
                    product page.
                  </span>
                  <ProductMultiPicker
                    value={it.products ?? []}
                    onChange={(next) =>
                      update(i, {
                        products: next.length > 0 ? next : undefined,
                      })
                    }
                    max={2}
                  />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove image ${i + 1}`}
              className="self-start rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 rounded-btn border border-dashed border-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
      >
        <Plus size={14} aria-hidden /> {addLabel}
      </button>
      {hint && (
        <p className="font-sans text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}
