'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import {
  adminDeleteCmsPage,
  adminGetCmsPage,
  adminUpdateCmsPage,
  type CmsBlock,
  type CmsPageRow,
} from '@/lib/api/admin';
import { CMS_BLOCK_PALETTE, renderBlocks } from '@/components/cms/PageBlocks';
import type { CmsBlock as RenderBlock } from '@/components/cms/PageBlocks';

export default function EditCmsPagePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [page, setPage] = useState<CmsPageRow | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await adminGetCmsPage(id);
        setPage(r);
        setTitle(r.title);
        setSlug(r.slug);
        setMetaDescription(r.metaDescription ?? '');
        setIsPublished(r.isPublished);
        setBlocks(r.blocks);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      }
    })();
  }, [id]);

  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addBlock = (entry: (typeof CMS_BLOCK_PALETTE)[number]) => {
    setBlocks((prev) => [...prev, entry.factory() as unknown as CmsBlock]);
  };

  const updateBlock = (idx: number, key: string, value: unknown) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const onSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const updated = await adminUpdateCmsPage(page.id, {
        title,
        slug,
        metaDescription: metaDescription || null,
        blocks,
        isPublished,
      });
      setPage(updated);
      toast(isPublished ? 'Page saved & live' : 'Page saved as draft', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!page) return;
    if (!confirm('Delete this page? Visitors will get a 404.')) return;
    try {
      await adminDeleteCmsPage(page.id);
      toast('Page deleted', 'success');
      router.push('/admin/pages');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  if (!page) {
    return (
      <div className="px-8 py-10">
        <p className="font-sans text-sm text-muted">Loading page…</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title={`Edit: ${page.title}`}
        subtitle={`/p/${page.slug}`}
        action={
          <div className="flex items-center gap-2">
            {page.isPublished && (
              <a
                href={`/p/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-btn border border-border bg-white px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:border-navy"
              >
                <ExternalLink size={12} aria-hidden /> View live
              </a>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy disabled:opacity-60"
            >
              <Save size={14} aria-hidden />
              {saving ? 'Saving…' : isPublished ? 'Save & publish' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-btn border border-danger/30 bg-white px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:bg-danger/5"
            >
              Delete
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor pane */}
        <section className="flex flex-col gap-4 lg:col-span-6">
          <div className="rounded-card border border-border bg-white p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Page settings
            </h3>
            <div className="flex flex-col gap-3">
              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                />
              </Field>
              <Field label="Slug" hint={`Page URL: /p/${slug}`}>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="[a-z0-9]+(?:[-/][a-z0-9]+)*"
                  className="rounded-input border border-border bg-white px-3 py-2 font-mono text-sm focus:border-navy focus:outline-none"
                />
              </Field>
              <Field label="Meta description (SEO)">
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                />
              </Field>
              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <span className="font-sans text-sm text-charcoal">
                  Published — visible at /p/{slug}
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-card border border-border bg-white p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Blocks
            </h3>
            <div className="flex flex-col gap-3">
              {blocks.map((block, idx) => (
                <BlockEditor
                  key={idx}
                  block={block}
                  onChange={(k, v) => updateBlock(idx, k, v)}
                  onMoveUp={() => moveBlock(idx, -1)}
                  onMoveDown={() => moveBlock(idx, 1)}
                  onRemove={() => removeBlock(idx)}
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                />
              ))}
              {blocks.length === 0 && (
                <p className="rounded-card border border-dashed border-border px-4 py-6 text-center font-sans text-sm text-muted">
                  No blocks yet — pick from the palette below.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-card border border-border bg-page p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Palette — click to add
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {CMS_BLOCK_PALETTE.map((entry) => (
                <button
                  key={entry.type}
                  type="button"
                  onClick={() => addBlock(entry)}
                  className="flex flex-col items-start gap-0.5 rounded-card border border-border bg-white px-3 py-2 text-left hover:border-navy"
                >
                  <span className="flex items-center gap-1 font-raleway text-xs font-bold text-navy">
                    <Plus size={10} aria-hidden />
                    {entry.label}
                  </span>
                  <span className="font-sans text-[10px] text-muted">{entry.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Live preview pane */}
        <section className="lg:col-span-6">
          <div className="rounded-card border border-border bg-white p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Live preview
            </h3>
            <div className="overflow-y-auto rounded-card border border-border" style={{ maxHeight: 720 }}>
              {renderBlocks(blocks as unknown as RenderBlock[])}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

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
    <label className="flex flex-col gap-1">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function BlockEditor({
  block,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: {
  block: CmsBlock;
  onChange: (key: string, value: unknown) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="rounded-card border border-border bg-page px-3 py-3">
      <header className="mb-2 flex items-center justify-between">
        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
          {String(block.type)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded p-1 text-muted hover:bg-white disabled:opacity-30"
          >
            <ChevronUp size={12} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded p-1 text-muted hover:bg-white disabled:opacity-30"
          >
            <ChevronDown size={12} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={12} aria-hidden />
          </button>
        </div>
      </header>
      <BlockInputs block={block} onChange={onChange} />
    </div>
  );
}

function BlockInputs({
  block,
  onChange,
}: {
  block: CmsBlock;
  onChange: (key: string, value: unknown) => void;
}) {
  const inputCls =
    'w-full rounded-input border border-border bg-white px-2 py-1 font-sans text-sm focus:border-navy focus:outline-none';
  const ta =
    'w-full rounded-input border border-border bg-white px-2 py-1 font-sans text-sm focus:border-navy focus:outline-none';

  switch (block.type) {
    case 'hero':
      return (
        <div className="flex flex-col gap-2">
          <input placeholder="Eyebrow" value={(block.eyebrow as string) ?? ''} onChange={(e) => onChange('eyebrow', e.target.value)} className={inputCls} />
          <input placeholder="Heading" value={(block.heading as string) ?? ''} onChange={(e) => onChange('heading', e.target.value)} className={inputCls} />
          <textarea placeholder="Subheading" value={(block.subheading as string) ?? ''} onChange={(e) => onChange('subheading', e.target.value)} rows={2} className={ta} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="CTA label" value={(block.ctaLabel as string) ?? ''} onChange={(e) => onChange('ctaLabel', e.target.value)} className={inputCls} />
            <input placeholder="CTA href" value={(block.ctaHref as string) ?? ''} onChange={(e) => onChange('ctaHref', e.target.value)} className={`${inputCls} font-mono text-xs`} />
          </div>
          <input placeholder="Image URL" value={(block.image as string) ?? ''} onChange={(e) => onChange('image', e.target.value)} className={`${inputCls} font-mono text-xs`} />
        </div>
      );
    case 'rich-text':
      return (
        <textarea
          value={(block.html as string) ?? ''}
          onChange={(e) => onChange('html', e.target.value)}
          rows={8}
          className={`${ta} font-mono text-xs`}
          placeholder="<p>HTML body…</p>"
        />
      );
    case 'banner':
      return (
        <div className="flex flex-col gap-2">
          <input placeholder="Text" value={(block.text as string) ?? ''} onChange={(e) => onChange('text', e.target.value)} className={inputCls} />
          <input placeholder="Href (optional)" value={(block.href as string) ?? ''} onChange={(e) => onChange('href', e.target.value)} className={`${inputCls} font-mono text-xs`} />
          <select value={(block.tone as string) ?? 'amber'} onChange={(e) => onChange('tone', e.target.value)} className={inputCls}>
            <option value="amber">Amber</option>
            <option value="navy">Navy</option>
            <option value="success">Green</option>
          </select>
        </div>
      );
    case 'image':
      return (
        <div className="flex flex-col gap-2">
          <input placeholder="Image URL" value={(block.src as string) ?? ''} onChange={(e) => onChange('src', e.target.value)} className={`${inputCls} font-mono text-xs`} />
          <input placeholder="Alt text" value={(block.alt as string) ?? ''} onChange={(e) => onChange('alt', e.target.value)} className={inputCls} />
          <input placeholder="Caption (optional)" value={(block.caption as string) ?? ''} onChange={(e) => onChange('caption', e.target.value)} className={inputCls} />
        </div>
      );
    case 'image-grid': {
      const images = ((block.images as Array<{ src: string; alt?: string; href?: string }>) ?? []);
      return (
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <div key={i} className="grid grid-cols-3 gap-1">
              <input placeholder="Image URL" value={img.src} onChange={(e) => {
                const next = [...images];
                next[i] = { ...img, src: e.target.value };
                onChange('images', next);
              }} className={`${inputCls} font-mono text-xs`} />
              <input placeholder="Alt" value={img.alt ?? ''} onChange={(e) => {
                const next = [...images];
                next[i] = { ...img, alt: e.target.value };
                onChange('images', next);
              }} className={inputCls} />
              <input placeholder="Link (optional)" value={img.href ?? ''} onChange={(e) => {
                const next = [...images];
                next[i] = { ...img, href: e.target.value };
                onChange('images', next);
              }} className={inputCls} />
            </div>
          ))}
          <button type="button" onClick={() => onChange('images', [...images, { src: '', alt: '' }])} className="self-start rounded-btn border border-border bg-white px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:border-navy">
            + image
          </button>
        </div>
      );
    }
    case 'cta':
      return (
        <div className="flex flex-col gap-2">
          <input placeholder="Heading" value={(block.heading as string) ?? ''} onChange={(e) => onChange('heading', e.target.value)} className={inputCls} />
          <input placeholder="Subheading" value={(block.subheading as string) ?? ''} onChange={(e) => onChange('subheading', e.target.value)} className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Label" value={(block.label as string) ?? ''} onChange={(e) => onChange('label', e.target.value)} className={inputCls} />
            <input placeholder="Href" value={(block.href as string) ?? ''} onChange={(e) => onChange('href', e.target.value)} className={`${inputCls} font-mono text-xs`} />
          </div>
        </div>
      );
    case 'spacer':
      return (
        <input
          type="number"
          value={(block.size as number) ?? 48}
          onChange={(e) => onChange('size', Number(e.target.value) || 48)}
          className={inputCls}
        />
      );
    case 'divider':
      return <p className="font-sans text-xs text-muted">Renders a horizontal line.</p>;
    default:
      return <p className="font-sans text-xs text-muted">No editor for &quot;{String(block.type)}&quot; yet.</p>;
  }
}
