import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';

/**
 * Site-wide structured data — emits Organization + WebSite JSON-LD on
 * every page. The `WebSite` payload includes a `SearchAction` so
 * Google can show a sitelinks search box for the brand in SERP.
 */
export function SiteJsonLd() {
  const json = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: SITE_DEFAULT_OG_IMAGE,
        description: SITE_DEFAULT_DESCRIPTION,
        sameAs: [
          // Slot in real social URLs as they get verified.
          'https://www.facebook.com/afrizonemart',
          'https://www.instagram.com/afrizonemart',
          'https://twitter.com/afrizonemart',
          'https://www.linkedin.com/company/afrizonemart',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'support@afrizonemart.com',
          areaServed: 'Worldwide',
          availableLanguage: ['en', 'fr', 'ar', 'sw'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DEFAULT_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
