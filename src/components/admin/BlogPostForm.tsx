'use client';

import { useEffect, useState } from 'react';
import { Eye, Save, Send, X } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateBlogPost,
  adminUpdateBlogPost,
  type AdminBlogPost,
} from '@/lib/api/admin';

interface Props {
  initial?: AdminBlogPost;
  onSaved: (post: AdminBlogPost) => void;
}

/**
 * Edit form for a blog post — used by both /admin/blog/new and
 * /admin/blog/[id]. Status flow: DRAFT (default) → PUBLISHED (live now)
 * or → SCHEDULED (live at publishedAt). The cron flips SCHEDULED to
 * PUBLISHED when its time arrives.
 */
export function BlogPostForm({ initial, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '<p></p>');
  const [heroImage, setHeroImage] = useState(initial?.heroImage ?? '');
  const [heroImageAlt, setHeroImageAlt] = useState(initial?.heroImageAlt ?? '');
  const [authorName, setAuthorName] = useState(initial?.authorName ?? '');
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(', '));
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? '');
  const [ogImage, setOgImage] = useState(initial?.ogImage ?? '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'SCHEDULED'>(
    initial?.status ?? 'DRAFT',
  );
  const [scheduledAt, setScheduledAt] = useState(
    initial?.publishedAt ? toLocalDateTime(new Date(initial.publishedAt)) : '',
  );
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-derive slug from title when slug is empty (only on new posts).
  useEffect(() => {
    if (!initial && title && !slug) {
      setSlug(slugify(title));
    }
  }, [title, initial, slug]);

  const save = async (overrideStatus?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED') => {
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || null,
        content,
        heroImage: heroImage.trim() || null,
        heroImageAlt: heroImageAlt.trim() || null,
        authorName: authorName.trim() || null,
        tags: tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        ogImage: ogImage.trim() || null,
        status: overrideStatus ?? status,
        publishedAt:
          (overrideStatus ?? status) === 'SCHEDULED' && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null,
      };
      const saved = initial
        ? await adminUpdateBlogPost(initial.id, payload)
        : await adminCreateBlogPost(payload);
      toast(initial ? 'Saved' : 'Created');
      onSaved(saved);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <Field label="Title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputClass} text-xl font-bold`}
            placeholder="Post title"
          />
        </Field>

        <Field label="Slug" hint="Auto-derived from title — edit if you need a custom URL">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${inputClass} font-mono`}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
        </Field>

        <Field label="Excerpt" hint="One-line summary shown on the blog list and used as the SEO description fallback">
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Hero image">
          <ImageUploader
            value={heroImage}
            onChange={(url) => setHeroImage(url ?? '')}
            folder="blog"
          />
        </Field>

        <Field label="Hero image alt text" hint="Required for SEO + screen readers">
          <input
            value={heroImageAlt}
            onChange={(e) => setHeroImageAlt(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Body"
          hint="HTML — use <p>, <h2>, <ul>, <a>, <img>, etc. Rich-text editor coming soon."
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-muted">
                {content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length} words ·{' '}
                {Math.max(1, Math.round(content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length / 200))}{' '}
                min read
              </span>
              <button
                type="button"
                onClick={() => setPreviewing((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
              >
                {previewing ? <X size={12} aria-hidden /> : <Eye size={12} aria-hidden />}
                {previewing ? 'Edit' : 'Preview'}
              </button>
            </div>
            {previewing ? (
              <div
                className="prose prose-navy min-h-[300px] max-w-none rounded-input border border-border bg-white p-4"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(content, { USE_PROFILES: { html: true } }),
                }}
              />
            ) : (
              <textarea
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`${inputClass} font-mono text-[13px]`}
              />
            )}
          </div>
        </Field>
      </div>

      {/* Sidebar */}
      <aside className="flex flex-col gap-4">
        <div className="rounded-card border border-border bg-white p-4">
          <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
            Publish
          </p>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED')
              }
              className={inputClass}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published (live now)</option>
              <option value="SCHEDULED">Scheduled (publish later)</option>
            </select>
          </Field>
          {status === 'SCHEDULED' && (
            <Field label="Publish at" hint="A cron flips status to Published when this time arrives">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !title.trim()}
              className="flex items-center justify-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
            >
              <Save size={14} aria-hidden /> {saving ? 'Saving…' : 'Save'}
            </button>
            {status !== 'PUBLISHED' && (
              <button
                type="button"
                onClick={() => void save('PUBLISHED')}
                disabled={saving || !title.trim()}
                className="flex items-center justify-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white disabled:opacity-50"
              >
                <Send size={14} aria-hidden /> Save & publish now
              </button>
            )}
          </div>
        </div>

        <div className="rounded-card border border-border bg-white p-4">
          <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
            Author + tags
          </p>
          <Field label="Author display name" hint="Shown on the post — auto-set to your account if blank">
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Tags" hint="Comma-separated">
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              className={inputClass}
              placeholder="african food, recipes, travel"
            />
          </Field>
        </div>

        <div className="rounded-card border border-border bg-white p-4">
          <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
            SEO
          </p>
          <Field label="Meta title" hint="Falls back to post title">
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Meta description" hint="Falls back to excerpt">
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Open Graph image URL" hint="Falls back to hero image">
            <input
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              className={inputClass}
              placeholder="https://images.afrizonemart.com/..."
            />
          </Field>
        </div>
      </aside>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toLocalDateTime(d: Date): string {
  // Format Date as "YYYY-MM-DDTHH:mm" for <input type="datetime-local">.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 flex flex-col gap-1.5 last:mb-0">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
