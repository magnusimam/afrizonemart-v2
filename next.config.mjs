/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare's Bot Fight Mode blocks server-side fetches from
    // Next.js's image-optimizer (node-fetch UA). Until BFM is disabled
    // for images.afrizonemart.com, skip the optimizer and let the
    // browser fetch the original. R2 already returns a sensible
    // Cache-Control: public, max-age=31536000, immutable.
    unoptimized: true,
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
