import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { COUNTRIES, COUNTRY_CODES } from '@/lib/countries';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Dynamic sitemap — Next 14 reads this file at request time and
 * serves /sitemap.xml. Includes:
 *   • static marketing/help pages
 *   • every category (from /api/categories)
 *   • every product (paginates /api/products)
 *   • every published CMS page (from /api/pages)
 *   • country-specific shop pages
 *
 * Image-sitemap entries live at /sitemap-images.xml — see image-sitemap.ts.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [];
  const now = new Date();

  // 1. Static marketing pages
  const staticPages: Array<{ path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }> = [
    { path: '', priority: 1.0, freq: 'daily' },
    { path: '/shop', priority: 0.9, freq: 'daily' },
    { path: '/new-arrivals', priority: 0.9, freq: 'daily' },
    { path: '/deals', priority: 0.9, freq: 'daily' },
    { path: '/special-discount', priority: 0.8, freq: 'daily' },
    { path: '/continental-rewards', priority: 0.7, freq: 'weekly' },
    // NOTE: /login + /register are intentionally NOT listed — robots.ts
    // disallows them, so submitting them would trip Search Console's
    // "Submitted URL blocked by robots.txt" warning. /search is also
    // left out: it's an internal results page (thin/duplicate content
    // Google discourages indexing) — it stays crawlable but unsubmitted.
  ];
  for (const p of staticPages) {
    out.push({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    });
  }

  // 2. Categories — pulled live so a newly-added category appears
  //    in the sitemap on the next request.
  try {
    const r = await fetch(`${API_BASE}/api/categories`, { next: { revalidate: 600 } });
    if (r.ok) {
      const data = (await r.json()) as { items: Array<{ slug: string }> };
      for (const c of data.items) {
        out.push({
          url: `${SITE_URL}/shop/${c.slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {
    /* sitemap survives if API is unreachable */
  }

  // 3. Country shop pages — pulled straight from /lib/countries.ts so
  //    new African nations land in the sitemap automatically. Also add
  //    the /shop/countries directory itself.
  out.push({
    url: `${SITE_URL}/shop/countries`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  });
  for (const code of COUNTRY_CODES) {
    out.push({
      url: `${SITE_URL}/shop/country/${COUNTRIES[code].slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  // 4. Products — paginate through the API.
  try {
    let page = 1;
    while (true) {
      const r = await fetch(
        `${API_BASE}/api/products?page=${page}&limit=100`,
        { next: { revalidate: 3600 } },
      );
      if (!r.ok) break;
      const data = (await r.json()) as {
        items: Array<{ slug: string; updatedAt?: string }>;
        pagination?: { pages: number };
      };
      for (const p of data.items) {
        out.push({
          url: `${SITE_URL}/product/${p.slug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
      if (!data.pagination || page >= data.pagination.pages) break;
      page++;
      if (page > 100) break; // safety cap — 10,000 products
    }
  } catch {
    /* fail-soft */
  }

  // 5. Published CMS pages
  try {
    const r = await fetch(`${API_BASE}/api/pages`, { next: { revalidate: 600 } });
    if (r.ok) {
      const data = (await r.json()) as {
        items: Array<{ slug: string; updatedAt?: string; publishedAt?: string }>;
      };
      for (const p of data.items) {
        out.push({
          url: `${SITE_URL}/p/${p.slug}`,
          lastModified: p.updatedAt
            ? new Date(p.updatedAt)
            : p.publishedAt
              ? new Date(p.publishedAt)
              : now,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch {
    /* fail-soft */
  }

  // 6. Blog index + every published post — paginate through /api/blog.
  out.push({
    url: `${SITE_URL}/blog`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  });
  try {
    let page = 1;
    while (true) {
      const r = await fetch(`${API_BASE}/api/blog?page=${page}&limit=50`, {
        next: { revalidate: 600 },
      });
      if (!r.ok) break;
      const data = (await r.json()) as {
        items: Array<{ slug: string; publishedAt?: string | null }>;
        pagination?: { pages: number };
      };
      for (const p of data.items) {
        out.push({
          url: `${SITE_URL}/blog/${p.slug}`,
          lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
      if (!data.pagination || page >= data.pagination.pages) break;
      page++;
      if (page > 50) break; // safety cap — 2,500 posts
    }
  } catch {
    /* fail-soft */
  }

  return out;
}
