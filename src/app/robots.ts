import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Crawlers shouldn't index private surfaces, transactional
        // flows, or API responses — they pollute SERP and can leak
        // session-specific URLs.
        disallow: [
          '/admin',
          '/account',
          '/api',
          '/checkout',
          '/cart',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-images.xml`,
    ],
    // No `host:` — it's a non-standard directive only Yandex ever
    // honored; Googlebot ignores it and Search Console flags it as a
    // "rule ignored" warning. Canonical host is enforced via canonical
    // tags + the apex domain, so it's redundant anyway.
  };
}
