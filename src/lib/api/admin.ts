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
