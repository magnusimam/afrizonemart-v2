import { apiFetchAuthed } from './client';

export interface CartLine {
  productId: string;
  /// Tracker #45 — server-side variant id, always present on lines
  /// coming back from the API.
  productVariantId: string;
  bundleLabel: string;
  variantLabel: string | null;
  unitsPerPack: number;
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

/// Tracker #45 — send productVariantId for new flows; productId still
/// accepted by the API for cards added from list views, where the
/// storefront only knows the product, not the variant.
export interface CartInputItem {
  productVariantId?: string;
  productId?: string;
  variantLabel?: string | null;
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
