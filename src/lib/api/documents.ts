const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type DocumentType =
  | 'CONSTITUTION'
  | 'ACT'
  | 'BILL'
  | 'POLICY'
  | 'REGULATION'
  | 'TREATY'
  | 'OTHER';

export interface ApiLibraryDocument {
  id: string;
  slug: string;
  title: string;
  country: string;
  docType: DocumentType;
  customDocType: string | null;
  description: string | null;
  issuingBody: string | null;
  officialSourceUrl: string | null;
  publishedDate: string | null;
  coverImageUrl: string | null;
  fileUrl: string;
  fileSizeBytes: number | null;
  downloadCount: number;
  createdAt: string;
}

export interface ApiLibraryDocumentList {
  items: ApiLibraryDocument[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ListLibraryDocsParams {
  page?: number;
  limit?: number;
  country?: string;
  docType?: DocumentType;
  q?: string;
}

function toQueryString(params: ListLibraryDocsParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.country) sp.set('country', params.country);
  if (params.docType) sp.set('docType', params.docType);
  if (params.q) sp.set('q', params.q);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/// Same resilience posture as `fetchProducts` — cached read via
/// Next.js' Data Cache so a brief Railway outage doesn't blank the
/// page. Civic Library content changes rarely (new documents are
/// reviewed/published by hand), so a longer window than the product
/// catalog's 60s is fine.
const LIBRARY_REVALIDATE_S = 300;

export async function fetchLibraryDocs(
  params: ListLibraryDocsParams = {},
): Promise<ApiLibraryDocumentList> {
  const res = await fetch(`${API_BASE}/api/documents${toQueryString(params)}`, {
    next: { revalidate: LIBRARY_REVALIDATE_S },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
  return (await res.json()) as ApiLibraryDocumentList;
}

export async function fetchLibraryDoc(slug: string): Promise<ApiLibraryDocument> {
  const res = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(slug)}`, {
    next: { revalidate: LIBRARY_REVALIDATE_S },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to load document (${res.status})`);
  return (await res.json()) as ApiLibraryDocument;
}

/// Fire-and-forget download counter. Deliberately doesn't block or
/// gate the actual download — the <a href> already points straight
/// at the R2 file. Never surfaces an error to the user; a failed
/// count-bump shouldn't stop someone from getting their document.
export function trackLibraryDownload(id: string): void {
  void fetch(`${API_BASE}/api/documents/${encodeURIComponent(id)}/track-download`, {
    method: 'POST',
    keepalive: true,
  }).catch(() => {
    /* best-effort — see comment above */
  });
}
