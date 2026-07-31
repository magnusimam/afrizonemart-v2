import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-ECESDVVKS8';

/**
 * Google Analytics 4 (gtag.js) — direct GA4 tag, separate from Google
 * Tag Manager (`GoogleTagManager.tsx`). GTM already owns the
 * `dataLayer` for marketing tags (Google Ads, Meta Pixel, TikTok
 * Pixel); this loads GA4's own script + config exactly as Google's
 * "Global site tag" install snippet specifies. Product analytics
 * (funnel events) still goes through PostHog via `<AnalyticsProvider>`
 * — GA4 here is pageview/traffic reporting only.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
          `.trim(),
        }}
      />
    </>
  );
}
