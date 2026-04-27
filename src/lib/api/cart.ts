import { apiFetchAuthed } from './client';

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  image: string | null;
  origin: string | null;
  quantity: number;
  lineTotal: number;
  inStock: boolean;
}

export interface CartView {
  items: CartLine[];
  subtotal: number;
  itemCount: number;
  couponCode: string | null;
  couponDiscount: number;
  couponFreeShipping: boolean;
}

export interface CartInputItem {
  productId: string;
  quantity: number;
}

export function fetchCart(): Promise<CartView> {
  return apiFetchAuthed<CartView>('/api/cart');
}

export function replaceCart(items: CartInputItem[]): Promise<CartView> {
  return apiFetchAuthed<CartView>('/api/cart', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

export function clearServerCart(): Promise<CartView> {
  return apiFetchAuthed<CartView>('/api/cart', { method: 'DELETE' });
}

export function applyCartCoupon(code: string): Promise<CartView> {
  return apiFetchAuthed<CartView>('/api/cart/coupon', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function removeCartCoupon(): Promise<CartView> {
  return apiFetchAuthed<CartView>('/api/cart/coupon', { method: 'DELETE' });
}
