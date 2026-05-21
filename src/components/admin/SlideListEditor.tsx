'use client';

import { Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { SlideLinkPicker } from './SlideLinkPicker';
import type { ImageWithAlt } from '@/lib/site-content';

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
}

export function SlideListEditor({
  slides,
  onChange,
  folder = 'hero-slides',
  hint,
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
              <input
                value={it.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
                placeholder="Alt text — describes the image to screen readers"
              />
              <SlideLinkPicker
                value={it.link}
                onChange={(next) => update(i, { link: next ?? undefined })}
              />
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
        <Plus size={14} aria-hidden /> Add image
      </button>
      {hint && (
        <p className="font-sans text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}
