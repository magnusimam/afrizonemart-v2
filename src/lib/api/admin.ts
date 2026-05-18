import { apiFetchAuthed } from './client';
import type { OrderStatus, PaymentMethodId } from './orders';
import type { ApiCategory, ApiPagination, ApiProduct, ApiReview } from './types';

// ----- Products -----

export interface AdminProductListItem extends ApiProduct {
  _count?: { reviews: number };
}

export interface AdminProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  /// 2-letter ISO country code; matches `Product.origin` server-side.
  origin?: string;
  inStock?: boolean;
  sort?: 'newest' | 'oldest' | 'name-asc' | 'price-desc';
}

export interface AdminProductList {
  items: AdminProductListItem[];
  pagination: ApiPagination;
}

export interface PlacementInput {
  placement: string;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  countries?: string[];
}

export interface PlacementDef {
  key: string;
  label: string;
  description: string;
  group: 'pages' | 'homepage_shelves' | 'curated_lists' | 'cms_pages';
}

export interface AdminProductInput {
  slug: string;
  name: string;
  brand?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  ingredients?: string | null;
  price: number;
  comparePrice?: number | null;
  origin?: string | null;
  /// Phase 11 — shipping weight (kg). Drives the shipping quote.
  weightKg?: number | null;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  attributes: Record<string, unknown>;
  categorySlug?: string | null;
  placements?: PlacementInput[];
}

export function adminListPlacementCatalog(): Promise<{
  groups: Record<string, string>;
  items: PlacementDef[];
}> {
  return apiFetchAuthed('/api/admin/placements');
}

function toQs(params: AdminProductListParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.q) sp.set('q', params.q);
  if (params.category) sp.set('category', params.category);
  if (params.origin) sp.set('origin', params.origin);
  if (params.inStock !== undefined) sp.set('inStock', String(params.inStock));
  if (params.sort) sp.set('sort', params.sort);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function adminListProducts(
  params: AdminProductListParams = {},
): Promise<AdminProductList> {
  return apiFetchAuthed<AdminProductList>(`/api/admin/products${toQs(params)}`);
}

export function adminGetProduct(id: string): Promise<AdminProductListItem> {
  return apiFetchAuthed<AdminProductListItem>(`/api/admin/products/${id}`);
}

export function adminCreateProduct(input: AdminProductInput): Promise<AdminProductListItem> {
  return apiFetchAuthed<AdminProductListItem>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateProduct(
  id: string,
  input: Partial<AdminProductInput>,
): Promise<AdminProductListItem> {
  return apiFetchAuthed<AdminProductListItem>(`/api/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteProduct(id: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export type PriceChangeSource =
  | 'INLINE'
  | 'BULK'
  | 'CSV'
  | 'SCHEDULED'
  | 'MANUAL'
  | 'REVERT';

export interface ApplyPriceChangeInput {
  price?: number;
  comparePrice?: number | null;
  reason?: string;
}

export interface ApplyPriceChangeResult {
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldComparePrice: number | null;
  newComparePrice: number | null;
  discountPercent: number | null;
  noop: boolean;
}

/// Inline price edit — used by the editable price cell on
/// /admin/products. Returns `noop: true` if nothing actually
/// changed so the UI can skip the success toast.
export function adminUpdateProductPrice(
  id: string,
  input: ApplyPriceChangeInput,
): Promise<ApplyPriceChangeResult> {
  return apiFetchAuthed<ApplyPriceChangeResult>(
    `/api/admin/products/${id}/price`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export interface PriceHistoryEntry {
  id: string;
  oldPrice: number | null;
  newPrice: number;
  oldComparePrice: number | null;
  newComparePrice: number | null;
  source: PriceChangeSource;
  reason: string | null;
  createdAt: string;
  changedBy: { id: string; name: string | null; email: string } | null;
}

export function adminListProductPriceHistory(
  id: string,
  limit = 50,
): Promise<{ items: PriceHistoryEntry[] }> {
  return apiFetchAuthed<{ items: PriceHistoryEntry[] }>(
    `/api/admin/products/${id}/price-history?limit=${limit}`,
  );
}

export interface PriceBulkRowResult {
  row: number;
  slug?: string;
  status: 'updated' | 'unchanged' | 'not-found' | 'error';
  message?: string;
  oldPrice?: number;
  newPrice?: number;
  oldComparePrice?: number | null;
  newComparePrice?: number | null;
}

export interface PriceBulkUploadResult {
  total: number;
  updated: number;
  unchanged: number;
  notFound: number;
  errors: number;
  results: PriceBulkRowResult[];
}

/// Upload a CSV of slug,price[,comparePrice,reason] to bulk-update
/// existing products' prices. Each row routes through
/// applyPriceChange(source: CSV) so the audit log captures it.
export function adminBulkUploadPrices(
  csv: string,
): Promise<PriceBulkUploadResult> {
  return apiFetchAuthed<PriceBulkUploadResult>(
    '/api/admin/products/bulk-price-upload',
    {
      method: 'POST',
      body: JSON.stringify({ csv }),
    },
  );
}

export type RepriceMode = 'set' | 'percent-up' | 'percent-down';
export type RepriceApplyTo = 'price' | 'compare' | 'both';
export interface RepriceAction {
  kind: 'reprice';
  mode: RepriceMode;
  /// For `set`: target value in NGN. For percent modes: the
  /// percent value (e.g. 5 = +5%).
  value: number;
  /// Only meaningful for `set` mode. Percent modes always operate
  /// on price.
  applyTo?: RepriceApplyTo;
  reason?: string;
}

export type AdminBulkAction =
  | { kind: 'delete' }
  | { kind: 'set-in-stock'; value: boolean }
  | { kind: 'set-category'; categorySlug: string | null }
  | RepriceAction;

export interface RepricePreviewItem {
  id: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  oldComparePrice: number | null;
  newComparePrice: number | null;
  noop: boolean;
}

export function adminBulkRepricePreview(
  ids: string[],
  action: RepriceAction,
): Promise<{ items: RepricePreviewItem[] }> {
  return apiFetchAuthed<{ items: RepricePreviewItem[] }>(
    '/api/admin/products/bulk/reprice-preview',
    {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    },
  );
}

export interface AdminBulkActionResult {
  affected: number;
  /** IDs the server refused (e.g. delete of a product with order history). */
  skipped: Array<{ id: string; reason: string }>;
}

export function adminBulkProductAction(
  ids: string[],
  action: AdminBulkAction,
): Promise<AdminBulkActionResult> {
  return apiFetchAuthed<AdminBulkActionResult>('/api/admin/products/bulk', {
    method: 'POST',
    body: JSON.stringify({ ids, action }),
  });
}

export interface BulkUploadResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: Array<{
    row: number;
    slug?: string;
    status: 'created' | 'updated' | 'skipped' | 'error';
    message?: string;
  }>;
  /** CSV headers the importer didn't recognise — their values were
   *  saved into each product's `attributes.customAttributes`. Surfaced
   *  in the dialog so admins can promote them to proper custom fields. */
  unknownColumns?: string[];
}

export function adminBulkUploadProducts(csv: string): Promise<BulkUploadResult> {
  return apiFetchAuthed<BulkUploadResult>('/api/admin/products/bulk-upload', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  });
}

// ----- Brands (per-brand logo management) -----

export interface BrandSummary {
  brand: string;
  productCount: number;
  brandImageUrl: string | null;
  brandImageAlt: string | null;
  productsWithLogo: number;
}

export function adminListBrands(): Promise<{ items: BrandSummary[] }> {
  return apiFetchAuthed<{ items: BrandSummary[] }>('/api/admin/brands');
}

export function adminSetBrandLogo(input: {
  brand: string;
  brandImageUrl: string;
  brandImageAlt?: string | null;
}): Promise<{ affected: number }> {
  return apiFetchAuthed<{ affected: number }>('/api/admin/brands/set-logo', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ----- Categories -----

export interface AdminCategory extends ApiCategory {
  _count?: { products: number };
}

export interface AdminCategoryInput {
  slug: string;
  name: string;
  image?: string | null;
  parentId?: string | null;
}

export function adminListCategories(): Promise<{ items: AdminCategory[] }> {
  return apiFetchAuthed<{ items: AdminCategory[] }>('/api/admin/categories');
}

export function adminCreateCategory(input: AdminCategoryInput): Promise<AdminCategory> {
  return apiFetchAuthed<AdminCategory>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateCategory(
  id: string,
  input: Partial<AdminCategoryInput>,
): Promise<AdminCategory> {
  return apiFetchAuthed<AdminCategory>(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteCategory(id: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/categories/${id}`, { method: 'DELETE' });
}

// ----- Reviews -----

export interface AdminReview extends ApiReview {
  product?: { id: string; slug: string; name: string };
}

export interface AdminReviewListParams {
  page?: number;
  limit?: number;
  productId?: string;
  rating?: number;
  verified?: boolean;
}

export interface AdminReviewList {
  items: AdminReview[];
  pagination: ApiPagination;
}

export function adminListReviews(
  params: AdminReviewListParams = {},
): Promise<AdminReviewList> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.productId) sp.set('productId', params.productId);
  if (params.rating) sp.set('rating', String(params.rating));
  if (params.verified !== undefined) sp.set('verified', String(params.verified));
  const qs = sp.toString();
  return apiFetchAuthed<AdminReviewList>(`/api/admin/reviews${qs ? `?${qs}` : ''}`);
}

