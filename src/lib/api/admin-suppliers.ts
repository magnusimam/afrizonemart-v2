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
  /**
   * Lead-auditor sign-off. `approvedAt === null` on a COMPLETED audit means it
   * is finished but not yet released — the supplier has not been emailed.
   */
  signedBy: string | null;
  approvedAt: string | null;
  /** The protocol this audit was carried out against, e.g. AFZ-QA-FPS-001. */
  protocolCode: string | null;
  protocolVersion: string | null;
  /**
   * The checklist frozen at issue — which checkpoints applied to this product
   * and why. Render from this, never from a re-fetched category template:
   * `responses` is keyed by checkpoint ref (`B.4`), while legacy templates key
   * by generated id (`A_s0_1`), so a template render shows every checkpoint as
   * unrated. Null on audits predating checklist resolution.
   */
  checklistSnapshot: ResolvedChecklist | null;
}

/** The resolved checklist as stored on the audit. */
export interface ResolvedChecklist {
  protocolCode: string;
  protocolName: string;
  protocolVersion: string;
  sections: { letter: string; title: string }[];
  items: ChecklistItem[];
  excluded: { ref: string; excludedBecause: string }[];
  resolvedAt: string;
}

export interface ChecklistItem {
  ref: string;
  section: string;
  order: number;
  text: string;
  guidance?: string;
  allowedRatings: AuditRating[];
  defaultIfAbsent: AuditRating;
  severityClass: 'FIXED_CRITICAL' | 'CONDITIONAL' | 'BY_DEGREE';
  /** Plain-English reason this checkpoint is on the checklist. */
  includedBecause: string;
  defaultOwnerDept: string;
  defaultClosureText: string;
  standards?: string[];
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

/**
 * The human review gate. Completing an audit computes the score; authorising it
 * is what releases the report to the supplier and sends their email. `signedBy`
 * is the lead auditor's typed full name, which the report carries as signature.
 */
export function authoriseAdminAudit(supplierId: string, signedBy: string): Promise<AdminAudit> {
  return apiFetchAuthed(`/api/admin/supplier-audits/${encodeURIComponent(supplierId)}/authorise`, {
    method: 'POST',
    body: JSON.stringify({ signedBy }),
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

// ── Take50 production shoots ────────────────────────────────────────

export interface ProductionRow {
  supplierId: string;
  company: string;
  contact: string;
  email: string;
  currentStage: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | null;
  scheduledAt: string | null;
  location: string | null;
  contactName: string | null;
  contactPhone: string | null;
  productList: string | null;
  notes: string | null;
  completedAt: string | null;
}

export interface BookProductionBody {
  scheduledAt: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  productList?: string;
  notes?: string;
}

export function getProductionQueue(): Promise<ProductionRow[]> {
  return apiFetchAuthed<{ items: ProductionRow[] }>('/api/admin/supplier-production').then((r) => r.items);
}

/** Booking (or rebooking) emails the supplier their call sheet. */
export function bookProduction(supplierId: string, body: BookProductionBody): Promise<ProductionRow> {
  return apiFetchAuthed(`/api/admin/supplier-production/${encodeURIComponent(supplierId)}/book`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function completeProduction(supplierId: string): Promise<ProductionRow> {
  return apiFetchAuthed(`/api/admin/supplier-production/${encodeURIComponent(supplierId)}/complete`, {
    method: 'POST',
  });
}

export function cancelProduction(supplierId: string): Promise<ProductionRow> {
  return apiFetchAuthed(`/api/admin/supplier-production/${encodeURIComponent(supplierId)}/cancel`, {
    method: 'POST',
  });
}

// ── On-site facility visit form (suppliers.visits) ──────────────────

export interface VisitFormCheckGroup { title: string; items: string[] }

export interface VisitForm {
  id: string;
  company: string;
  email: string;
  supplierId: string;
  status: string;
  confirmedDate: string | null;
  /** 'A'..'F' — the supplier's product category, which selects the questions. */
  category: string | null;
  categoryName: string | null;
  preVisitDocs: string[];
  categoryChecks: VisitFormCheckGroup[];
  docsSighted: Record<string, boolean>;
  observations: Record<string, { seen?: boolean; note?: string }>;
  visitSummary: string;
  formSubmittedAt: string | null;
}

export interface VisitFormPayload {
  formCategory?: string;
  docsSighted?: Record<string, boolean>;
  observations?: Record<string, { seen?: boolean; note?: string }>;
  visitSummary?: string;
  /** Submitting seeds the product audit with the category + sighted docs. */
  submit?: boolean;
}

export function getVisitForm(id: string): Promise<VisitForm> {
  return apiFetchAuthed<VisitForm>(`/api/admin/facility-visits/${encodeURIComponent(id)}/form`);
}

export function saveVisitForm(id: string, body: VisitFormPayload): Promise<VisitForm> {
  return apiFetchAuthed(`/api/admin/facility-visits/${encodeURIComponent(id)}/form`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
