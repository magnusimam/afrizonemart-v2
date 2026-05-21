'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { SlideListEditor } from '@/components/admin/SlideListEditor';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminGetContentOverrides,
  adminGetContentRegistry,
  adminUpdateContent,
  type ContentEntry,
} from '@/lib/api/admin';
import type { SlotDef } from '@/lib/site-content/registry';

interface ImageWithAlt {
  url: string;
  alt: string;
}

/**
 * Admin "Site content" page. Renders every slot in the registry with
 * the right input for its kind (text input, textarea, single image,
 * image with alt, image list with add/remove, number, boolean toggle).
 *
 * Edits are kept in local state until the admin clicks Save; saving
 * sends only changed slots in a single batch request. A "Reset to
 * default" button per slot clears the override entirely (sends `null`)
 * so the storefront falls back to the component-side hardcoded value.
 */
export default function AdminContentPage() {
  const [slots, setSlots] = useState<SlotDef[] | null>(null);
  const [original, setOriginal] = useState<Record<string, unknown>>({});
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([adminGetContentRegistry(), adminGetContentOverrides()])
      .then(([reg, ov]) => {
        setSlots(reg.slots);
        setOriginal(ov.overrides);
        setDraft(ov.overrides);
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
  }, []);

  const grouped = useMemo(() => {
    if (!slots) return [] as Array<{ page: string; sections: Array<{ section: string; slots: SlotDef[] }> }>;
    const byPage = new Map<string, Map<string, SlotDef[]>>();
    for (const s of slots) {
      if (!byPage.has(s.page)) byPage.set(s.page, new Map());
      const sec = byPage.get(s.page)!;
      if (!sec.has(s.section)) sec.set(s.section, []);
      sec.get(s.section)!.push(s);
    }
    return Array.from(byPage.entries()).map(([page, secMap]) => ({
      page,
      sections: Array.from(secMap.entries()).map(([section, slotsInSection]) => ({
        section,
        slots: slotsInSection,
      })),
    }));
  }, [slots]);

  // A slot is "dirty" when its draft value differs from what's
  // currently on the server. Used to highlight rows + trim the save
  // payload to only changed slots.
  const dirtyKeys = useMemo(() => {
    const out: string[] = [];
    if (!slots) return out;
    for (const s of slots) {
      const a = JSON.stringify(draft[s.key] ?? null);
      const b = JSON.stringify(original[s.key] ?? null);
      if (a !== b) out.push(s.key);
    }
    return out;
  }, [slots, draft, original]);

  const setValue = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const resetSlot = (key: string) => {
    // Empty string / null → clear the override on save.
    setDraft((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSave = async () => {
    if (dirtyKeys.length === 0) {
      toast('Nothing to save', 'info');
      return;
    }
    setBusy(true);
    try {
      const entries: ContentEntry[] = dirtyKeys.map((key) => ({
        key,
        // `undefined` in the draft means "clear" — translate to null.
        value: draft[key] === undefined ? null : draft[key],
      }));
      const r = await adminUpdateContent(entries);
      toast(`Saved — ${r.updated} updated, ${r.cleared} cleared`);
      // Re-pull overrides so the snapshot of "original" reflects what
      // actually got persisted (filters out any server-side rejections).
      const fresh = await adminGetContentOverrides();
      setOriginal(fresh.overrides);
      // Keep local-only deletes (undefined) out of the new draft so
      // the form shows the component default after a reset.
      setDraft(fresh.overrides);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Site content"
        subtitle="Edit text + images shown on the storefront. Defaults stay in code; everything you set here overrides them."
        action={
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || dirtyKeys.length === 0}
            className="flex items-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white disabled:opacity-50"
          >
            <Save size={14} aria-hidden /> {busy ? 'Saving…' : `Save${dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}`}
          </button>
        }
      />

      {slots === null ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map((page) => (
            <section key={page.page} className="rounded-card border border-border bg-white">
              <header className="border-b border-border bg-page px-5 py-3">
                <h2 className="font-raleway text-lg font-bold text-navy">{page.page}</h2>
              </header>
              <div className="flex flex-col divide-y divide-border">
                {page.sections.map((sec) => (
                  <div key={sec.section} className="flex flex-col gap-4 p-5">
                    <h3 className="font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
                      {sec.section}
                    </h3>
                    {sec.slots.map((s) => (
                      <SlotEditor
                        key={s.key}
                        slot={s}
                        value={draft[s.key]}
                        dirty={dirtyKeys.includes(s.key)}
                        onChange={(v) => setValue(s.key, v)}
                        onReset={() => resetSlot(s.key)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotEditor({
  slot,
  value,
  dirty,
  onChange,
  onReset,
}: {
  slot: SlotDef;
  value: unknown;
  dirty: boolean;
  onChange: (v: unknown) => void;
  onReset: () => void;
}) {
  return (
    <div
      className={`rounded-card border p-3 ${dirty ? 'border-amber bg-amber/5' : 'border-border'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          {slot.label}
        </label>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="rounded-full bg-amber/30 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              Unsaved
            </span>
          )}
          {value !== undefined && value !== null && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted hover:bg-page hover:text-navy"
              title="Clear override → use the default"
            >
              <RotateCcw size={11} aria-hidden /> Reset
            </button>
          )}
        </div>
      </div>

      <SlotInput slot={slot} value={value} onChange={onChange} />

      {slot.hint && (
        <p className="mt-1.5 font-sans text-[11px] leading-snug text-muted">{slot.hint}</p>
      )}
    </div>
  );
}

function SlotInput({
  slot,
  value,
  onChange,
}: {
  slot: SlotDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (slot.kind) {
    case 'text':
      return (
        <input
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder="(uses default)"
        />
      );
    case 'longText':
      return (
        <textarea
          rows={3}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder="(uses default)"
        />
      );
    case 'number': {
      const n = typeof value === 'number' ? value : '';
      return (
        <input
          type="number"
          min={slot.min}
          max={slot.max}
          value={n === '' ? '' : String(n)}
          onChange={(e) => {
            const next = e.target.value === '' ? undefined : Number(e.target.value);
            onChange(next);
          }}
          className={inputClass}
          placeholder="(uses default)"
        />
      );
    }
    case 'boolean': {
      const checked = value === true;
      return (
        <label className="inline-flex items-center gap-2 font-sans text-sm text-charcoal">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-navy"
          />
          On
        </label>
      );
    }
    case 'image': {
      const url = typeof value === 'object' && value !== null && typeof (value as { url?: unknown }).url === 'string'
        ? (value as { url: string }).url
        : '';
      return (
        <ImageUploader
          value={url}
          onChange={(next) => onChange(next ? { url: next } : null)}
          folder="banners"
        />
      );
    }
    case 'imageWithAlt': {
      const obj =
        typeof value === 'object' && value !== null
          ? (value as { url?: string; alt?: string })
          : { url: '', alt: '' };
      return (
        <div className="flex flex-col gap-2">
          <ImageUploader
            value={obj.url ?? ''}
            onChange={(next) => onChange({ url: next ?? '', alt: obj.alt ?? '' })}
            folder="banners"
          />
          <input
            value={obj.alt ?? ''}
            onChange={(e) => onChange({ url: obj.url ?? '', alt: e.target.value })}
            className={inputClass}
            placeholder="Alt text — required for accessibility"
          />
        </div>
      );
    }
    case 'imageList': {
      const list = (Array.isArray(value) ? value : []) as ImageWithAlt[];
      return (
        <SlideListEditor
          slides={list}
          onChange={onChange}
          hint="Per-slide link is optional. Used by mobile (product/category/country deep-links) and lets storefront hero slides become clickable in a future pass."
        />
      );
    }
    default:
      return <p className="font-sans text-sm text-muted">Unsupported slot kind: {slot.kind}</p>;
  }
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';
