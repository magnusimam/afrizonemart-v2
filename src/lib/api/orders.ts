import { apiFetchAuthed } from './client';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FULFILLING'
  | 'SHIPPED'
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
  createdAt: string;
  updatedAt: string;
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
