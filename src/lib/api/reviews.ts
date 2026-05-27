import { apiFetchAuthed, HttpApiError } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Customer-facing review client. List is public (plain fetch); create
 * uses the auth-aware client (requireAuth on the API side — no guest
 * reviews).
 */

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
}

export interface ApiReviewListResponse {
  items: ApiReview[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CreateReviewInput {
  productSlug: string;
  rating: number;
  title?: string | null;
  body: string;
}

/// Public — anyone can list reviews for a product.
export async function listProductReviews(
  productSlug: string,
  page = 1,
  limit = 10,
): Promise<ApiReviewListResponse> {
  const url = `${API_BASE}/api/reviews?productSlug=${encodeURIComponent(productSlug)}&page=${page}&limit=${limit}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      /* not JSON */
    }
    throw new HttpApiError(res.status, 'REVIEWS_LIST', message);
  }
  return (await res.json()) as ApiReviewListResponse;
}

/// Authed — POST a new review. The API derives authorName from the
/// signed-in user and snapshots the verified-purchase flag.
export async function createProductReview(input: CreateReviewInput): Promise<ApiReview> {
  return apiFetchAuthed<ApiReview>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
