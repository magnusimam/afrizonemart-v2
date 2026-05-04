/// Storefront client for the public blog endpoints. Server-side fetch
/// only — uses Next 14 ISR via `next.revalidate` so list/detail pages
/// stay snappy while still picking up admin edits within minutes.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  authorName: string | null;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  tags: string[];
  readingTimeMin: number | null;
  createdAt: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
}

export interface BlogPostList {
  items: BlogPostSummary[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ListBlogPostsParams {
  page?: number;
  limit?: number;
  tag?: string;
  q?: string;
}

function qs(params: ListBlogPostsParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.tag) sp.set('tag', params.tag);
  if (params.q) sp.set('q', params.q);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function fetchBlogPosts(
  params: ListBlogPostsParams = {},
): Promise<BlogPostList | null> {
  try {
    const res = await fetch(`${API_BASE}/api/blog${qs(params)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return (await res.json()) as BlogPostList;
  } catch {
    return null;
  }
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/blog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as BlogPostDetail;
  } catch {
    return null;
  }
}

export async function fetchBlogTags(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/blog/tags`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: string[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}
