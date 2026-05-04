'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  History,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateSection,
  adminDeleteSection,
  adminGetSitePage,
  adminListSitePageRevisions,
  adminPublishSitePage,
  adminReorderSections,
  adminRevertSitePage,
  adminUpdateSection,
  type AdminPage,
  type AdminPageRevision,
  type AdminSectionInput,
} from '@/lib/api/admin';
import type { ApiPageSection, SectionType } from '@/lib/api/page-builder';
import { SectionEditor } from '@/components/admin/page-builder/SectionEditor';

const SECTION_TYPES: { value: SectionType; label: string; description: string }[] = [
  { value: 'hero', label: 'Hero / Slider', description: 'Full-width carousel with images, headlines, and CTAs.' },
  { value: 'product-grid', label: 'Product grid', description: 'A grid of products from a category, deals, new arrivals, or hand-picked.' },
  { value: 'category-shelf', label: 'Category shelf', description: 'Tiles linking to specific categories — grid or scrolling carousel.' },
  { value: 'image-banner', label: 'Image banner', description: 'Single image with optional overlay text + CTA.' },
  { value: 'rich-text', label: 'Rich text', description: 'A block of HTML for paragraphs, headings, or any custom content.' },
  { value: 'africa-map', label: 'Africa map', description: 'The interactive country map.' },
  { value: 'newsletter', label: 'Newsletter signup', description: 'Email capture for the newsletter.' },
  { value: 'trust-bar', label: 'Trust bar', description: 'Row of icon + label items (free shipping, returns, etc).' },
  { value: 'quotation-form', label: 'Quotation form', description: 'Custom-quote contact form.' },
  { value: 'country-shelf', label: 'Country shelf', description: 'Twin scrolling marquee of country tiles.' },
  { value: 'feature-cards', label: 'Feature cards', description: 'Large card grid with image, name, description, and CTA.' },
  { value: 'services-grid', label: 'Services grid', description: 'Optional hero card + row of service tiles.' },
  { value: 'text-strip', label: 'Text strip', description: 'Single-line accent banner.' },
  { value: 'rewards-tiers', label: 'Rewards tiers', description: 'Loyalty tier ladder with images, intro text, perks, and accent colors.' },
  { value: 'cta-cards', label: 'CTA cards', description: 'Pair (or trio) of bold side-by-side action cards.' },
  { value: 'marquee-strip', label: 'Marquee strip', description: 'Auto-scrolling text ticker.' },
  { value: 'final-cta', label: 'Final CTA panel', description: 'Highlighted closer with eyebrow, headline, and 1–2 buttons.' },
];

const ACCENT_PRESETS = ['amber', 'navy', 'success', 'danger', 'info', 'charcoal', 'muted'];

