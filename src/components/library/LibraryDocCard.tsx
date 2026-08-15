'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { getCountry } from '@/lib/countries';
import { Flag } from '@/components/common/Flag';
import { trackLibraryDownload } from '@/lib/api/documents';
import type { ApiLibraryDocument, DocumentType } from '@/lib/api/documents';

/// Mirrors `ProductCardPlaceholder`'s layout (article / image-area /
/// title / action row) so Civic Library reads visually as part of the
/// same product-card language — minus every commerce concern (no
/// price, no wishlist, no cart). The action slot is a plain download
/// link instead of Add-to-Cart.

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  CONSTITUTION: 'Constitution',
  ACT: 'Act',
  BILL: 'Bill',
  POLICY: 'Policy',
  REGULATION: 'Regulation',
  TREATY: 'Treaty',
  OTHER: 'Other',
};

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function LibraryDocCard({ doc }: { doc: ApiLibraryDocument }) {
  const country = getCountry(doc.country);
  const fileSize = formatFileSize(doc.fileSizeBytes);
  const typeLabel = doc.docType === 'OTHER' ? (doc.customDocType ?? 'Other') : DOC_TYPE_LABELS[doc.docType];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <div className="absolute right-2 top-2 z-20 rounded-input bg-navy px-2 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-white">
        {typeLabel}
      </div>

      <Link
        href={`/library/${doc.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-page"
      >
        {doc.coverImageUrl ? (
          <Image
            src={doc.coverImageUrl}
            alt={doc.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <FileText size={48} strokeWidth={1.25} className="text-border" aria-hidden />
        )}

        {country && (
          <div
            className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-input bg-white/95 px-1.5 py-0.5 font-sans text-[11px] font-semibold leading-tight text-charcoal shadow-sm backdrop-blur md:text-[10px]"
            title={country.name}
          >
            <Flag code={country.code} title={country.name} size="sm" />
            <span>{country.name}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.5em] font-raleway text-xs font-semibold leading-snug text-charcoal md:text-xs">
          <Link href={`/library/${doc.slug}`} className="transition-colors hover:text-navy">
            {doc.title}
          </Link>
        </h3>

        {doc.issuingBody ? (
          <p className="line-clamp-1 font-sans text-[11px] text-muted">{doc.issuingBody}</p>
        ) : null}

        <a
          href={doc.fileUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLibraryDownload(doc.id)}
          className="mt-auto inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-btn bg-navy px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy active:scale-[0.98]"
        >
          <Download size={14} aria-hidden />
          Download{fileSize ? ` (${fileSize})` : ''}
        </a>
      </div>
    </article>
  );
}
