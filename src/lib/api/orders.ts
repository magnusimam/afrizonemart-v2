import { apiFetchAuthed } from './client';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FULFILLING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethodId = 'PAYSTACK' | 'GTSQUAD' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';

export interface OrderItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type OrderEventType =
  | 'STATUS_CHANGED'
  | 'NOTE'
  | 'PAYMENT_RECEIVED'
  | 'SHIPMENT_UPDATED'
  | 'REFUND_RECORDED'
  | 'CANCELLED';

/// Customer-visible event on the order timeline. Payload varies per
/// type. The timeline derivation only reads STATUS_CHANGED
/// (`{ from, to }`) and PAYMENT_RECEIVED.
export interface OrderEvent {
  id: string;
  type: OrderEventType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  couponCode: string | null;
  couponDiscount: number;
  coinsRedeemed: number;
  coinDiscount: number;
  shippingRateId: string | null;
  shipFullName: string;
  shipPhone: string;
  shipAddressLine: string;
  shipCity: string;
  shipCountry: string;
  paymentMethod: PaymentMethodId;
  paymentRef: string | null;
  items: OrderItem[];
  /// Customer-visible timeline events, oldest first. Only present
  /// on `GET /api/orders/:id` — the list endpoint omits it.
  events?: OrderEvent[];
  cancelledAt?: string | null;
  refundedTotal?: number;
  /// Show & Scan delivery confirmation. Populated when status is
  /// OUT_FOR_DELIVERY; cleared on DELIVERED. Customer's web /
  /// mobile screen reads these to render the QR + OTP.
  deliveryToken?: string | null;
  deliveryOtp?: string | null;
  /// Who confirmed delivery — only present once status is DELIVERED.
  deliveredSource?: 'rider' | 'customer' | 'admin' | 'auto' | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/// `GET /api/orders/:id/delivery-token` — customer's app polls this
/// while the order is OUT_FOR_DELIVERY. Returns `null` once the
/// order leaves that status (delivered, cancelled, etc).
export interface DeliveryTokenPayload {
  token: string;
  otp: string;
  expiresAt: string;
}

export function getDeliveryToken(
  orderId: string,
): Promise<DeliveryTokenPayload | null> {
  return apiFetchAuthed<DeliveryTokenPayload | null>(
    `/api/orders/${encodeURIComponent(orderId)}/delivery-token`,
  );
}

export function confirmDeliveryAsCustomer(
  orderId: string,
): Promise<{ orderNumber: string }> {
  return apiFetchAuthed<{ orderNumber: string }>(
    `/api/orders/${encodeURIComponent(orderId)}/confirm-delivery`,
    { method: 'POST' },
  );
}

export interface PlaceOrderInput {
  shipping: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    country: string;
  };
  paymentMethod?: PaymentMethodId;
  shippingRateId?: string;
  /// Afrizone Coins to apply to this order. Server re-validates
  /// against the live balance + min/max rules. 0 or omitted = no
  /// redemption.
  coinRedeemCoins?: number;
}

export function placeOrder(input: PlaceOrderInput): Promise<Order> {
  return apiFetchAuthed<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listOrders(): Promise<{ items: Order[] }> {
  return apiFetchAuthed<{ items: Order[] }>('/api/orders');
}

export function getOrder(id: string): Promise<Order> {
  return apiFetchAuthed<Order>(`/api/orders/${encodeURIComponent(id)}`);
}
