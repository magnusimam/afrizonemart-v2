import { apiFetchAuthed } from './client';
import { useAuthStore } from '@/stores/authStore';
import type { AuthUser } from './auth';
import type { PIQStatus } from '@/components/supplier/piq/PIQStatusBadge';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Upload a Stage-8 listing photo (multipart). Supplier-scoped endpoint — no
 * uploads.write capability needed. Refreshes once on 401 like apiFetchAuthed.
 */
export async function uploadListingPhoto(file: File, retryOn401 = true): Promise<{ url: string }> {
  const token = useAuthStore.getState().accessToken;
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/api/suppliers/me/listing-photo`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (res.status === 401 && retryOn401) {
    const nt = await useAuthStore.getState().refresh();
    if (nt) return uploadListingPhoto(file, false);
  }
  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch { /* not JSON */ }
    throw new Error(msg);
  }
  return (await res.json()) as { url: string };
}

export interface UploadedDocument {
  url: string;
  key: string;
  contentType: string;
  size: number;
  originalName?: string;
}

/**
 * Upload a supporting document for a journey form — business licence,
 * certification, bank letter, product photo. Accepts images and PDFs
 * (compliance paperwork is usually a PDF), unlike `uploadListingPhoto`.
 */
export async function uploadSupplierDocument(file: File, retryOn401 = true): Promise<UploadedDocument> {
  const token = useAuthStore.getState().accessToken;
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/api/suppliers/me/document`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (res.status === 401 && retryOn401) {
    const nt = await useAuthStore.getState().refresh();
    if (nt) return uploadSupplierDocument(file, false);
  }
  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch { /* not JSON */ }
    throw new Error(msg);
  }
  return (await res.json()) as UploadedDocument;
}

/**
 * Supplier portal API client. Talks to the Express API's `/api/suppliers/*`
 * routes via the token-aware `apiFetchAuthed` (bearer + 401-refresh).
 *
 * Identity model: a supplier is a normal AZM account that has a
 * SupplierProfile. `getSupplierMe` is the access check — it resolves with
 * the profile, or throws `HttpApiError` 404 when the account isn't a
 * supplier yet (the gate + login page branch on that).
 */

export interface SupplierProfile {
  id: string;
  companyName: string;
  contactName: string;
  phone: string | null;
  country: string;
  region: string | null;
  category: string;
  currentStage: number;
  status: string;
  legalName: string | null;
  regNumber: string | null;
  taxId: string | null;
  yearEstablished: number | null;
  employees: number | null;
  factoryType: string | null;
  factoryAddress: string | null;
  businessLicenseUrl: string | null;
  createdAt: string;
}

export interface ApplyInput {
  /// Account fields — omit when already signed in (the API uses the
  /// authenticated user); required for a brand-new maker.
  email?: string;
  password?: string;
  name?: string;
  /// Supplier profile (Expression of Interest basics).
  companyName: string;
  contactName: string;
  phone?: string;
  country: string;
  region?: string;
  category: string;
}

export interface ApplyResponse {
  supplier: SupplierProfile;
  /// Present only when a NEW account was created — sign the user in with these.
  user?: AuthUser;
  accessToken?: string;
}

