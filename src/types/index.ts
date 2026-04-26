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
