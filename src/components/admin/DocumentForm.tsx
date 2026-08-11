'use client';

import { useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { FileUploader } from '@/components/admin/FileUploader';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from '@/components/admin/Toast';
import { COUNTRY_CODES, COUNTRIES, type CountryCode } from '@/lib/countries';
import type { AdminDocumentType } from '@/lib/api/admin';

export interface DocumentFormValues {
  title: string;
  slug?: string;
  country: string;
  docType: AdminDocumentType;
  customDocType: string | null;
  description: string | null;
  issuingBody: string | null;
  officialSourceUrl: string | null;
  publishedDate: string | null;
  coverImageUrl: string | null;
  fileUrl: string;
  fileSizeBytes: number | null;
  /// Only present when `hideStatus` is false — intern submissions
  /// don't carry a DRAFT/PUBLISHED status of their own.
  status?: 'DRAFT' | 'PUBLISHED';
}

interface Initial {
  title?: string;
  slug?: string;
  country?: string;
  docType?: AdminDocumentType;
  customDocType?: string | null;
  description?: string | null;
  issuingBody?: string | null;
  officialSourceUrl?: string | null;
  publishedDate?: string | null;
  coverImageUrl?: string | null;
  fileUrl?: string;
  fileSizeBytes?: number | null;
  status?: 'DRAFT' | 'PUBLISHED';
}

interface Props {
  initial?: Initial;
  /// True while the caller's onSubmit promise is in flight — the
  /// form doesn't make its own network calls (mirrors ProductForm's
  /// contract, reused by both the admin editor and the intern
  /// submission page).
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (input: DocumentFormValues) => void | Promise<void>;
  onCancel?: () => void;
  /// Hides the Draft/Published sidebar + swaps the two Save buttons
  /// for a single `submitLabel` button. Used on the intern submission
  /// page, where status isn't the intern's to set — a reviewer's
  /// approve/reject decides what happens next.
  hideStatus?: boolean;
  /// True when editing an existing row (disables slug auto-derive).
  isEdit?: boolean;
}

const DOC_TYPES: { value: AdminDocumentType; label: string }[] = [
  { value: 'CONSTITUTION', label: 'Constitution' },
  { value: 'ACT', label: 'Act' },
  { value: 'BILL', label: 'Bill' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'REGULATION', label: 'Regulation' },
  { value: 'TREATY', label: 'Treaty' },
  { value: 'OTHER', label: 'Other (type your own)' },
];

/**
 * Field-editing UI for a government document — shared by the admin
 * editor (/admin/documents/new, /admin/documents/[id]) and the intern
 * submission page (/admin/document-submissions). Mirrors
 * `ProductForm`'s contract: this component owns form state and field
 * validation only; the caller owns the network call and `submitting`
 * state, same reasoning as the product-submission flow reusing the
 * admin product editor's form.
 */
export function DocumentForm({
  initial,
  submitting = false,
  submitLabel = 'Save document',
  onSubmit,
  onCancel,
  hideStatus = false,
  isEdit = false,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [country, setCountry] = useState<CountryCode | ''>(
    (initial?.country as CountryCode) ?? '',
  );
  const [docType, setDocType] = useState<AdminDocumentType>(initial?.docType ?? 'CONSTITUTION');
  const [customDocType, setCustomDocType] = useState(initial?.customDocType ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [issuingBody, setIssuingBody] = useState(initial?.issuingBody ?? '');
  const [officialSourceUrl, setOfficialSourceUrl] = useState(initial?.officialSourceUrl ?? '');
  const [publishedDate, setPublishedDate] = useState(
    initial?.publishedDate ? initial.publishedDate.slice(0, 10) : '',
  );
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? '');
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? '');
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(
    initial?.fileSizeBytes ?? null,
  );
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initial?.status ?? 'DRAFT');

  // Auto-derive slug from title when slug is empty (only on new documents).
  useEffect(() => {
    if (!isEdit && title && !slug) {
      setSlug(slugify(title));
    }
  }, [title, isEdit, slug]);

  const buildPayload = (overrideStatus?: 'DRAFT' | 'PUBLISHED'): DocumentFormValues | null => {
    if (!fileUrl) {
      toast('Upload the PDF before saving', 'error');
      return null;
    }
    if (!country) {
      toast('Pick a country', 'error');
      return null;
    }
    if (docType === 'OTHER' && !customDocType.trim()) {
      toast('Type the document type', 'error');
      return null;
    }
    return {
      title: title.trim(),
      slug: slug.trim() || undefined,
      country,
      docType,
      customDocType: docType === 'OTHER' ? customDocType.trim() : null,
      description: description.trim() || null,
      issuingBody: issuingBody.trim() || null,
      officialSourceUrl: officialSourceUrl.trim() || null,
      publishedDate: publishedDate ? new Date(publishedDate).toISOString() : null,
      coverImageUrl: coverImageUrl || null,
      fileUrl,
      fileSizeBytes,
      ...(hideStatus ? {} : { status: overrideStatus ?? status }),
    };
  };

  const submit = (overrideStatus?: 'DRAFT' | 'PUBLISHED') => {
    const payload = buildPayload(overrideStatus);
    if (payload) void onSubmit(payload);
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

        <Field
          label="Cover image"
          hint="Shown on the document card in place of the generic file icon"
        >
          <ImageUploader
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            folder="documents"
            emptyHint="Drop an image or click to pick"
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
          {!hideStatus && (
            <>
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
            </>
          )}

          <div className={`flex flex-col gap-2 ${hideStatus ? '' : 'mt-4'}`}>
            {hideStatus ? (
              <button
                type="button"
                onClick={() => submit()}
                disabled={submitting || !title.trim()}
                className="flex items-center justify-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
              >
                <Send size={14} aria-hidden /> {submitting ? 'Submitting…' : submitLabel}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => submit()}
                  disabled={submitting || !title.trim()}
                  className="flex items-center justify-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
                >
                  <Save size={14} aria-hidden /> {submitting ? 'Saving…' : 'Save'}
                </button>
                {status !== 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={() => submit('PUBLISHED')}
                    disabled={submitting || !title.trim()}
                    className="flex items-center justify-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white disabled:opacity-50"
                  >
                    <Send size={14} aria-hidden /> Save & publish now
                  </button>
                )}
              </>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="rounded-btn border border-border px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-muted hover:border-navy hover:text-navy disabled:opacity-50"
              >
                Cancel
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
          {docType === 'OTHER' && (
            <Field label="Custom type" required hint="Not in the list above — type it here">
              <input
                value={customDocType}
                onChange={(e) => setCustomDocType(e.target.value)}
                className={inputClass}
                placeholder="e.g. Executive Order"
                maxLength={60}
              />
            </Field>
          )}
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