/** POST /api/suppliers/apply — combined register + apply. */
export function applySupplier(body: ApplyInput): Promise<ApplyResponse> {
  return apiFetchAuthed<ApplyResponse>('/api/suppliers/apply', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** GET /api/suppliers/me — profile + the portal access check (404 if none). */
export function getSupplierMe(): Promise<SupplierProfile> {
  return apiFetchAuthed<SupplierProfile>('/api/suppliers/me');
}

/**
 * What a supplier may change unassisted. Identity and compliance fields
 * (legal name, registration number, tax ID, country, category, factory
 * address, licence) go through a reviewed change request instead — they
 * appear on the signed agreement and define the audit scope. Bank details
 * are never self-serve. See `updateSupplierBodySchema` in the API.
 */
export type UpdateSupplierInput = Partial<Pick<SupplierProfile, 'contactName' | 'phone'>>;

/** PATCH /api/suppliers/me — update own profile. */
export function updateSupplierMe(body: UpdateSupplierInput): Promise<SupplierProfile> {
  return apiFetchAuthed<SupplierProfile>('/api/suppliers/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface SupplierPIQ {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  status: PIQStatus;
  completion: number;
  createdAt: string;
}

/** GET /api/suppliers/me/piqs — this supplier's products. */
export function getSupplierPIQs(): Promise<SupplierPIQ[]> {
  return apiFetchAuthed<{ items: SupplierPIQ[] }>('/api/suppliers/me/piqs').then(
    (r) => r.items,
  );
}

export interface SupplierPIQDetail extends SupplierPIQ {
  answers: Record<string, unknown>;
  reviewSummary: string | null;
  feedback: Record<string, string> | null;
}

/** GET /api/suppliers/me/piqs/:id — one product with its answers. */
export function getSupplierPIQ(id: string): Promise<SupplierPIQDetail> {
  return apiFetchAuthed<SupplierPIQDetail>(
    `/api/suppliers/me/piqs/${encodeURIComponent(id)}`,
  );
}

/** POST /api/suppliers/me/piqs — create a new product PIQ. */
export function createSupplierPIQ(body: { name: string; category?: string }): Promise<SupplierPIQ> {
  return apiFetchAuthed<SupplierPIQ>('/api/suppliers/me/piqs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** PUT /api/suppliers/me/piqs/:id — autosave answers / completion / name. */
export function updateSupplierPIQ(
  id: string,
  body: { answers?: Record<string, unknown>; completion?: number; name?: string; category?: string },
): Promise<SupplierPIQ> {
  return apiFetchAuthed<SupplierPIQ>(`/api/suppliers/me/piqs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** POST /api/suppliers/me/piqs/:id/submit — send for review. */
export function submitSupplierPIQ(id: string): Promise<SupplierPIQ> {
  return apiFetchAuthed<SupplierPIQ>(`/api/suppliers/me/piqs/${encodeURIComponent(id)}/submit`, {
    method: 'POST',
  });
}

/** GET /api/suppliers/me/stages/:stage — saved answers for a journey form. */
export function getStageAnswers(stage: number): Promise<Record<string, unknown>> {
  return apiFetchAuthed<{ answers: Record<string, unknown> }>(
    `/api/suppliers/me/stages/${stage}`,
  ).then((r) => r.answers);
}

/** PUT /api/suppliers/me/stages/:stage — autosave a journey form. */
export function saveStageAnswers(stage: number, answers: Record<string, unknown>): Promise<{ ok: true }> {
  return apiFetchAuthed(`/api/suppliers/me/stages/${stage}`, {
    method: 'PUT',
    body: JSON.stringify({ answers }),
  });
}

/** POST /api/suppliers/me/stages/:stage/complete — save + advance the journey. */
export function completeStage(stage: number, answers: Record<string, unknown>): Promise<SupplierProfile> {
  return apiFetchAuthed<SupplierProfile>(`/api/suppliers/me/stages/${stage}/complete`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export interface SupplierProductionBooking {
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  location: string | null;
  contactName: string | null;
  contactPhone: string | null;
  productList: string | null;
  notes: string | null;
  completedAt: string | null;
}

/** GET /api/suppliers/me/production — the Take50 shoot, or null if unbooked. */
export function getSupplierProductionBooking(): Promise<SupplierProductionBooking | null> {
  return apiFetchAuthed<{ booking: SupplierProductionBooking | null }>(
    '/api/suppliers/me/production',
  ).then((r) => r.booking);
}

export interface SupplierVisit {
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  preferredDate: string | null;
  address: string | null;
  confirmedDate: string | null;
  confirmedWindow: string | null;
  leadName: string | null;
  leadPhone: string | null;
  notes: string | null;
}

/** GET /api/suppliers/me/visit — the facility visit, or null if none. */
export function getSupplierVisit(): Promise<SupplierVisit | null> {
  return apiFetchAuthed<{ visit: SupplierVisit | null }>('/api/suppliers/me/visit').then(
    (r) => r.visit,
  );
}

/** POST /api/suppliers/me/visit/request — propose a visit date. */
export function requestSupplierVisit(body: {
  preferredDate: string;
  address?: string;
}): Promise<SupplierVisit> {
  return apiFetchAuthed<SupplierVisit>('/api/suppliers/me/visit/request', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface AuditTemplateCheckpoint { id: string; label: string; requirement: string; evidence: string }
export interface AuditTemplateSection { title: string; checkpoints: AuditTemplateCheckpoint[] }

export interface SupplierAuditReport {
  status: 'COMPLETED';
  category: string | null;
  categoryName: string | null;
  outcome: 'APPROVED' | 'PROVISIONAL' | 'REJECTED' | null;
  indicativeScore: number | null;
  counts: Record<string, number> | null;
  summary: string | null;
  recommendations: string | null;
  conductedAt: string | null;
  /**
   * Lead auditor's signature and release date. The endpoint only returns an
   * audit at all once it is authorised, so `approvedAt` is always present here.
   */
  signedBy: string | null;
  approvedAt: string;
  responses: Record<string, { rating?: string; findings?: string }>;
  capa: { ref?: string; nonConformity?: string; rootCause?: string; action?: string; owner?: string; deadline?: string; status?: string }[];
  template: { name: string; code: string; sections: AuditTemplateSection[] } | null;
}

/** GET /api/suppliers/me/audit — the audit report, or null until completed. */
export function getSupplierAudit(): Promise<SupplierAuditReport | null> {
  return apiFetchAuthed<{ audit: SupplierAuditReport | null }>('/api/suppliers/me/audit').then(
    (r) => r.audit,
  );
}

// ── Orientation (evergreen "live" webinar) ──────────────────────────
export interface OrientationOwnComment {
  id: string;
  body: string;
  atSeconds: number | null;
  isQuestion: boolean;
  answeredAt: string | null;
  createdAt: string;
}

export interface OrientationConfig {
  videoUrl: string;
  liveHourUtc: number;
  joinWindowMins: number;
  myComments: OrientationOwnComment[];
}

export function getOrientation(): Promise<OrientationConfig> {
  return apiFetchAuthed<OrientationConfig>('/api/suppliers/me/orientation');
}

export function postOrientationComment(body: {
  body: string;
  atSeconds?: number;
}): Promise<OrientationOwnComment> {
  return apiFetchAuthed<OrientationOwnComment>('/api/suppliers/me/orientation/comments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── PIQ review call (Stage 5, Step 1) ───────────────────────────────
export interface ReviewCall {
  status: 'PENDING' | 'SCHEDULED' | 'RESCHEDULE_REQUESTED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string | null;
  meetingMode: string | null;
  meetingLink: string | null;
  notes: string | null;
  proposedAt: string | null;
  rescheduleCount: number;
  canReschedule: boolean;
  rescheduleCutoffHours: number;
  calendar: { googleUrl: string; ics: string } | null;
}

export function getReviewCall(): Promise<ReviewCall | null> {
  return apiFetchAuthed<{ call: ReviewCall | null }>('/api/suppliers/me/review-call').then(
    (r) => r.call,
  );
}

export function rescheduleReviewCall(body: { proposedAt: string }): Promise<ReviewCall> {
  return apiFetchAuthed<ReviewCall>('/api/suppliers/me/review-call/reschedule', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Stage 9/10 — Purchase Orders + performance ──────────────────────
export interface POItem { product?: string; qty?: number; unit?: string; unitPrice?: number }
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'FULFILLED' | 'CANCELLED';
  items: POItem[];
  currency: string;
  totalAmount: number;
  dueDate: string | null;
  notes: string | null;
  acknowledgedAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
}

export function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return apiFetchAuthed<{ items: PurchaseOrder[] }>('/api/suppliers/me/purchase-orders').then((r) => r.items);
}

export function acknowledgePurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetchAuthed<PurchaseOrder>(`/api/suppliers/me/purchase-orders/${encodeURIComponent(id)}/acknowledge`, { method: 'POST' });
}

export function fulfillPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetchAuthed<PurchaseOrder>(`/api/suppliers/me/purchase-orders/${encodeURIComponent(id)}/fulfill`, { method: 'POST' });
}

export interface SupplierPerformance {
  currentStage: number;
  status: string;
  memberSince: string;
  products: number;
  listingLive: boolean;
  audit: { outcome: string | null; score: number | null } | null;
  orders: { total: number; acknowledged: number; fulfilled: number; valueFulfilled: number };
}

export function getPerformance(): Promise<SupplierPerformance> {
  return apiFetchAuthed<SupplierPerformance>('/api/suppliers/me/performance');
}