export function adminUpdateReview(
  id: string,
  input: { verified?: boolean; title?: string | null; body?: string; rating?: number },
): Promise<AdminReview> {
  return apiFetchAuthed<AdminReview>(`/api/admin/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteReview(id: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/reviews/${id}`, { method: 'DELETE' });
}

// ----- Admin Orders -----

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  refundedTotal: number;
  currency: string;
  couponCode: string | null;
  couponDiscount: number;
  shippingRateId: string | null;
  paymentMethod: PaymentMethodId;
  shipFullName: string;
  shipCity: string;
  shipCountry: string;
  cancelledAt: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
  _count?: { items: number };
}

export interface AdminOrderDetail extends AdminOrderListItem {
  shipPhone: string;
  shipAddressLine: string;
  paymentRef: string | null;
  items: Array<{
    id: string;
    productId: string;
    productSlug: string;
    productName: string;
    productImage: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  events: AdminOrderEvent[];
  refunds: AdminRefund[];
  user:
    | {
        id: string;
        email: string;
        name: string | null;
        role: string;
        createdAt: string;
      }
    | null;
}

export type AdminOrderEventType =
  | 'STATUS_CHANGED'
  | 'NOTE'
  | 'PAYMENT_RECEIVED'
  | 'SHIPMENT_UPDATED'
  | 'REFUND_RECORDED'
  | 'CANCELLED';

export interface AdminOrderEvent {
  id: string;
  orderId: string;
  type: AdminOrderEventType;
  payload: Record<string, unknown>;
  actorUserId: string | null;
  isCustomerVisible: boolean;
  createdAt: string;
}

export interface AdminRefund {
  id: string;
  orderId: string;
  amount: number;
  reason: string | null;
  status: 'RECORDED' | 'SETTLED' | 'FAILED';
  gatewayRef: string | null;
  createdByUserId: string | null;
  createdAt: string;
}

export interface AdminOrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  q?: string;
  from?: string;
  to?: string;
}

export interface AdminOrderList {
  items: AdminOrderListItem[];
  pagination: ApiPagination;
}

export function adminListOrders(
  params: AdminOrderListParams = {},
): Promise<AdminOrderList> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.status) sp.set('status', params.status);
  if (params.q) sp.set('q', params.q);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  const qs = sp.toString();
  return apiFetchAuthed<AdminOrderList>(`/api/admin/orders${qs ? `?${qs}` : ''}`);
}

export function adminGetOrder(id: string): Promise<AdminOrderDetail> {
  return apiFetchAuthed<AdminOrderDetail>(`/api/admin/orders/${id}`);
}

