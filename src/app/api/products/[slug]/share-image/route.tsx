import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { loadProductDetail } from '@/lib/products';

/**
 * GET /api/products/[slug]/share-image?variant=square|og
 *
 * Generates a PNG promotional card for the product, suitable for
 * sharing in messaging apps, IG/WhatsApp status, Twitter, etc.
 *
 * Compositing happens here in the storefront via @vercel/og (satori +
 * resvg) — Vercel infra is purpose-built for this and keeps the
 * memory-heavier image work off the Railway API node.
 *
 * The cutout (the transparent-background version of the product
 * photo) is fetched from the API's `/api/share-image/cutout/:slug`
 * endpoint, which caches in R2. When no AI provider is configured
 * the API falls back to the original image URL — the card still
 * renders; it just shows the product against its original
 * background instead of floating cleanly.
 *
 * Variants:
 *  - `square` (default) — 1080×1080 for WhatsApp / IG status / SMS.
 *  - `og`              — 1200×630 for Twitter / Facebook / iMessage
 *    OG preview unfurls.
 *
 * The route is intentionally Node runtime (default), not Edge:
 *  - `loadProductDetail` calls `axios` deep in the chain.
 *  - We want the same env / Sentry context as the rest of the app.
 *  - @vercel/og runs fine on Node.
 */
export const dynamic = 'force-dynamic';

const NAVY = '#000066';
const AMBER = '#FBAC34';
const WHITE_FROST = 'rgba(255, 255, 255, 0.92)';

function formatPrice(value: number): string {
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

async function fetchCutout(slug: string): Promise<{ url: string; isOriginal: boolean }> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiBase}/api/share-image/cutout/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`cutout fetch ${res.status}`);
    const data = (await res.json()) as { url: string; isOriginal: boolean };
    return { url: data.url, isOriginal: Boolean(data.isOriginal) };
  } catch {
    return { url: '', isOriginal: true };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const product = await loadProductDetail(params.slug);
  if (!product) {
    return new Response('Product not found', { status: 404 });
  }

  const variant = req.nextUrl.searchParams.get('variant') === 'og' ? 'og' : 'square';
  const width = variant === 'og' ? 1200 : 1080;
  const height = variant === 'og' ? 630 : 1080;

  const cutout = await fetchCutout(params.slug);
  const productImageSrc =
    cutout.url || product.images[0]?.src || '';

  const priceLabel = formatPrice(product.price);
  const comparePriceLabel =
    typeof product.comparePrice === 'number' && product.comparePrice > product.price
      ? formatPrice(product.comparePrice)
      : null;

  const shortUrl = `afrizonemart.com/product/${product.slug}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: `linear-gradient(135deg, ${NAVY} 0%, #1a1a8c 100%)`,
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand wordmark */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: AMBER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: NAVY,
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div
            style={{
              color: 'white',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            AFRIZONEMART
          </div>
        </div>

        {/* Product image — floats over the backdrop on the right side. */}
        {productImageSrc ? (
          <div
            style={{
              position: 'absolute',
              right: variant === 'og' ? 60 : 80,
              top: variant === 'og' ? 80 : 160,
              width: variant === 'og' ? 480 : 720,
              height: variant === 'og' ? 480 : 720,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImageSrc}
              alt=""
              width={variant === 'og' ? 480 : 720}
              height={variant === 'og' ? 480 : 720}
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : null}

        {/* Frosted info card */}
        <div
          style={{
            position: 'absolute',
            left: 56,
            bottom: 56,
            width: variant === 'og' ? 560 : 600,
            display: 'flex',
            flexDirection: 'column',
            padding: '36px 40px',
            borderRadius: 24,
            backgroundColor: WHITE_FROST,
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.25)',
          }}
        >
          {product.brand ? (
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: NAVY,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {product.brand}
            </div>
          ) : null}
          <div
            style={{
              fontSize: variant === 'og' ? 44 : 56,
              fontWeight: 800,
              color: NAVY,
              lineHeight: 1.1,
              marginBottom: 18,
              display: 'flex',
            }}
          >
            {product.name.length > 60
              ? `${product.name.slice(0, 57)}…`
              : product.name}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: variant === 'og' ? 52 : 64,
                fontWeight: 800,
                color: NAVY,
              }}
            >
              {priceLabel}
            </div>
            {comparePriceLabel ? (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  color: '#888',
                  textDecoration: 'line-through',
                }}
              >
                {comparePriceLabel}
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 14,
            }}
          >
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                backgroundColor: AMBER,
                color: NAVY,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Shop now
            </div>
            <div style={{ fontSize: 18, color: NAVY, opacity: 0.7 }}>
              {shortUrl}
            </div>
          </div>
        </div>

        {/* Amber accent bar bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: 8,
            backgroundColor: AMBER,
          }}
        />
      </div>
    ),
    {
      width,
      height,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