export default function SitePageBuilder({ params }: { params: { id: string } }) {
  const [page, setPage] = useState<AdminPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<AdminPageRevision[] | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishNote, setPublishNote] = useState('');

  const load = () =>
    adminGetSitePage(params.id)
      .then(setPage)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, [params.id]);

  const sections = page?.sections ?? [];
  const editingSection = useMemo(
    () => sections.find((s) => s.id === editingSectionId) ?? null,
    [sections, editingSectionId],
  );

  const handleAddSection = async (type: SectionType) => {
    setBusy(true);
    try {
      const created = await adminCreateSection(params.id, {
        type,
        config: defaultConfigForType(type),
      } as AdminSectionInput);
      toast(`Added ${type} section`);
      setAdding(false);
      await load();
      setEditingSectionId(created.id);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to add section', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (sectionId: string, direction: 'up' | 'down') => {
    if (!page) return;
    const ids = page.sections.map((s) => s.id);
    const idx = ids.indexOf(sectionId);
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    const next = [...ids];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setBusy(true);
    try {
      const updated = await adminReorderSections(params.id, next);
      setPage(updated);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to reorder', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setBusy(true);
    try {
      await adminDeleteSection(params.id, pendingDeleteId);
      toast('Deleted');
      setPendingDeleteId(null);
      if (editingSectionId === pendingDeleteId) setEditingSectionId(null);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleVisible = async (s: ApiPageSection) => {
    setBusy(true);
    try {
      await adminUpdateSection(params.id, s.id, { visible: !s.visible });
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to update', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setPublishing(true);
    try {
      const updated = await adminPublishSitePage(params.id, publishNote || null);
      setPage(updated);
      setPublishNote('');
      toast('Published — live on the site within 60 seconds');
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to publish', 'error');
    } finally {
      setBusy(false);
      setPublishing(false);
    }
  };

  const loadRevisions = async () => {
    try {
      const r = await adminListSitePageRevisions(params.id);
      setRevisions(r.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load revisions', 'error');
    }
  };

  const handleRevert = async (revisionId: string) => {
    if (!confirm('Revert to this revision? Current sections will be replaced.')) return;
    setBusy(true);
    try {
      const updated = await adminRevertSitePage(params.id, revisionId);
      setPage(updated);
      toast('Reverted — click Publish to make it live');
      void loadRevisions();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to revert', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!page) {
    return (
      <div className="px-8 py-10 font-sans text-sm text-muted">Loading page builder…</div>
    );
  }

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/site-pages"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ArrowLeft size={12} aria-hidden /> All pages
      </Link>

      <AdminPageHeader
        title={page.title}
        subtitle={`/${page.slug} · ${
          page.publishedAt
            ? `Live (custom) — published ${new Date(page.publishedAt).toLocaleString()}`
            : 'Live (default) — page renders from its hardcoded layout. Publish to take over.'
        }`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRevisionsOpen((v) => !v);
                if (!revisions) void loadRevisions();
              }}
              className="flex items-center gap-2 rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:border-navy"
            >
              <History size={14} aria-hidden /> Revisions
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={busy}
              className="flex items-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white hover:text-navy disabled:opacity-50"
            >
              <Send size={14} aria-hidden /> {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        }
      />

      {revisionsOpen && (
        <div className="mb-6 rounded-card border border-border bg-white p-4">
          <p className="mb-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
            Revision history (last 50)
          </p>
          {revisions === null ? (
            <p className="font-sans text-sm text-muted">Loading…</p>
          ) : revisions.length === 0 ? (
            <p className="font-sans text-sm text-muted">
              No revisions yet — Publish creates the first one.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <div className="flex flex-col">
                    <span className="font-sans text-sm text-charcoal">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                    <span className="font-sans text-xs text-muted">
                      {r.authorEmail ?? 'system'}
                      {r.note && ` · ${r.note}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevert(r.id)}
                    disabled={busy}
                    className="rounded-md px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page disabled:opacity-50"
                  >
                    Revert to this
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Section list */}
        <div className="flex flex-col gap-2">
          {sections.length === 0 && (
            <div className="rounded-card border border-dashed border-border bg-white p-6 text-center font-sans text-sm text-muted">
              No sections yet. Add one to start building.
            </div>
          )}
          {sections.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setEditingSectionId(s.id)}
              className={`group flex flex-col gap-1 rounded-card border p-3 text-left transition ${
                editingSectionId === s.id
                  ? 'border-navy bg-navy/5'
                  : 'border-border bg-white hover:border-navy'
              } ${!s.visible ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                  {s.type}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleMove(s.id, 'up');
                    }}
                    disabled={busy || idx === 0}
                    className="rounded p-1 text-muted hover:bg-page hover:text-navy disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp size={12} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleMove(s.id, 'down');
                    }}
                    disabled={busy || idx === sections.length - 1}
                    className="rounded p-1 text-muted hover:bg-page hover:text-navy disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown size={12} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleVisible(s);
                    }}
                    disabled={busy}
                    className="rounded p-1 text-muted hover:bg-page hover:text-navy"
                    aria-label={s.visible ? 'Hide' : 'Show'}
                  >
                    {s.visible ? <Eye size={12} aria-hidden /> : <EyeOff size={12} aria-hidden />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteId(s.id);
                    }}
                    disabled={busy}
                    className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
                    aria-label="Delete"
                  >
                    <Trash2 size={12} aria-hidden />
                  </button>
                </div>
              </div>
              <span className="font-raleway text-sm font-semibold text-navy">
                {s.headline ?? <em className="text-muted">No headline</em>}
              </span>
            </button>
          ))}

          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center justify-center gap-2 rounded-card border border-dashed border-navy bg-white px-3 py-4 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
            >
              <Plus size={14} aria-hidden /> Add section
            </button>
          ) : (
            <div className="rounded-card border border-amber/40 bg-amber/10 p-3">
              <p className="mb-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                Pick a section type
              </p>
              <ul className="flex max-h-[400px] flex-col gap-1 overflow-y-auto">
                {SECTION_TYPES.map((t) => (
                  <li key={t.value}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAddSection(t.value)}
                      className="w-full rounded-md bg-white p-2 text-left hover:bg-amber/20 disabled:opacity-50"
                    >
                      <div className="font-raleway text-xs font-bold text-navy">{t.label}</div>
                      <div className="font-sans text-[11px] text-muted">{t.description}</div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="mt-2 w-full rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal hover:bg-page"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Editor pane */}
        <div className="rounded-card border border-border bg-white p-6">
          {editingSection ? (
            <SectionEditorPane
              key={editingSection.id}
              pageId={params.id}
              section={editingSection}
              onSaved={() => void load()}
            />
          ) : (
            <p className="text-center font-sans text-sm text-muted">
              Select a section on the left to edit it, or add a new one.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-card border border-border bg-white p-4">
        <Field label="Publish note (optional)" hint="Shown in revision history">
          <input
            value={publishNote}
            onChange={(e) => setPublishNote(e.target.value)}
            placeholder="e.g. Black Friday banner live"
            className="w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
          />
        </Field>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete section?"
        message="This removes the section from the page. The change goes live the next time you Publish."
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => !busy && setPendingDeleteId(null)}
      />
    </div>
  );
}

function SectionEditorPane({
  pageId,
  section,
  onSaved,
}: {
  pageId: string;
  section: ApiPageSection;
  onSaved: () => void;
}) {
  const [headline, setHeadline] = useState(section.headline ?? '');
  const [subheadline, setSubheadline] = useState(section.subheadline ?? '');
  const [accentColor, setAccentColor] = useState(section.accentColor ?? '');
  const [config, setConfig] = useState(section.config as Record<string, unknown>);
  const [startsAt, setStartsAt] = useState(
    section.startsAt ? toLocalDT(new Date(section.startsAt)) : '',
  );
  const [endsAt, setEndsAt] = useState(
    section.endsAt ? toLocalDT(new Date(section.endsAt)) : '',
  );
  const [countriesRaw, setCountriesRaw] = useState((section.countries ?? []).join(', '));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const countries = countriesRaw
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length === 2);
      await adminUpdateSection(pageId, section.id, {
        headline: headline.trim() || null,
        subheadline: subheadline.trim() || null,
        accentColor: accentColor.trim() || null,
        config,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        countries,
      });
      toast('Saved');
      onSaved();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
            Editing
          </p>
          <h2 className="font-raleway text-xl font-bold text-navy">{section.type}</h2>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
        >
          <Save size={14} aria-hidden /> {saving ? 'Saving…' : 'Save section'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Section headline" hint="Heading shown above the section content">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Subheadline">
          <input
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Accent color"
          hint="Color of the small bar above the headline. Pick a preset or paste a hex (#FF6600)."
        >
          <div className="flex flex-wrap gap-1.5">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAccentColor(preset)}
                className={`rounded-full px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn ${
                  accentColor === preset
                    ? 'bg-navy text-white'
                    : 'border border-border bg-white text-charcoal hover:border-navy'
                }`}
              >
                {preset}
              </button>
            ))}
            <input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#hex"
              className={`${inputClass} w-28 font-mono text-[12px]`}
            />
          </div>
        </Field>
      </div>

      <div className="rounded-card border border-border bg-page/40 p-4">
        <p className="mb-3 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
          {section.type} — settings
        </p>
        <SectionEditor type={section.type} value={config} onChange={setConfig} />
      </div>

      <div className="rounded-card border border-border bg-page/40 p-4">
        <p className="mb-3 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
          Visibility & targeting (optional)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Show from" hint="Section is hidden before this time">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Hide after" hint="Section is hidden after this time">
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Show only in countries"
            hint="ISO-2 codes, comma-separated (e.g. NG, KE, ZA). Leave empty for global."
          >
            <input
              value={countriesRaw}
              onChange={(e) => setCountriesRaw(e.target.value)}
              className={`${inputClass} font-mono uppercase`}
              placeholder="NG, KE"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function toLocalDT(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultConfigForType(type: SectionType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return {
        autoplayMs: 5000,
        showDots: true,
        slides: [
          { imageUrl: '', imageAlt: '', headline: 'New hero headline' },
        ],
      };
    case 'product-grid':
      return {
        source: { kind: 'on-sale' },
        columns: 4,
        rows: 2,
      };
    case 'category-shelf':
      return { categorySlugs: [], layout: 'grid' };
    case 'image-banner':
      return { imageUrl: '', imageAlt: '', width: 'container' };
    case 'rich-text':
      return { html: '<p>Edit me</p>', align: 'left' };
    case 'africa-map':
      return {};
    case 'newsletter':
      return { headline: 'Stay in the loop', ctaLabel: 'Subscribe' };
    case 'trust-bar':
      return {
        items: [{ icon: 'shield-check', label: 'Trust badge', sublabel: 'Subtitle' }],
      };
    case 'quotation-form':
      return { headline: 'Need a custom quote?' };
    case 'country-shelf':
      return { headline: 'Shop By Country', countryCodes: [] };
    case 'feature-cards':
      return { cardsPerRow: 3, cards: [] };
    case 'services-grid':
      return { services: [] };
    case 'text-strip':
      return { text: 'For Your Ultimate Satisfaction' };
    case 'rewards-tiers':
      return {
        layout: 'ladder',
        tiers: [
          {
            name: 'Tier name',
            minPoints: 0,
            accentColor: 'navy',
            imageUrl: null,
            imageAlt: null,
            intro: null,
            perks: [],
            readMoreHref: null,
            readMoreLabel: null,
          },
        ],
      };
    case 'cta-cards':
      return {
        cards: [
          { headline: 'New customer? Register now', subheadline: 'Sign up in seconds.', href: '/register', background: 'amber' },
          { headline: 'Already a customer? Sign in', subheadline: 'Continue where you left off.', href: '/login', background: 'navy' },
        ],
      };
    case 'marquee-strip':
      return {
        items: ['Free shipping over ₦15,000', 'Buy now, pay later at checkout'],
        background: 'amber',
        durationSeconds: 30,
      };
    case 'final-cta':
      return {
        eyebrow: 'Limited time',
        headline: 'Headline goes here',
        body: 'Supporting copy that explains the offer.',
        background: 'gradient-navy',
        primaryCta: { label: 'Primary action', href: '/' },
        secondaryCta: null,
      };
    default:
      return {};
  }
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';

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
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
