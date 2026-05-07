/**
 * Shared API DTO types — match the shape the API returns.
 *
 * Keep these in sync with the response shapes from the API endpoints.
 * (Eventually these can be generated from an OpenAPI schema or zod
 * inference — for now we hand-write them.)
 */

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProductBundle {
  units: number;
  label: string;
  price: number;
  comparePrice: number;
  savings?: number;
  popular?: boolean;
}

export interface ApiProductFeature {
  icon: 'sparkles' | 'leaf' | 'globe' | 'shield' | 'heart' | 'check' | 'gem';
  text: string;
}

export interface ApiProductSpec {
  label: string;
  value: string;
}

export interface ApiProductVariants {
  type: string;
  options: string[];
  default: string;
}

export interface ApiProductAttributes {
  bundles: ApiProductBundle[];
  features: ApiProductFeature[];
  specifications: ApiProductSpec[];
  variants?: ApiProductVariants;
  aboutTitle: string;
  aboutBody: string;
  aboutImage: string;
}

export interface ApiReview {
  id: string;
  productId: string;
  authorName: string;
  authorCountry: string | null;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  /** Price in Naira (whole units). */
  price: number;
  comparePrice: number | null;
  discountPercent: number | null;
  shortDescription: string | null;
  description: string | null;
  ingredients: string | null;
  origin: string | null;
  /// Phase 11 — shipping weight in kilograms. Null when admin
  /// hasn't set it yet; quote engine treats null as 0.5 kg.
  weightKg: number | null;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  /// Brand / company logo. Captured by the intern image-update flow.
  /// Storefront's "About the brand" section uses it when present.
  brandImageUrl?: string | null;
  brandImageAlt?: string | null;
  attributes: ApiProductAttributes;
  categoryId: string | null;
  category: ApiCategory | null;
  reviews?: ApiReview[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiProductList {
  items: ApiProduct[];
  pagination: ApiPagination;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  origin?: string;
  q?: string;
  inStock?: boolean;
  onSale?: boolean;
  /** Phase 10.7 — placement key filter (e.g. "homepage_hero"). */
  placement?: string;
  /** ISO-2 country used together with placement scoping. */
  country?: string;
  /**
   * Phase 10.8 — explicit product IDs. When set, the API returns only
   * these products in this order; other filters except `inStock` are
   * ignored. Used by manually-curated shelves and product-grid sections.
   */
  ids?: string[];
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
}
