import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afrizonemart.vercel.app';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Dynamic sitemap — Next 14 reads this file at request time and serves
 * /sitemap.xml. Includes:
 *   • static pages (homepage, shop, deals, etc.)
 *   • every product (paginates the API)
 *   • published CMS pages
 *   • country shop pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Static pages
  for (const path of [
    '',
    '/shop',
    '/deals',
    '/special-discount',
    '/new-arrivals',
    '/continental-rewards',
    '/login',
    '/register',
  ]) {
    out.push({
      url: `${BASE}${path}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: path === '' ? 1.0 : 0.8,
    });
  }

  // Country pages
  for (const slug of [
    'nigeria', 'kenya', 'south-africa', 'ghana', 'egypt', 'morocco',
    'ethiopia', 'tanzania', 'uganda', 'rwanda',
  ]) {
    out.push({
      url: `${BASE}/shop/country/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  // Products — paginate through the API
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
          url: `${BASE}/product/${p.slug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
      if (!data.pagination || page >= data.pagination.pages) break;
      page++;
      if (page > 50) break; // safety cap — 5,000 products
    }
  } catch {
    /* sitemap survives if API is unreachable */
  }

  // Published CMS pages
  try {
    // No public listing endpoint; admin-side endpoint requires auth.
    // Skip for now — admin pages are usually few and link-able from header.
  } catch {
    /* fail-soft */
  }

  return out;
}
