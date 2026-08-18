import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Download, ExternalLink, FileText, Home as HomeIcon } from 'lucide-react';
import { Flag } from '@/components/common/Flag';
import { fetchLibraryDoc, type ApiLibraryDocument, type DocumentType } from '@/lib/api/documents';
import { getCountry } from '@/lib/countries';
import { SITE_NAME, SITE_URL, absUrl, metaDescription } from '@/lib/seo';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  CONSTITUTION: 'Constitution',
  ACT: 'Act',
  BILL: 'Bill',
  POLICY: 'Policy',
  REGULATION: 'Regulation',
  TREATY: 'Treaty',
  OTHER: 'Other',
};

async function loadDoc(slug: string): Promise<ApiLibraryDocument | null> {
  try {
    return await fetchLibraryDoc(slug);
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const doc = await loadDoc(params.slug);
  if (!doc) {
    return { title: 'Document Not Found', robots: { index: false, follow: true } };
  }
  const country = getCountry(doc.country);
  const typeLabel = doc.docType === 'OTHER' ? (doc.customDocType ?? 'Other') : DOC_TYPE_LABELS[doc.docType];
  const title = country ? `${doc.title} — ${typeLabel} (${country.name})` : `${doc.title} — ${typeLabel}`;
  const description = metaDescription(
    doc.description ?? `Free download: ${doc.title}, ${typeLabel}${country ? ` for ${country.name}` : ''}. No account required.`,
  );
  const url = `/library/${doc.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url: absUrl(url),
      siteName: SITE_NAME,
      title,
      description,
      images: doc.coverImageUrl ? [{ url: doc.coverImageUrl, alt: doc.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: doc.coverImageUrl ? [doc.coverImageUrl] : undefined,
    },
  };
}

export default async function LibraryDocPage({ params }: PageProps) {
  const doc = await loadDoc(params.slug);
  if (!doc) notFound();

  const country = getCountry(doc.country);
  const typeLabel = doc.docType === 'OTHER' ? (doc.customDocType ?? 'Other') : DOC_TYPE_LABELS[doc.docType];
  const fileSize = formatFileSize(doc.fileSizeBytes);
  const docUrl = `${SITE_URL}/library/${doc.slug}`;

  // Schema.org structured data — Legislation covers government
  // constitutions/acts/bills/policies/regulations/treaties well
  // (Google's own guidance uses it for exactly this document class),
  // plus a BreadcrumbList so search results show breadcrumb chips.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Legislation',
        '@id': `${docUrl}#document`,
        name: doc.title,
        description: metaDescription(doc.description ?? undefined),
        url: docUrl,
        legislationType: typeLabel,
        legislationJurisdiction: country?.name ?? doc.country,
        legislationDate: doc.publishedDate ?? undefined,
        image: doc.coverImageUrl ?? undefined,
        publisher: doc.issuingBody ? { '@type': 'Organization', name: doc.issuingBody } : undefined,
        isBasedOn: doc.officialSourceUrl ?? undefined,
        encoding: {
          '@type': 'MediaObject',
          contentUrl: doc.fileUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Civic Library', item: `${SITE_URL}/library` },
          { '@type': 'ListItem', position: 3, name: doc.title, item: docUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-page pb-16">
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-navy">
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <Link href="/library" className="hover:text-navy">
                Civic Library
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="line-clamp-1 font-medium text-charcoal">{doc.title}</span>
            </li>
          </ol>
        </nav>

        <div className="mx-auto grid max-w-site gap-8 px-4 py-8 md:grid-cols-12 md:py-12">
          <div className="md:col-span-4">
            <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-card bg-white shadow-card">
              {doc.coverImageUrl ? (
                <Image
                  src={doc.coverImageUrl}
                  alt={doc.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <FileText size={64} strokeWidth={1.25} className="text-border" aria-hidden />
              )}
              {country && (
                <div
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-input bg-white/95 px-2 py-1 font-sans text-xs font-semibold text-charcoal shadow-sm backdrop-blur"
                  title={country.name}
                >
                  <Flag code={country.code} title={country.name} size="sm" />
                  <span>{country.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:col-span-8">
            <div>
              <span className="inline-flex w-fit items-center rounded-full bg-navy/10 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                {typeLabel}
              </span>
              <h1 className="mt-2 font-raleway text-2xl font-bold leading-tight text-navy md:text-4xl">
                {doc.title}
              </h1>
              {doc.issuingBody ? (
                <p className="mt-1 font-sans text-sm text-muted">{doc.issuingBody}</p>
              ) : null}
            </div>

            {doc.description ? (
              <p className="max-w-2xl font-sans text-sm leading-relaxed text-charcoal md:text-base">
                {doc.description}
              </p>
            ) : null}

            <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-2 rounded-card border border-border bg-white p-4 font-sans text-sm">
              {country ? (
                <>
                  <dt className="text-muted">Country</dt>
                  <dd className="text-charcoal">{country.name}</dd>
                </>
              ) : null}
              <dt className="text-muted">Type</dt>
              <dd className="text-charcoal">{typeLabel}</dd>
              {doc.publishedDate ? (
                <>
                  <dt className="text-muted">Published</dt>
                  <dd className="text-charcoal">
                    {new Date(doc.publishedDate).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </>
              ) : null}
              {fileSize ? (
                <>
                  <dt className="text-muted">File size</dt>
                  <dd className="text-charcoal">{fileSize}</dd>
                </>
              ) : null}
            </dl>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={doc.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-btn bg-navy px-6 font-raleway text-sm font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy active:scale-[0.98]"
              >
                <Download size={16} aria-hidden />
                Download{fileSize ? ` (${fileSize})` : ''} — Free, no account needed
              </a>
              {doc.officialSourceUrl ? (
                <a
                  href={doc.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-btn border border-border bg-white px-5 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal transition-colors hover:border-navy hover:text-navy"
                >
                  <ExternalLink size={14} aria-hidden />
                  View Official Source
                </a>
              ) : null}
            </div>

            <p className="max-w-xl font-sans text-xs text-muted">
              Sourced from official government publications. Always verify
              against the official source before relying on this document
              for legal purposes.
            </p>

            <Link
              href="/library"
              className="mt-2 w-fit font-sans text-sm font-semibold text-amber hover:underline"
            >
              ← Browse all Civic Library documents
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
