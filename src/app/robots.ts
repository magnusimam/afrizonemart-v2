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
    host: SITE_URL,
  };
}
