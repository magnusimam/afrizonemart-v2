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
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  /** Price stored in kobo (1/100 NGN). Divide by 100 for display. */
  price: number;
  comparePrice: number | null;
  origin: string | null;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  categoryId: string | null;
  category: ApiCategory | null;
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
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
}
