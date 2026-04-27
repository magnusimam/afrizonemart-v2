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
  shippingRateId: string | null;
  shipFullName: string;
  shipPhone: string;
  shipAddressLine: string;
  shipCity: string;
  shipCountry: string;
  paymentMethod: PaymentMethodId;
  paymentRef: string | null;
  items: OrderItem[];
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