export function adminUpdateOrderStatus(
  id: string,
  body: { status: OrderStatus; note?: string },
): Promise<AdminOrderDetail> {
  return apiFetchAuthed<AdminOrderDetail>(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function adminAddOrderNote(
  id: string,
  body: { text: string; isCustomerVisible: boolean },
): Promise<AdminOrderEvent> {
  return apiFetchAuthed<AdminOrderEvent>(`/api/admin/orders/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminRecordOrderRefund(
  id: string,
  body: { amount: number; reason?: string },
): Promise<AdminRefund> {
  return apiFetchAuthed<AdminRefund>(`/api/admin/orders/${id}/refunds`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ----- Admin Customers -----

/// Mirrors the prisma UserRole enum 1:1. STAFF was missing here before
/// 2026-05-18 — accounts with role=STAFF still came back from the API,
/// so the RoleBadge styles map blew up when one was rendered.
export type CustomerRole = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'STAFF';

/// Tab toggle on /admin/customers. 'customers' = has placed at least
/// one non-cancelled order; 'users' = account exists, never bought.
export type CustomerSegment = 'customers' | 'users' | 'all';

export interface AdminCustomerListItem {
  id: string;
  email: string;
  name: string | null;
  role: CustomerRole;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface AdminCustomerRecentOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  _count?: { items: number };
}

export interface AdminCustomerDetail extends AdminCustomerListItem {
  recentOrders: AdminCustomerRecentOrder[];
}

export interface AdminCustomerListParams {
  page?: number;
  limit?: number;
  q?: string;
  role?: CustomerRole;
  /// Split between paying customers and accounts-with-no-orders.
  /// Omit (or 'all') to keep the legacy unfiltered behaviour.
  segment?: CustomerSegment;
  sort?: 'newest' | 'oldest' | 'name-asc' | 'spend-desc';
}

export function adminListCustomers(
  params: AdminCustomerListParams = {},
): Promise<{ items: AdminCustomerListItem[]; pagination: ApiPagination }> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.q) sp.set('q', params.q);
  if (params.role) sp.set('role', params.role);
  if (params.segment && params.segment !== 'all') sp.set('segment', params.segment);
  if (params.sort) sp.set('sort', params.sort);
  const qs = sp.toString();
  return apiFetchAuthed(`/api/admin/customers${qs ? `?${qs}` : ''}`);
}

export function adminGetCustomer(id: string): Promise<AdminCustomerDetail> {
  return apiFetchAuthed<AdminCustomerDetail>(`/api/admin/customers/${id}`);
}

export function adminUpdateCustomer(
  id: string,
  body: { name?: string | null; role?: CustomerRole },
): Promise<AdminCustomerListItem> {
  return apiFetchAuthed<AdminCustomerListItem>(`/api/admin/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ----- Admin Staff -----

import type { Capability, StaffRole } from '@/lib/permissions';

export type StaffCreatableRole = Extract<StaffRole, 'SELLER' | 'ADMIN' | 'STAFF'>;

export interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  role: StaffRole;
  jobTitle: string | null;
  /// Per-user permissions (only meaningful when role=STAFF).
  permissions: string[];
  /// Effective capabilities the user has right now (role-default ∪ per-user
  /// for STAFF, full set for ADMIN, role-default for SELLER, none for
  /// CUSTOMER). Surfaced by the API to skip a redundant resolution
  /// step on the client.
  effectivePermissions: string[];
  createdAt: string;
}

export interface PermissionsMatrix {
  capabilities: Array<{ key: Capability; domain: string; label: string }>;
  roles: Array<{
    role: StaffRole;
    description: string;
    capabilities: Capability[];
  }>;
}

export function adminListStaff(): Promise<{ items: StaffMember[] }> {
  return apiFetchAuthed<{ items: StaffMember[] }>('/api/admin/staff');
}

export function adminGetStaff(id: string): Promise<StaffMember> {
  return apiFetchAuthed<StaffMember>(`/api/admin/staff/${id}`);
}

export function adminCreateStaff(input: {
  email: string;
  name?: string;
  jobTitle?: string;
  role: StaffCreatableRole;
  password: string;
  permissions?: Capability[];
}): Promise<StaffMember> {
  return apiFetchAuthed<StaffMember>('/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateStaff(
  id: string,
  input: {
    name?: string;
    role?: StaffCreatableRole;
    jobTitle?: string | null;
    permissions?: Capability[];
    password?: string;
  },
): Promise<StaffMember> {
  return apiFetchAuthed<StaffMember>(`/api/admin/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteStaff(id: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/staff/${id}`, { method: 'DELETE' });
}

export function adminGetPermissions(): Promise<PermissionsMatrix> {
  return apiFetchAuthed<PermissionsMatrix>('/api/admin/staff/permissions');
}

// ----- Admin Coupons -----

export type CouponType = 'PERCENT_CART' | 'FIXED_CART' | 'FREE_SHIPPING';

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  valuePercent: number | null;
  valueAmount: number | null;
  minSubtotal: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponInput {
  code: string;
  description?: string | null;
  type: CouponType;
  valuePercent?: number | null;
  valueAmount?: number | null;
  minSubtotal?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
}

export function adminListCoupons(): Promise<{ items: AdminCoupon[] }> {
  return apiFetchAuthed<{ items: AdminCoupon[] }>('/api/admin/coupons');
}

export function adminCreateCoupon(input: AdminCouponInput): Promise<AdminCoupon> {
  return apiFetchAuthed<AdminCoupon>('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateCoupon(
  id: string,
  input: Partial<AdminCouponInput>,
): Promise<AdminCoupon> {
  return apiFetchAuthed<AdminCoupon>(`/api/admin/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteCoupon(id: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/coupons/${id}`, { method: 'DELETE' });
}

// ----- Admin Shipping -----

export interface AdminShippingRate {
  id: string;
  zoneId: string;
  name: string;
  priceAmount: number;
  freeAboveAmount: number | null;
  /// Phase 11 — null = unbounded.
  minWeightKg: number | null;
  maxWeightKg: number | null;
  /// Phase 11 — ETA range shown to customer.
  etaDaysMin: number;
  etaDaysMax: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface AdminShippingZone {
  id: string;
  name: string;
  countries: string[];
  /// Phase 11 — empty = whole-country zone; non-empty = flagship-city
  /// sub-zone (e.g. ["Lagos"]).
  cities: string[];
  isDefault: boolean;
  sortOrder: number;
  rates: AdminShippingRate[];
}

export interface AdminShippingZoneInput {
  name: string;
  countries: string[];
  cities?: string[];
  isDefault: boolean;
  sortOrder?: number;
}

export interface AdminShippingRateInput {
  name: string;
  priceAmount: number;
  freeAboveAmount?: number | null;
  minWeightKg?: number | null;
  maxWeightKg?: number | null;
  etaDaysMin?: number;
  etaDaysMax?: number;
  isDefault: boolean;
  sortOrder?: number;
}

export function adminListShippingZones(): Promise<{ items: AdminShippingZone[] }> {
  return apiFetchAuthed<{ items: AdminShippingZone[] }>('/api/admin/shipping/zones');
}

export function adminCreateShippingZone(
  input: AdminShippingZoneInput,
): Promise<AdminShippingZone> {
  return apiFetchAuthed<AdminShippingZone>('/api/admin/shipping/zones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateShippingZone(
  id: string,
  input: Partial<AdminShippingZoneInput>,
): Promise<AdminShippingZone> {
  return apiFetchAuthed<AdminShippingZone>(`/api/admin/shipping/zones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteShippingZone(id: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/shipping/zones/${id}`, { method: 'DELETE' });
}

export function adminCreateShippingRate(
  zoneId: string,
  input: AdminShippingRateInput,
): Promise<AdminShippingRate> {
  return apiFetchAuthed<AdminShippingRate>(
    `/api/admin/shipping/zones/${zoneId}/rates`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function adminUpdateShippingRate(
  rateId: string,
  input: Partial<AdminShippingRateInput>,
): Promise<AdminShippingRate> {
  return apiFetchAuthed<AdminShippingRate>(`/api/admin/shipping/rates/${rateId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteShippingRate(rateId: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/shipping/rates/${rateId}`, {
    method: 'DELETE',
  });
}

// ----- Admin Settings -----

export type SettingType = 'string' | 'number' | 'boolean' | 'email' | 'longtext';
export type SettingGroup =
  | 'general'
  | 'inventory'
  | 'shipping'
  | 'orders'
  | 'notifications'
  | 'advanced';

export interface SettingDef {
  key: string;
  label: string;
  description?: string;
  group: SettingGroup;
  type: SettingType;
  defaultValue: string | number | boolean;
}

export interface SettingItem {
  def: SettingDef;
  value: string | number | boolean;
  updatedByUserId: string | null;
  updatedAt: string | null;
}

export function adminGetSettings(): Promise<{ items: SettingItem[] }> {
  return apiFetchAuthed<{ items: SettingItem[] }>('/api/admin/settings');
}

export function adminUpdateSettings(
  patches: Record<string, string | number | boolean>,
): Promise<{ items: SettingItem[] }> {
  return apiFetchAuthed<{ items: SettingItem[] }>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(patches),
  });
}

// ----- Admin Audit Log -----

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  changes: Record<string, unknown>;
  createdAt: string;
}

export interface AdminAuditListParams {
  page?: number;
  limit?: number;
  actorUserId?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
}

export function adminListAudit(
  params: AdminAuditListParams = {},
): Promise<{ items: AuditLogEntry[]; pagination: ApiPagination }> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.actorUserId) sp.set('actorUserId', params.actorUserId);
  if (params.entityType) sp.set('entityType', params.entityType);
  if (params.action) sp.set('action', params.action);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  const qs = sp.toString();
  return apiFetchAuthed(`/api/admin/audit-log${qs ? `?${qs}` : ''}`);
}

// ----- Admin Webhooks -----

export interface AdminWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { deliveries: number };
}

export interface AdminWebhookInput {
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
}

export interface AdminWebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  statusCode: number | null;
  responseBody: string | null;
  attempts: number;
  succeededAt: string | null;
  failedAt: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
}

export function adminListWebhooks(): Promise<{ items: AdminWebhook[] }> {
  return apiFetchAuthed<{ items: AdminWebhook[] }>('/api/admin/webhooks');
}

export function adminCreateWebhook(input: AdminWebhookInput): Promise<AdminWebhook> {
  return apiFetchAuthed<AdminWebhook>('/api/admin/webhooks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateWebhook(
  id: string,
  input: Partial<AdminWebhookInput>,
): Promise<AdminWebhook> {
  return apiFetchAuthed<AdminWebhook>(`/api/admin/webhooks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteWebhook(id: string): Promise<void> {
  return apiFetchAuthed<void>(`/api/admin/webhooks/${id}`, { method: 'DELETE' });
}

export function adminListWebhookDeliveries(
  id: string,
): Promise<{ items: AdminWebhookDelivery[] }> {
  return apiFetchAuthed<{ items: AdminWebhookDelivery[] }>(
    `/api/admin/webhooks/${id}/deliveries`,
  );
}

export function adminReplayWebhookDelivery(
  webhookId: string,
  deliveryId: string,
): Promise<{ ok: boolean }> {
  return apiFetchAuthed<{ ok: boolean }>(
    `/api/admin/webhooks/${webhookId}/deliveries/${deliveryId}/replay`,
    { method: 'POST' },
  );
}

export function adminRotateWebhookSecret(webhookId: string): Promise<AdminWebhook> {
  return apiFetchAuthed<AdminWebhook>(
    `/api/admin/webhooks/${webhookId}/rotate-secret`,
    { method: 'POST' },
  );
}

// ----- Admin Reports -----

export interface SalesBucket {
  at: string;
  orders: number;
  revenue: number;
  refunded: number;
}

export interface SalesReport {
  range: { from: string; to: string };
  granularity: 'day' | 'week' | 'month';
  buckets: SalesBucket[];
  totals: { orders: number; revenue: number; refunded: number; net: number };
}

export function adminReportSales(params: {
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month';
}): Promise<SalesReport> {
  const sp = new URLSearchParams();
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.granularity) sp.set('granularity', params.granularity);
  return apiFetchAuthed<SalesReport>(`/api/admin/reports/sales?${sp.toString()}`);
}

export interface TopProduct {
  productId: string;
  slug: string;
  name: string;
  units: number;
  revenue: number;
}

export function adminReportTopProducts(params: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<{ range: { from: string; to: string }; items: TopProduct[] }> {
  const sp = new URLSearchParams();
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.limit) sp.set('limit', String(params.limit));
  return apiFetchAuthed(`/api/admin/reports/top-products?${sp.toString()}`);
}

export interface TopCustomer {
  userId: string;
  email: string | null;
  name: string | null;
  orderCount: number;
  revenue: number;
}

export function adminReportTopCustomers(params: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<{ range: { from: string; to: string }; items: TopCustomer[] }> {
  const sp = new URLSearchParams();
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.limit) sp.set('limit', String(params.limit));
  return apiFetchAuthed(`/api/admin/reports/top-customers?${sp.toString()}`);
}

export interface LowStockItem {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  category: { name: string } | null;
  updatedAt: string;
}

export function adminReportLowStock(params: {
  limit?: number;
}): Promise<{ items: LowStockItem[]; note?: string }> {
  const sp = new URLSearchParams();
  if (params.limit) sp.set('limit', String(params.limit));
  return apiFetchAuthed(`/api/admin/reports/low-stock?${sp.toString()}`);
}

// ----- Admin Notifications -----

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export interface AdminNotification {
  id: string;
  userId: string | null;
  channel: NotificationChannel;
  type: string;
  recipient: string;
  subject: string | null;
  providerMessageId: string | null;
  status: NotificationStatus;
  error: string | null;
  context: Record<string, unknown>;
  sentAt: string | null;
  /// Tracker #49 — denormalised engagement signals from Resend
  /// webhook. Null when the event hasn't fired yet (or for emails
  /// sent before Tracker #49 landed).
  deliveredAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  clickCount: number;
  bouncedAt: string | null;
  bounceReason: string | null;
  complainedAt: string | null;
  createdAt: string;
}

export interface AdminNotificationListParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: string;
  q?: string;
}

export function adminListNotifications(
  params: AdminNotificationListParams = {},
): Promise<{ items: AdminNotification[]; pagination: ApiPagination }> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.status) sp.set('status', params.status);
  if (params.type) sp.set('type', params.type);
  if (params.q) sp.set('q', params.q);
  const qs = sp.toString();
  return apiFetchAuthed(`/api/admin/notifications${qs ? `?${qs}` : ''}`);
}

export function adminGetNotification(
  id: string,
): Promise<AdminNotification & { previewHtml: string | null }> {
  return apiFetchAuthed(`/api/admin/notifications/${id}`);
}

export function adminResendNotification(
  id: string,
  to?: string,
): Promise<{ ok: true }> {
  return apiFetchAuthed(`/api/admin/notifications/${id}/resend`, {
    method: 'POST',
    body: JSON.stringify(to ? { to } : {}),
  });
}

// ----- Admin Custom Fields (Phase 10.1) -----

export type CustomFieldScope = 'PRODUCT' | 'ORDER' | 'USER';
export type CustomFieldType =
  | 'TEXT'
  | 'LONGTEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'URL'
  | 'VIDEO'
  | 'IMAGE'
  | 'SELECT'
  | 'JSON'
  | 'RICHTEXT';

export interface CustomFieldDef {
  id: string;
  scope: CustomFieldScope;
  key: string;
  label: string;
  description: string | null;
  type: CustomFieldType;
  required: boolean;
  sortOrder: number;
  options: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldUpsert {
  scope?: CustomFieldScope;
  key?: string;
  label?: string;
  description?: string | null;
  type?: CustomFieldType;
  required?: boolean;
  sortOrder?: number;
  options?: Record<string, unknown>;
  isActive?: boolean;
}

export function adminListCustomFields(params: {
  scope?: CustomFieldScope;
  includeInactive?: boolean;
} = {}): Promise<{ items: CustomFieldDef[] }> {
  const sp = new URLSearchParams();
  if (params.scope) sp.set('scope', params.scope);
  if (params.includeInactive) sp.set('includeInactive', 'true');
  const qs = sp.toString();
  return apiFetchAuthed(`/api/admin/custom-fields${qs ? `?${qs}` : ''}`);
}

export function adminCreateCustomField(
  body: Required<Pick<CustomFieldUpsert, 'scope' | 'key' | 'label' | 'type'>> & CustomFieldUpsert,
): Promise<CustomFieldDef> {
  return apiFetchAuthed(`/api/admin/custom-fields`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminUpdateCustomField(
  id: string,
  body: CustomFieldUpsert,
): Promise<CustomFieldDef> {
  return apiFetchAuthed(`/api/admin/custom-fields/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function adminDeleteCustomField(id: string): Promise<void> {
  return apiFetchAuthed(`/api/admin/custom-fields/${id}`, { method: 'DELETE' });
}

// Public read used by storefront product page (no auth required).
export async function listCustomFields(
  scope: CustomFieldScope,
): Promise<{ items: CustomFieldDef[] }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const r = await fetch(`${base}/api/custom-fields/${scope}`, { cache: 'no-store' });
  if (!r.ok) return { items: [] };
  return r.json();
}

// ----- Admin Payment Gateways (Phase 10.2) -----

export interface ProviderField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  required: boolean;
  helpText?: string;
  options?: string[];
}

export interface ProviderDefinition {
  key: string;
  displayName: string;
  defaultLabel: string;
  supportedCurrencies: string[];
  hasEnvironments: boolean;
  credentialFields: ProviderField[];
}

export interface PaymentGatewayConfigRow {
  id: string;
  provider: string;
  label: string;
  environment: string;
  isActive: boolean;
  priority: number;
  currencies: string[];
  credentials: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function adminListAvailableProviders(): Promise<{ items: ProviderDefinition[] }> {
  return apiFetchAuthed('/api/admin/payment-gateways/providers');
}

export function adminListPaymentGateways(): Promise<{ items: PaymentGatewayConfigRow[] }> {
  return apiFetchAuthed('/api/admin/payment-gateways');
}

export function adminCreatePaymentGateway(body: {
  provider: string;
  label: string;
  environment: string;
  isActive?: boolean;
  priority?: number;
  currencies: string[];
  credentials: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<PaymentGatewayConfigRow> {
  return apiFetchAuthed('/api/admin/payment-gateways', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminUpdatePaymentGateway(
  id: string,
  body: Partial<Parameters<typeof adminCreatePaymentGateway>[0]>,
): Promise<PaymentGatewayConfigRow> {
  return apiFetchAuthed(`/api/admin/payment-gateways/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function adminDeletePaymentGateway(id: string): Promise<void> {
  return apiFetchAuthed(`/api/admin/payment-gateways/${id}`, { method: 'DELETE' });
}

// ----- Admin Email Templates (Phase 10.3) -----

export interface EmailBlock {
  type: string;
  [k: string]: unknown;
}

export interface BlockPaletteEntry {
  type: string;
  label: string;
  description: string;
  factory: () => EmailBlock;
}

export interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: EmailBlock[];
  preview: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export function adminListEmailBlocks(): Promise<{ items: BlockPaletteEntry[] }> {
  return apiFetchAuthed('/api/admin/email-templates/blocks');
}

export function adminListEmailTemplates(): Promise<{ items: EmailTemplate[] }> {
  return apiFetchAuthed('/api/admin/email-templates');
}

export function adminUpsertEmailTemplate(body: {
  type: string;
  name: string;
  subject: string;
  body: EmailBlock[];
  preview?: string | null;
  isActive: boolean;
}): Promise<EmailTemplate> {
  return apiFetchAuthed('/api/admin/email-templates', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function adminDeleteEmailTemplate(id: string): Promise<void> {
  return apiFetchAuthed(`/api/admin/email-templates/${id}`, { method: 'DELETE' });
}

export function adminPreviewEmailTemplate(body: {
  subject: string;
  preview?: string | null;
  body: EmailBlock[];
  variables?: Record<string, unknown>;
}): Promise<{ html: string }> {
  return apiFetchAuthed('/api/admin/email-templates/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminSendTestEmail(body: {
  to: string;
  subject: string;
  preview?: string | null;
  body: EmailBlock[];
  variables?: Record<string, unknown>;
}): Promise<{ ok: true }> {
  return apiFetchAuthed('/api/admin/email-templates/send-test', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ----- Admin Feature Flags (Phase 10.4) -----

export interface FeatureFlagRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  defaultValue: boolean;
  targetingRules: Array<{ match: Record<string, unknown>; value: boolean }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function adminListFeatureFlags(): Promise<{ items: FeatureFlagRow[] }> {
  return apiFetchAuthed('/api/admin/feature-flags');
}

export function adminCreateFeatureFlag(body: {
  key: string;
  name: string;
  description?: string | null;
  defaultValue: boolean;
  targetingRules?: Array<{ match: Record<string, unknown>; value: boolean }>;
  isActive: boolean;
}): Promise<FeatureFlagRow> {
  return apiFetchAuthed('/api/admin/feature-flags', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminUpdateFeatureFlag(
  id: string,
  body: Partial<Parameters<typeof adminCreateFeatureFlag>[0]>,
): Promise<FeatureFlagRow> {
  return apiFetchAuthed(`/api/admin/feature-flags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function adminDeleteFeatureFlag(id: string): Promise<void> {
  return apiFetchAuthed(`/api/admin/feature-flags/${id}`, { method: 'DELETE' });
}

// ----- Admin Business Rules (Phase 10.5) -----

export interface BusinessRuleRow {
  id: string;
  scope: string;
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function adminListBusinessRules(
  scope?: string,
): Promise<{ items: BusinessRuleRow[] }> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  return apiFetchAuthed(`/api/admin/business-rules${qs}`);
}

export function adminCreateBusinessRule(body: {
  scope: string;
  key: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  priority: number;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
}): Promise<BusinessRuleRow> {
  return apiFetchAuthed('/api/admin/business-rules', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminUpdateBusinessRule(
  id: string,
  body: Partial<Parameters<typeof adminCreateBusinessRule>[0]>,
): Promise<BusinessRuleRow> {
  return apiFetchAuthed(`/api/admin/business-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function adminDeleteBusinessRule(id: string): Promise<void> {
  return apiFetchAuthed(`/api/admin/business-rules/${id}`, { method: 'DELETE' });
}

export function adminEvaluateBusinessRules(
  scope: string,
  context: Record<string, unknown>,
): Promise<{
  hits: Array<{
    id: string;
    key: string;
    name: string;
    priority: number;
    actions: Record<string, unknown>;
  }>;
}> {
  return apiFetchAuthed('/api/admin/business-rules/evaluate', {
    method: 'POST',
    body: JSON.stringify({ scope, context }),
  });
}

// ----- Admin CMS Pages (Phase 10.6) -----

export interface CmsBlock {
  type: string;
  [k: string]: unknown;
}

export interface CmsPageRow {
  id: string;
  slug: string;
  title: string;
  metaDescription: string | null;
  blocks: CmsBlock[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function adminListCmsPages(): Promise<{ items: CmsPageRow[] }> {
  return apiFetchAuthed('/api/admin/pages');
}

export function adminGetCmsPage(id: string): Promise<CmsPageRow> {
  return apiFetchAuthed(`/api/admin/pages/${id}`);
}

export function adminCreateCmsPage(body: {
  slug: string;
  title: string;
  metaDescription?: string | null;
  blocks: CmsBlock[];
  isPublished: boolean;
}): Promise<CmsPageRow> {
  return apiFetchAuthed('/api/admin/pages', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminUpdateCmsPage(
  id: string,
  body: Partial<Parameters<typeof adminCreateCmsPage>[0]>,
): Promise<CmsPageRow> {
  return apiFetchAuthed(`/api/admin/pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function adminDeleteCmsPage(id: string): Promise<void> {
  return apiFetchAuthed(`/api/admin/pages/${id}`, { method: 'DELETE' });
}

// Public — anyone can read flag values for given keys.
export async function evaluateFlags(keys: string[]): Promise<Record<string, boolean>> {
  if (keys.length === 0) return {};
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const r = await fetch(`${base}/api/flags?keys=${encodeURIComponent(keys.join(','))}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!r.ok) return {};
  const j = (await r.json()) as { flags: Record<string, boolean> };
  return j.flags ?? {};
}

/// Conventions on PaymentGatewayConfig.metadata used by the
/// storefront checkout picker (Tracker #50.1 — gateway-first UI,
/// 2026-05-19). All keys are optional — a gateway with no logo
/// falls back to "Pay with [label]" text, and a gateway with no
/// supportedMethods list just hides the method-chips caption.
export interface PublicGatewayMetadata {
  logoUrl?: string;
  supportedMethods?: string[];
  [k: string]: unknown;
}

export interface PublicGateway {
  id: string;
  provider: string;
  label: string;
  currencies: string[];
  metadata: PublicGatewayMetadata;
}

// Public — storefront checkout picker.
export async function listPublicGateways(
  currency?: string,
): Promise<{ items: PublicGateway[] }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const qs = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  const r = await fetch(`${base}/api/payments/gateways${qs}`, { cache: 'no-store' });
  if (!r.ok) return { items: [] };
  return r.json();
}

// ----- Blog -----

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  heroImage: string | null;
  heroImageAlt: string | null;
  authorId: string | null;
  authorName: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  tags: string[];
  readingTimeMin: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogPostList {
  items: AdminBlogPost[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function adminListBlogPosts(params: {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ALL';
  q?: string;
}): Promise<AdminBlogPostList> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.status) sp.set('status', params.status);
  if (params.q) sp.set('q', params.q);
  const qs = sp.toString();
  return apiFetchAuthed(`/api/admin/blog${qs ? `?${qs}` : ''}`);
}

export function adminGetBlogPost(id: string): Promise<AdminBlogPost> {
  return apiFetchAuthed(`/api/admin/blog/${id}`);
}

export function adminCreateBlogPost(input: Partial<AdminBlogPost>): Promise<AdminBlogPost> {
  return apiFetchAuthed('/api/admin/blog', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateBlogPost(
  id: string,
  input: Partial<AdminBlogPost>,
): Promise<AdminBlogPost> {
  return apiFetchAuthed(`/api/admin/blog/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function adminDeleteBlogPost(id: string): Promise<void> {
  return apiFetchAuthed(`/api/admin/blog/${id}`, { method: 'DELETE' });
}

// ----- Site content (text + image overrides) -----

import type { SlotDef } from '@/lib/site-content/registry';

export function adminGetContentRegistry(): Promise<{ slots: SlotDef[] }> {
  return apiFetchAuthed('/api/admin/content/registry');
}

export function adminGetContentOverrides(): Promise<{ overrides: Record<string, unknown> }> {
  return apiFetchAuthed('/api/admin/content');
}

export interface ContentEntry {
  key: string;
  /// `null` clears the override → component default applies.
  value: unknown;
}

export function adminUpdateContent(
  entries: ContentEntry[],
): Promise<{ updated: number; cleared: number; skipped: string[] }> {
  return apiFetchAuthed('/api/admin/content', {
    method: 'PUT',
    body: JSON.stringify({ entries }),
  });
}

// ----- Intern image-update workflow -----

export interface InternProgressItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  assigned: number;
  todo: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function adminGetInternProgress(): Promise<{ items: InternProgressItem[] }> {
  return apiFetchAuthed('/api/admin/intern/progress');
}

export interface AdminSubmissionItem {
  id: string;
  productId: string;
  internId: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  // Front/back/side are individually optional — some products legitimately
  // don't have all 3 angles. The submit endpoint requires at least one
  // product image total (front/back/side/extras combined).
  frontImageUrl: string | null;
  backImageUrl: string | null;
  sideImageUrl: string | null;
  additionalImages: string[];
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  payRate: number;
  createdAt: string;
  updatedAt: string;
  product: { id: string; slug: string; name: string; brand: string | null; images: string[] };
  intern: { id: string; name: string | null; email: string };
}

export function adminListSubmissions(params: {
  status?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ALL';
  internId?: string;
}): Promise<{ items: AdminSubmissionItem[] }> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.internId) sp.set('internId', params.internId);
  const qs = sp.toString();
  return apiFetchAuthed(`/api/admin/intern/submissions${qs ? `?${qs}` : ''}`);
}

export function adminReviewSubmission(
  submissionId: string,
  body: { action: 'approve' } | { action: 'reject'; reason: string },
): Promise<AdminSubmissionItem> {
  return apiFetchAuthed(`/api/admin/intern/submissions/${submissionId}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminBulkAssignInterns(input: {
  internIds: string[];
  scope?: 'all-unimaged' | 'all-unassigned';
  payRate?: number;
}): Promise<{ assigned: number; perIntern: Record<string, number> }> {
  return apiFetchAuthed('/api/admin/intern/bulk-assign', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminReassignProducts(input: {
  productIds?: string[];
  fromInternId?: string;
  toInternIds: string[] | null;
  mode?: 'unstarted' | 'all';
}): Promise<{ moved: number; perIntern: Record<string, number>; returnedToPool: number }> {
  return apiFetchAuthed('/api/admin/intern/reassign', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ----- Intern self endpoints -----

export interface InternQueueItem {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  /// NGN whole units. Editable by interns from the list view
  /// (PR Lesoda 2026-05-11). Quick-edit hits the audit log.
  price: number;
  comparePrice: number | null;
  category: { slug: string; name: string } | null;
  currentImages: string[];
  status: 'todo' | 'pending' | 'approved' | 'rejected';
  latestSubmission: {
    id: string;
    status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    // Optional — some products don't have all 3 angles. At least one
    // product image is required at submit time, but each slot is
    // individually nullable.
    frontImageUrl: string | null;
    backImageUrl: string | null;
    sideImageUrl: string | null;
    additionalImages: string[];
    /// Brand logo + alt; nullable for legacy submissions made before
    /// the brand slot was added.
    brandImageUrl: string | null;
    brandImageAlt: string | null;
    rejectionReason: string | null;
    reviewedAt: string | null;
    createdAt: string;
    /// Tracker #50 — set when this approval has been rolled into a
    /// payout (DRAFT or PAID). UI filters Approved rows by this so
    /// already-paid work doesn't clutter the active tab.
    payoutId: string | null;
  } | null;
}

export interface InternQueueStats {
  todo: number;
  pending: number;
  approved: number;
  /// Tracker #50 — split of `approved` by payout status. unpaid =
  /// payoutId is null on the latest submission. The cards page
  /// uses approvedUnpaid as the default count on the Approved tab.
  approvedUnpaid: number;
  approvedPaid: number;
  rejected: number;
}

export function internGetMyQueue(): Promise<{
  items: InternQueueItem[];
  stats: InternQueueStats;
}> {
  return apiFetchAuthed('/api/intern/queue');
}

export function internGetMyStats(): Promise<{
  stats: InternQueueStats & { assigned: number };
  earnings: {
    currentRateNgn: number;
    earnedNgn: number;
    /// Tracker #50 — earnedNgn split by paid vs not-yet-paid so the
    /// intern dashboard can show "Pending payday".
    unpaidEarnedNgn: number;
    paidEarnedNgn: number;
    pendingNgn: number;
  };
}> {
  return apiFetchAuthed('/api/intern/me');
}

export function internClaimFromPool(count: number): Promise<{ claimed: number }> {
  return apiFetchAuthed('/api/intern/claim', {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
}

export function internSubmitImages(
  productId: string,
  body: {
    frontImageUrl: string;
    backImageUrl: string;
    sideImageUrl: string;
    /// Required by the API. UI nudges intern to fill it before they
    /// can submit.
    brandImageUrl: string;
    brandImageAlt?: string | null;
    additionalImages?: string[];
  },
): Promise<{ id: string; status: string; createdAt: string }> {
  return apiFetchAuthed(`/api/intern/products/${productId}/submit`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminGetInternPayRate(): Promise<{ rate: number }> {
  return apiFetchAuthed('/api/admin/intern/pay-rate');
}

// ----- Intern payouts (Tracker #50, 2026-05-18) -----

export interface InternPayoutSummary {
  id: string;
  internId: string;
  intern: { id: string; name: string | null; email: string };
  totalNgn: number;
  submissionCount: number;
  windowFrom: string | null;
  windowTo: string | null;
  paidAt: string | null;
  externalRef: string | null;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
}

export interface InternPayoutDetail extends InternPayoutSummary {
  submissions: Array<{
    id: string;
    reviewedAt: string | null;
    payRate: number;
    product: { id: string; slug: string; name: string };
  }>;
}

export interface PayoutPreview {
  submissions: Array<{
    id: string;
    reviewedAt: string | null;
    payRate: number;
    product: { id: string; slug: string; name: string };
  }>;
  totalNgn: number;
  submissionCount: number;
}

function payoutWindowBody(input: {
  internId: string;
  fromDate?: string;
  toDate?: string;
}): string {
  return JSON.stringify({
    internId: input.internId,
    fromDate: input.fromDate,
    toDate: input.toDate,
  });
}

export function adminListInternPayouts(params: {
  internId?: string;
  status?: 'draft' | 'paid' | 'all';
} = {}): Promise<{ items: InternPayoutSummary[] }> {
  const sp = new URLSearchParams();
  if (params.internId) sp.set('internId', params.internId);
  if (params.status) sp.set('status', params.status);
  const qs = sp.toString();
  return apiFetchAuthed(`/api/admin/intern-payouts${qs ? `?${qs}` : ''}`);
}

export function adminGetInternPayout(id: string): Promise<InternPayoutDetail> {
  return apiFetchAuthed(`/api/admin/intern-payouts/${id}`);
}

export function adminPreviewInternPayout(input: {
  internId: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PayoutPreview> {
  return apiFetchAuthed('/api/admin/intern-payouts/preview', {
    method: 'POST',
    body: payoutWindowBody(input),
  });
}

export function adminCreateInternPayoutDraft(input: {
  internId: string;
  fromDate?: string;
  toDate?: string;
}): Promise<InternPayoutSummary> {
  return apiFetchAuthed('/api/admin/intern-payouts', {
    method: 'POST',
    body: payoutWindowBody(input),
  });
}

export function adminFinalizeInternPayout(
  id: string,
  body: { externalRef?: string; note?: string },
): Promise<InternPayoutSummary> {
  return apiFetchAuthed(`/api/admin/intern-payouts/${id}/finalize`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminCancelInternPayoutDraft(id: string): Promise<{ ok: true }> {
  return apiFetchAuthed(`/api/admin/intern-payouts/${id}`, {
    method: 'DELETE',
  });
}

export function adminSetInternPayRate(rate: number): Promise<{ rate: number }> {
  return apiFetchAuthed('/api/admin/intern/pay-rate', {
    method: 'PUT',
    body: JSON.stringify({ rate }),
  });
}

/// Triggers a browser download of the payroll CSV. Sends the Bearer
/// token via authed fetch (a plain <a href> can't), buffers the body
/// into a Blob, then synthesises a click on a hidden anchor.
export async function adminDownloadInternCsv(filters: {
  from?: string;
  to?: string;
  internId?: string;
}): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const sp = new URLSearchParams();
  if (filters.from) sp.set('from', filters.from);
  if (filters.to) sp.set('to', filters.to);
  if (filters.internId) sp.set('internId', filters.internId);
  const qs = sp.toString();
  const url = `${base}/api/admin/intern/export.csv${qs ? `?${qs}` : ''}`;

  // Pull the access token via the auth store; avoids a circular
  // import by reading it lazily.
  const { useAuthStore } = await import('@/stores/authStore');
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new Error('Not signed in');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `intern-payroll-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

// =================================================================
// Phase 10.8 — Admin Shelves
// =================================================================

/// One country row in a rule-based shelf. `country: null` = any country.
export interface ShelfCountryRow {
  country: string | null;
  count: number;
}

export interface ShelfConfig {
  id?: string;
  key: string;
  title: string;
  subtitle: string | null;
  rows: number;
  cols: number;
  enabled: boolean;
  /// Phase 10.8b — when set + non-empty, the shelf auto-fills from
  /// these rules instead of using explicit picks. Each row contributes
  /// `count` products from `country` (null = any country).
  countryRows?: ShelfCountryRow[] | null;
}

/// Phase 10.8 — registered fallback for a shelf. Storefront uses it
/// to fill empty slots when picks < cap; admin uses it to power the
/// "Quick fill from fallback" button.
export interface ShelfFallback {
  category?: string;
  origin?: string;
  onSale?: boolean;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
}

export interface ShelfListItem {
  key: string;
  label: string;
  description: string;
  group: string;
  shelf: ShelfConfig;
  productCount: number;
  defaultFallback: ShelfFallback | null;
}

export interface ShelfProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  origin: string | null;
  images: string[];
  price: number;
  inStock: boolean;
}

export interface ShelfSlot {
  productId: string;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  countries: string[];
  product: ShelfProductSummary | null;
}

export interface ShelfDetail {
  shelf: ShelfConfig;
  defaultFallback: ShelfFallback | null;
  items: ShelfSlot[];
}

export interface ShelfSlotInput {
  productId: string;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  countries?: string[];
}

export function adminListShelves(): Promise<{
  groups: Record<string, string>;
  items: ShelfListItem[];
}> {
  return apiFetchAuthed('/api/admin/shelves');
}

export function adminGetShelf(key: string): Promise<ShelfDetail> {
  return apiFetchAuthed<ShelfDetail>(
    `/api/admin/shelves/${encodeURIComponent(key)}`,
  );
}

export function adminUpdateShelf(
  key: string,
  input: Partial<Omit<ShelfConfig, 'key' | 'id'>>,
): Promise<ShelfConfig> {
  return apiFetchAuthed<ShelfConfig>(
    `/api/admin/shelves/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export function adminSetShelfProducts(
  key: string,
  items: ShelfSlotInput[],
): Promise<{ count: number }> {
  return apiFetchAuthed<{ count: number }>(
    `/api/admin/shelves/${encodeURIComponent(key)}/products`,
    {
      method: 'PUT',
      body: JSON.stringify({ items }),
    },
  );
}

// ----- Admin Loyalty (Continental Rewards) — Tracker #44 PR 1 -----

export type LoyaltyTier = 'BLUE' | 'GOLD' | 'VIP' | 'AMBASSADOR' | 'DORIME';

export type LoyaltyTransactionType =
  | 'WELCOME_BONUS'
  | 'EARN'
  | 'REDEEM'
  | 'REFUND_REVERSAL'
  | 'REDEEM_REFUND'
  | 'EXPIRY'
  | 'ADMIN_ADJUSTMENT';

export interface LoyaltyConfigDto {
  baseEarnPerOrder: number;
  tierMultiplier: number;
  welcomeBonusCoins: number;
  tier2GoldThreshold: number;
  tier3VipThreshold: number;
  tier4AmbassadorThreshold: number;
  tier5DorimeThreshold: number;
  coinValueNgn: number;
  maxOrderRedeemPercent: number;
  minRedeemCoins: number;
  coinExpiryMonths: number;
  spendWindowMonths: number;
}

export interface LoyaltyAccountRow {
  id: string;
  userId: string;
  coinBalance: number;
  currentTier: LoyaltyTier;
  lifetimeCoinsEarned: number;
  lifetimeCoinsRedeemed: number;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  };
}

export interface LoyaltyTransactionRow {
  id: string;
  accountId: string;
  delta: number;
  balanceAfter: number;
  type: LoyaltyTransactionType;
  causeOrderId: string | null;
  causeAdminId: string | null;
  reason: string | null;
  expiresAt: string | null;
  expiredAt: string | null;
  createdAt: string;
}

export interface LoyaltyAccountDetail extends LoyaltyAccountRow {
  transactions: LoyaltyTransactionRow[];
}

export function adminGetLoyaltyConfig(): Promise<LoyaltyConfigDto> {
  return apiFetchAuthed('/api/admin/loyalty/config');
}

export function adminUpdateLoyaltyConfig(
  patch: Partial<LoyaltyConfigDto>,
): Promise<LoyaltyConfigDto> {
  return apiFetchAuthed('/api/admin/loyalty/config', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function adminListLoyaltyAccounts(params: {
  q?: string;
  tier?: LoyaltyTier;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: LoyaltyAccountRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.tier) qs.set('tier', params.tier);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetchAuthed(`/api/admin/loyalty/accounts${suffix}`);
}

export function adminGetLoyaltyAccount(id: string): Promise<LoyaltyAccountDetail> {
  return apiFetchAuthed(`/api/admin/loyalty/accounts/${encodeURIComponent(id)}`);
}

export function adminAdjustLoyaltyAccount(
  id: string,
  delta: number,
  reason: string,
): Promise<LoyaltyTransactionRow> {
  return apiFetchAuthed(`/api/admin/loyalty/accounts/${encodeURIComponent(id)}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ delta, reason }),
  });
}

// ===== Tracker #46 — Customer-facing payment methods =====
//
// Distinct from /admin/payment-gateways (gateway credentials).
// These manage what the customer sees on /checkout/payment + the
// bank-transfer accounts they're shown.

export type AdminPaymentMethodCode =
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'USSD'
  | 'CRYPTO'
  | 'PAY_ON_DELIVERY';

export interface AdminPaymentMethod {
  id: string;
  code: AdminPaymentMethodCode;
  label: string;
  description: string;
  icon: string;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  details: Record<string, unknown>;
}

export interface AdminPaymentMethodUpdate {
  label: string;
  description: string;
  icon: string;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  details: Record<string, unknown>;
}

export interface AdminPaymentBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  country: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminPaymentBankAccountInput {
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  country: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function adminListPaymentMethods(): Promise<{ items: AdminPaymentMethod[] }> {
  return apiFetchAuthed('/api/admin/payment-methods');
}

export function adminUpdatePaymentMethod(
  id: string,
  body: AdminPaymentMethodUpdate,
): Promise<AdminPaymentMethod> {
  return apiFetchAuthed(`/api/admin/payment-methods/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function adminListPaymentBankAccounts(): Promise<{ items: AdminPaymentBankAccount[] }> {
  return apiFetchAuthed('/api/admin/payment-methods/bank-accounts');
}

export function adminCreatePaymentBankAccount(
  body: AdminPaymentBankAccountInput,
): Promise<AdminPaymentBankAccount> {
  return apiFetchAuthed('/api/admin/payment-methods/bank-accounts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminUpdatePaymentBankAccount(
  id: string,
  body: AdminPaymentBankAccountInput,
): Promise<AdminPaymentBankAccount> {
  return apiFetchAuthed(
    `/api/admin/payment-methods/bank-accounts/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
}

export function adminDeletePaymentBankAccount(id: string): Promise<void> {
  return apiFetchAuthed(
    `/api/admin/payment-methods/bank-accounts/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
