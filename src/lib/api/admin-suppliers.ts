import { apiFetchAuthed } from './client';

/** Admin supplier-review client (gated by `suppliers.review`). */

export interface AdminQueuePIQ {
  id: string;
  name: string;
  status: string;
  completion: number;
  company: string;
  email: string;
  country: string;
  updatedAt: string;
}

export interface AdminPIQDetail {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  status: string;
  completion: number;
  answers: Record<string, unknown>;
  reviewSummary: string | null;
  feedback: Record<string, string> | null;
  company: string;
  contact: string;
  email: string;
  supplierId: string;
  updatedAt: string;
}

export function getSupplierQueue(): Promise<AdminQueuePIQ[]> {
  return apiFetchAuthed<{ items: AdminQueuePIQ[] }>('/api/admin/suppliers/queue').then(
    (r) => r.items,
  );
}

export interface AdminSupplier {
  id: string;
  company: string;
  contact: string;
  email: string;
  country: string;
  category: string;
  currentStage: number;
  status: string;
  products: number;
  source: string | null;
  createdAt: string;
}

export function getAllSuppliers(): Promise<AdminSupplier[]> {
  return apiFetchAuthed<{ items: AdminSupplier[] }>('/api/admin/suppliers').then((r) => r.items);
}

export function updateSupplierAdmin(
  id: string,
  body: { currentStage?: number; status?: string },
): Promise<{ id: string; currentStage: number; status: string }> {
  return apiFetchAuthed(`/api/admin/suppliers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ── Facility visits (suppliers.visits) ──────────────────────────────
export interface AdminVisit {
  id: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  preferredDate: string | null;
  address: string | null;
  contactPhone: string | null;
  confirmedDate: string | null;
  confirmedWindow: string | null;
  leadName: string | null;
  leadPhone: string | null;
  notes: string | null;
  company: string;
  email: string;
  country: string;
}

export function getFacilityVisits(): Promise<AdminVisit[]> {
  return apiFetchAuthed<{ items: AdminVisit[] }>('/api/admin/facility-visits').then((r) => r.items);
}

export function confirmFacilityVisit(
  id: string,
  body: { confirmedDate: string; confirmedWindow?: string; leadName: string; leadPhone?: string; notes?: string },
): Promise<{ id: string; status: string }> {
  return apiFetchAuthed(`/api/admin/facility-visits/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function completeFacilityVisit(id: string): Promise<{ id: string; status: string }> {
  return apiFetchAuthed(`/api/admin/facility-visits/${encodeURIComponent(id)}/complete`, {
    method: 'POST',
  });
}

// ── Product-commodity audits (suppliers.audit) ──────────────────────
export type AuditRating = 'C' | 'M' | 'Mi' | 'O' | 'Cpt' | 'NA';

export interface AuditCheckpoint { id: string; label: string; requirement: string; evidence: string }
export interface AuditSection { title: string; checkpoints: AuditCheckpoint[] }
export interface AuditTemplate {
  category: string;
  name: string;
  code: string;
  sections: AuditSection[];
  preVisitDocs: string[];
  categoryChecks: { title: string; items: string[] }[];
  standards: { name: string; description: string }[];
}

export interface AuditCounts {
  critical: number; major: number; minor: number; observation: number; compliant: number; na: number;
}
export interface CapaRow {
  ref?: string; nonConformity?: string; rootCause?: string; action?: string; owner?: string; deadline?: string; status?: string;
}

export interface AuditQueueRow {
  supplierId: string;
  company: string;
  contact: string;
  email: string;
  country: string;
  currentStage: number;
  products: number;
  visitStatus: string | null;
  auditStatus: 'DRAFT' | 'COMPLETED' | null;
  auditCategory: string | null;
  outcome: string | null;
  indicativeScore: number | null;
  conductedAt: string | null;
}

export interface AdminAudit {
  supplierId: string;
  status: 'DRAFT' | 'COMPLETED' | null;
  category: string | null;
  metadata: Record<string, string>;
  preVisitDocs: Record<string, boolean>;
  responses: Record<string, { rating?: AuditRating; findings?: string }>;
  capa: CapaRow[];
  indicativeScore: number | null;
  counts: AuditCounts | null;
  outcome: string | null;
  summary: string | null;
  recommendations: string | null;
  auditorName: string | null;
  conductedAt: string | null;
}

export interface AdminAuditDetail {
  company: string;
  contact: string;
  email: string;
  country: string;
  category: string;
  currentStage: number;
  audit: AdminAudit;
}

export interface AuditFormPayload {
  category?: string;
  metadata?: Record<string, string>;
  preVisitDocs?: Record<string, boolean>;
  responses?: Record<string, { rating?: AuditRating; findings?: string }>;
  capa?: CapaRow[];
  summary?: string;
  recommendations?: string;
  auditorName?: string;
}

export function getAuditQueue(): Promise<AuditQueueRow[]> {
  return apiFetchAuthed<{ items: AuditQueueRow[] }>('/api/admin/supplier-audits').then((r) => r.items);
}

export function getAuditTemplate(category: string): Promise<AuditTemplate> {
  return apiFetchAuthed<AuditTemplate>(`/api/admin/supplier-audits/templates/${encodeURIComponent(category)}`);
}

export function getAdminAudit(supplierId: string): Promise<AdminAuditDetail> {
  return apiFetchAuthed<AdminAuditDetail>(`/api/admin/supplier-audits/${encodeURIComponent(supplierId)}`);
}

export function saveAdminAudit(supplierId: string, body: AuditFormPayload): Promise<AdminAudit> {
  return apiFetchAuthed(`/api/admin/supplier-audits/${encodeURIComponent(supplierId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function completeAdminAudit(supplierId: string, body: AuditFormPayload): Promise<AdminAudit> {
  return apiFetchAuthed(`/api/admin/supplier-audits/${encodeURIComponent(supplierId)}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Orientation & review calls (suppliers.review) ───────────────────
export interface AdminOrientationComment {
  id: string;
  body: string;
  atSeconds: number | null;
  isQuestion: boolean;
  answeredAt: string | null;
  adminNote: string | null;
  createdAt: string;
  company: string;
  contact: string;
  email: string;
}

export function getOrientationComments(onlyQuestions?: boolean): Promise<AdminOrientationComment[]> {
  const q = onlyQuestions ? '?questions=1' : '';
  return apiFetchAuthed<{ items: AdminOrientationComment[] }>(`/api/admin/orientation/comments${q}`).then((r) => r.items);
}

export function updateOrientationComment(
  id: string,
  body: { isQuestion?: boolean; answered?: boolean; adminNote?: string },
): Promise<{ id: string; isQuestion: boolean; answeredAt: string | null }> {
  return apiFetchAuthed(`/api/admin/orientation/comments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface AdminReviewCallRow {
  supplierId: string;
  company: string;
  contact: string;
  email: string;
  country: string;
  currentStage: number;
  call: {
    status: string;
    scheduledAt: string | null;
    meetingMode: string | null;
    meetingLink: string | null;
    notes: string | null;
    proposedAt: string | null;
    rescheduleCount: number;
  } | null;
}

export function getReviewCallsAdmin(): Promise<AdminReviewCallRow[]> {
  return apiFetchAuthed<{ items: AdminReviewCallRow[] }>('/api/admin/orientation/review-calls').then((r) => r.items);
}

export function scheduleReviewCallAdmin(
  supplierId: string,
  body: { scheduledAt: string; meetingMode?: string; meetingLink?: string; notes?: string },
): Promise<{ status: string }> {
  return apiFetchAuthed(`/api/admin/orientation/review-calls/${encodeURIComponent(supplierId)}/schedule`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Activation & Trade (suppliers.trade) ────────────────────────────
export interface AdminListing {
  supplierId: string;
  company: string;
  email: string;
  country: string;
  category: string;
  photos: Record<string, string>;
  submittedAt: string;
  publishedAt: string | null;
}

export function getListings(): Promise<AdminListing[]> {
  return apiFetchAuthed<{ items: AdminListing[] }>('/api/admin/trade/listings').then((r) => r.items);
}

export function publishListing(supplierId: string): Promise<{ supplierId: string; publishedAt: string }> {
  return apiFetchAuthed(`/api/admin/trade/listings/${encodeURIComponent(supplierId)}/publish`, { method: 'POST' });
}

export interface AdminPOItem { product?: string; qty?: number; unit?: string; unitPrice?: number }
export interface AdminPO {
  id: string;
  poNumber: string;
  status: string;
  items: AdminPOItem[];
  currency: string;
  totalAmount: number;
  dueDate: string | null;
  notes: string | null;
  acknowledgedAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  company: string;
  email: string;
  supplierId: string;
}

export function getAdminPurchaseOrders(): Promise<AdminPO[]> {
  return apiFetchAuthed<{ items: AdminPO[] }>('/api/admin/trade/purchase-orders').then((r) => r.items);
}

export function issuePurchaseOrder(
  supplierId: string,
  body: { items: AdminPOItem[]; currency?: string; dueDate?: string; notes?: string },
): Promise<AdminPO> {
  return apiFetchAuthed(`/api/admin/trade/purchase-orders/${encodeURIComponent(supplierId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function cancelPurchaseOrder(id: string): Promise<{ status: string }> {
  return apiFetchAuthed(`/api/admin/trade/purchase-orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
}

export function getAdminPIQ(id: string): Promise<AdminPIQDetail> {
  return apiFetchAuthed<AdminPIQDetail>(`/api/admin/suppliers/piqs/${encodeURIComponent(id)}`);
}

export function approveAdminPIQ(id: string): Promise<{ id: string; status: string }> {
  return apiFetchAuthed(`/api/admin/suppliers/piqs/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
  });
}

export function requestAdminChanges(
  id: string,
  body: { summary: string; feedback: Record<string, string> },
): Promise<{ id: string; status: string }> {
  return apiFetchAuthed(`/api/admin/suppliers/piqs/${encodeURIComponent(id)}/request-changes`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
