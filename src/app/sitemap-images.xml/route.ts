import { SITE_URL } from '@/lib/seo';

/**
 * Image sitemap — Google's image-sitemap protocol lets Google
 * discover and rank our product images in Google Image Search.
 *
 * One <url> per product, with <image:image> children for every
 * gallery image. This is a separate route from the URL sitemap so
 * it can be referenced explicitly in robots.txt and submitted
 * independently in Search Console.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const revalidate = 3600;

interface ApiCategory {
  name: string;
  slug: string;
}

interface ApiProductLite {
  slug: string;
  name: string;
  brand: string | null;
  origin: string | null;
  images: string[];
  category: ApiCategory | null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function imageTitle(p: ApiProductLite): string {
  const parts: string[] = [p.name];
  if (p.brand) parts.push(`by ${p.brand}`);
  if (p.category?.name) parts.push(p.category.name);
  if (p.origin) parts.push(`from ${p.origin}`);
  parts.push('Afrizonemart');
  return parts.join(' — ');
}

export async function GET() {
  const xmlParts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  try {
    let page = 1;
    while (true) {
      const r = await fetch(
        `${API_BASE}/api/products?page=${page}&limit=100`,
        { next: { revalidate: 3600 } },
      );
      if (!r.ok) break;
      const data = (await r.json()) as {
        items: ApiProductLite[];
        pagination?: { pages: number };
      };
      for (const p of data.items) {
        if (p.images.length === 0) continue;
        const title = escapeXml(imageTitle(p));
        const productUrl = escapeXml(`${SITE_URL}/product/${p.slug}`);
        xmlParts.push(`  <url>`);
        xmlParts.push(`    <loc>${productUrl}</loc>`);
        for (const src of p.images) {
          xmlParts.push(`    <image:image>`);
          xmlParts.push(`      <image:loc>${escapeXml(src)}</image:loc>`);
          xmlParts.push(`      <image:title>${title}</image:title>`);
          xmlParts.push(`      <image:caption>${title}</image:caption>`);
          xmlParts.push(`    </image:image>`);
        }
        xmlParts.push(`  </url>`);
      }
      if (!data.pagination || page >= data.pagination.pages) break;
      page++;
      if (page > 100) break;
    }
  } catch {
    /* fail-soft — return whatever we have */
  }

  xmlParts.push('</urlset>');

  return new Response(xmlParts.join('\n'), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
