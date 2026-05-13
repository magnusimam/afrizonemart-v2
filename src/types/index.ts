export interface Money {
  amount: number;
  currency: 'NGN' | 'USD' | 'GBP';
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  currency: 'NGN' | 'USD' | 'GBP';
  images: ProductImage[];
  category: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
}

export interface CartItem {
  productId: string;
  /// Tracker #45 — server-side variant the cart line points at. Required
  /// for cart sync (server validates this exists). Optional in the type
  /// only for backwards-compat during the migration window; new items
  /// added from the storefront always set it.
  productVariantId?: string;
  /// Display label for the bundle that produced this cart line (e.g.
  /// "Carton (12)"). Stored locally so the cart UI keeps showing what
  /// the customer picked.
  bundleLabel?: string;
  /// Freeform variant (size/colour). Display-only.
  variantLabel?: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  image: string;
  origin?: string;
  variant?: string;
  quantity: number;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  currency: 'NGN' | 'USD' | 'GBP';
  items: CartItem[];
  createdAt: string;
}
