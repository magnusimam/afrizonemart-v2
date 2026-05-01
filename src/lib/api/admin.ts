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

export type AdminBulkAction =
  | { kind: 'delete' }
  | { kind: 'set-in-stock'; value: boolean }
  | { kind: 'set-category'; categorySlug: string | null };

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

export type CustomerRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

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

export type StaffCreatableRole = Extract<StaffRole, 'SELLER' | 'ADMIN'>;

export interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  role: StaffRole;
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

export function adminCreateStaff(input: {
  email: string;
  name?: string;
  role: StaffCreatableRole;
  password: string;
}): Promise<StaffMember> {
  return apiFetchAuthed<StaffMember>('/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify(input),
  });
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
  isDefault: boolean;
  sortOrder: number;
}

export interface AdminShippingZone {
  id: string;
  name: string;
  countries: string[];
  isDefault: boolean;
  sortOrder: number;
  rates: AdminShippingRate[];
}

export function adminListShippingZones(): Promise<{ items: AdminShippingZone[] }> {
  return apiFetchAuthed<{ items: AdminShippingZone[] }>('/api/admin/shipping/zones');
}

export function adminCreateShippingZone(input: {
  name: string;
  countries: string[];
  isDefault: boolean;
  sortOrder?: number;
}): Promise<AdminShippingZone> {
  return apiFetchAuthed<AdminShippingZone>('/api/admin/shipping/zones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function adminUpdateShippingZone(
  id: string,
  input: Partial<{ name: string; countries: string[]; isDefault: boolean; sortOrder: number }>,
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
  input: {
    name: string;
    priceAmount: number;
    freeAboveAmount?: number | null;
    isDefault: boolean;
    sortOrder?: number;
  },
): Promise<AdminShippingRate> {
  return apiFetchAuthed<AdminShippingRate>(
    `/api/admin/shipping/zones/${zoneId}/rates`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function adminUpdateShippingRate(
  rateId: string,
  input: Partial<{
    name: string;
    priceAmount: number;
    freeAboveAmount: number | null;
    isDefault: boolean;
    sortOrder: number;
  }>,
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

// Public — storefront checkout picker.
export async function listPublicGateways(
  currency?: string,
): Promise<{ items: Array<{ id: string; provider: string; label: string; currencies: string[] }> }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const qs = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  const r = await fetch(`${base}/api/payments/gateways${qs}`, { cache: 'no-store' });
  if (!r.ok) return { items: [] };
  return r.json();
}
