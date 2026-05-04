import { fetchBlogPosts } from '@/lib/api/blog';
import { SITE_NAME, SITE_URL, SITE_DEFAULT_DESCRIPTION } from '@/lib/seo';

/// RSS 2.0 feed for the blog. Served at /blog/rss.xml. Cached for an
/// hour — RSS readers expect modest update cadence and we don't want
/// to hammer the API per poll.
export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  const posts = (await fetchBlogPosts({ limit: 30 }))?.items ?? [];

  const items = posts
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.slug}`;
      const pubDate = p.publishedAt
        ? new Date(p.publishedAt).toUTCString()
        : new Date(p.createdAt).toUTCString();
      const description = p.excerpt ?? '';
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${p.authorName ? `<author>noreply@afrizonemart.com (${escapeXml(p.authorName)})</author>` : ''}
      <description>${escapeXml(description)}</description>
      ${p.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(SITE_DEFAULT_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
