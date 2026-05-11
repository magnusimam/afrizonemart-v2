/** @type {import('next').NextConfig} */
const nextConfig = {
  // 2026-05-08 incident: `isomorphic-dompurify` was replaced with
  // `sanitize-html` after `@exodus/bytes` (transitive of jsdom →
  // html-encoding-sniffer → isomorphic-dompurify) flipped to ESM-only
  // and started 500'ing every /product/<slug> render. `sanitize-html`
  // is pure CJS with no jsdom dependency. The Sentry/Prisma entries
  // below stay defensively — they were precautionary in #36 and don't
  // hurt to keep. Don't remove them without re-testing /product on a
  // Vercel preview.
  experimental: {
    serverComponentsExternalPackages: [
      '@sentry/nextjs',
      '@sentry/node',
      '@prisma/instrumentation',
      '@opentelemetry/instrumentation',
    ],
  },
  images: {
    // 2026-05-09: re-enabled the Vercel image optimizer. The earlier
    // `unoptimized: true` was a workaround for Cloudflare Bot Fight
    // Mode blocking the optimizer's outbound fetch to
    // `images.afrizonemart.com` — BFM is now disabled (or has a
    // bypass rule) for that hostname. With the optimizer back on,
    // every <Image> serves WebP/AVIF at the right viewport size and
    // is cached at the Vercel edge, instead of every visitor pulling
    // the original R2 file. Expect a 70–90% drop in image bytes per
    // pageview.
    //
    // **Rollback if BFM blocks optimizer fetches again** (symptom:
    // every <Image> 500s or returns blank): re-add `unoptimized: true`
    // here and redeploy. The `remotePatterns` list below stays
    // valid either way.
    //
    // Conservative cache TTL — Vercel caches optimized variants for
    // this long before re-fetching from R2. R2 itself returns
    // `Cache-Control: max-age=31536000, immutable` so re-fetch is
    // cheap when it does happen.
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
      // Local API uploads (dev).
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
      // Phase 11.3 (audit M9): production image hosts. The `**.r2.dev`
      // wildcard was removed — it allowed images from any Cloudflare R2
      // bucket on the planet, so an attacker who controls any bucket
      // could serve content as our `<Image>` source. The custom domain
      // images.afrizonemart.com has been live since 2026-05-01 (apex
      // cutover), so the wildcard is no longer needed.
      { protocol: 'https', hostname: 'images.afrizonemart.com' },
      { protocol: 'https', hostname: 'api.afrizonemart.com', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
