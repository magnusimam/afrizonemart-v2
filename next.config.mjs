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
      // Production image hosts:
      //  - images.afrizonemart.com — custom R2 domain (preferred)
      //  - *.r2.dev               — fallback while custom domain is propagating
      //  - api.afrizonemart.com   — for any /uploads/* assets that linger from dev seed data
      { protocol: 'https', hostname: 'images.afrizonemart.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'api.afrizonemart.com', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
