import type { Metadata } from 'next';
import { Raleway } from 'next/font/google';
import { headers } from 'next/headers';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';
import { CartSyncProvider } from '@/components/providers/CartSyncProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { GeoProvider } from '@/components/providers/GeoProvider';
import { GoogleTranslate } from '@/components/providers/GoogleTranslate';
import {
  GoogleTagManagerHead,
  GoogleTagManagerNoScript,
} from '@/components/providers/GoogleTagManager';
import { GeoBanner } from '@/components/common/GeoBanner';
import { ConfigWatchdog } from '@/components/common/ConfigWatchdog';
import { SiteJsonLd } from '@/components/seo/SiteJsonLd';
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_OG_IMAGE,
  SITE_DEFAULT_TITLE,
  SITE_NAME,
  SITE_TWITTER,
  SITE_URL,
} from '@/lib/seo';
import './globals.css';

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-raleway',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_DEFAULT_TITLE,
    // Per-page templates: every page that sets a title gets it
    // appended with " | Afrizonemart" automatically.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  generator: 'Next.js',
  keywords: [
    'African marketplace',
    'made in Africa',
    'African products',
    'African fashion',
    'African beauty',
    'African groceries',
    'African home goods',
    'pan-African e-commerce',
    'Afrizonemart',
  ],
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: '/',
    languages: {
      en: SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [
      {
        url: SITE_DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_DEFAULT_TITLE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [SITE_DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  // Icons are picked up from app/icon.png and app/apple-icon.png via
  // Next.js' file-based convention — no manual config needed. Adding
  // entries here would duplicate the <link> tags in <head>.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = headers();
  const country = h.get('x-azm-country') ?? 'NG';
  const currency = h.get('x-azm-currency') ?? 'NGN';

  return (
    <html lang="en" className={raleway.variable}>
      <head>
        <GoogleTagManagerHead />
        <SiteJsonLd />
      </head>
      <body className="bg-page font-sans text-charcoal antialiased">
        <GoogleTagManagerNoScript />
        <AnalyticsProvider>
          <QueryProvider>
            <GeoProvider initialCountry={country} initialCurrency={currency}>
              <CartSyncProvider>
                <GeoBanner />
                {/* 2026-05-16 — surfaces missing NEXT_PUBLIC_* env
                    vars as a loud banner. Drops a Sentry alert on
                    first render if anything required is empty. See
                    `lib/public-env.ts` for the registry. */}
                <ConfigWatchdog />
                {children}
                <GoogleTranslate />
              </CartSyncProvider>
            </GeoProvider>
          </QueryProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
