'use client';

import { useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { FileUploader } from '@/components/admin/FileUploader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { COUNTRY_CODES, COUNTRIES, type CountryCode } from '@/lib/countries';
import {
  adminCreateDocument,
  adminUpdateDocument,
  type AdminDocumentType,
  type AdminLibraryDocument,
} from '@/lib/api/admin';

interface Props {
  initial?: AdminLibraryDocument;
  onSaved: (doc: AdminLibraryDocument) => void;
}

const DOC_TYPES: { value: AdminDocumentType; label: string }[] = [
  { value: 'CONSTITUTION', label: 'Constitution' },
  { value: 'ACT', label: 'Act' },
  { value: 'BILL', label: 'Bill' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'REGULATION', label: 'Regulation' },
  { value: 'TREATY', label: 'Treaty' },
];

/**
 * Edit form for a GovDocument — used by both /admin/documents/new and
 * /admin/documents/[id]. Mirrors `BlogPostForm`'s structure (closest
 * existing DRAFT/PUBLISHED admin form) with Civic Library's own
 * fields swapped in. No SCHEDULED status — the API doesn't support
 * it for documents.
 */
export function DocumentForm({ initial, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [country, setCountry] = useState<CountryCode | ''>(
    (initial?.country as CountryCode) ?? '',
  );
  const [docType, setDocType] = useState<AdminDocumentType>(initial?.docType ?? 'CONSTITUTION');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [issuingBody, setIssuingBody] = useState(initial?.issuingBody ?? '');
  const [officialSourceUrl, setOfficialSourceUrl] = useState(initial?.officialSourceUrl ?? '');
  const [publishedDate, setPublishedDate] = useState(
    initial?.publishedDate ? initial.publishedDate.slice(0, 10) : '',
  );
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? '');
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(
    initial?.fileSizeBytes ?? null,
  );
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initial?.status ?? 'DRAFT');
  const [saving, setSaving] = useState(false);

  // Auto-derive slug from title when slug is empty (only on new documents).
  useEffect(() => {
    if (!initial && title && !slug) {
      setSlug(slugify(title));
    }
  }, [title, initial, slug]);

  const save = async (overrideStatus?: 'DRAFT' | 'PUBLISHED') => {
    if (!fileUrl) {
      toast('Upload the PDF before saving', 'error');
      return;
    }
    if (!country) {
      toast('Pick a country', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        country,
        docType,
        description: description.trim() || null,
        issuingBody: issuingBody.trim() || null,
        officialSourceUrl: officialSourceUrl.trim() || null,
        publishedDate: publishedDate ? new Date(publishedDate).toISOString() : null,
        fileUrl,
        fileSizeBytes,
        status: overrideStatus ?? status,
      };
      const saved = initial
        ? await adminUpdateDocument(initial.id, payload)
        : await adminCreateDocument(payload);
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
            placeholder="Constitution of the Federal Republic of Nigeria (1999)"
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

        <Field label="Description" hint="Shown on the document card and detail view">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Issuing body" hint="e.g. National Assembly of Nigeria">
          <input
            value={issuingBody}
            onChange={(e) => setIssuingBody(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Official source URL"
          hint="Link to the government's own publication — lets visitors verify this is current"
        >
          <input
            value={officialSourceUrl}
            onChange={(e) => setOfficialSourceUrl(e.target.value)}
            className={inputClass}
            placeholder="https://nass.gov.ng"
          />
        </Field>

        <Field label="Document PDF" required>
          <FileUploader
            value={fileUrl}
            onChange={(url, meta) => {
              setFileUrl(url);
              setFileSizeBytes(meta?.fileSizeBytes ?? null);
            }}
          />
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
              onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
              className={inputClass}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published (live now)</option>
            </select>
          </Field>

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
            Classification
          </p>
          <Field label="Country" required>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className={inputClass}
            >
              <option value="">Select a country…</option>
              {COUNTRY_CODES.map((c) => (
                <option key={c} value={c}>
                  {COUNTRIES[c].flag} {COUNTRIES[c].name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Document type">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as AdminDocumentType)}
              className={inputClass}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Published date" hint="When the government issued this document">
            <input
              type="date"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
              className={inputClass}
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
