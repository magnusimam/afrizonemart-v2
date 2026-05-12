import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { loadProductDetail } from '@/lib/products';

/**
 * GET /api/products/[slug]/share-image?variant=square|og&force=1
 *
 * Generates a PNG promotional card for the product. Layout takes its
 * cue from the LARQ Water Bottle reference Magnus shared — horizon-
 * split backdrop, frosted-glass info card on the left, product
 * floating on the right with a soft drop-shadow.
 *
 * Two render paths, picked off the cutout response's `isOriginal`:
 *  - Floating (isOriginal:false, real cutout): product floats on the
 *    gradient with a soft elliptical drop-shadow underneath.
 *  - Inset (isOriginal:true, original-image fallback): product sits
 *    inside a rounded white frame so the rectangular original looks
 *    intentional, not pasted onto the backdrop.
 *
 * Variants:
 *  - `square` (default) — 1080×1080 for WhatsApp / IG status / SMS.
 *  - `og`              — 1200×630 for Twitter / Facebook / iMessage.
 *
 * Satori gotchas this file works around (the v1 hit all three):
 *  1. Backdrops sized with `flex: X%` collapse when the flex child
 *     has no children of its own → use explicit `width/height`.
 *  2. Fragment-wrapped absolute children sometimes drop → every
 *     helper returns a single root <div>.
 *  3. The bundled Inter font has no Naira (U+20A6) glyph → display
 *     prices as "NGN 950" not "₦950" until we load Raleway.
 */
export const dynamic = 'force-dynamic';

const NAVY = '#000066';
const NAVY_LIGHT = '#1a1a8c';
const NAVY_FLOOR = '#2a2aa3';
const AMBER = '#FBAC34';
const FROST = 'rgba(255, 255, 255, 0.95)';
const INK = '#2C2C2C';
const MUTED = '#555555';
const STAR_DIM = '#D5D5D5';

function formatPrice(value: number): string {
  // ASCII "NGN" prefix instead of ₦ — Inter (satori's bundled font)
  // doesn't include the Naira glyph, renders as tofu.
  return `NGN ${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

async function fetchCutout(
  slug: string,
  force: boolean,
): Promise<{ url: string; isOriginal: boolean }> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const q = force ? '?force=1' : '';
  try {
    const res = await fetch(
      `${apiBase}/api/share-image/cutout/${encodeURIComponent(slug)}${q}`,
      { cache: 'no-store' },
    );
    if (!res.ok) throw new Error(`cutout fetch ${res.status}`);
    const data = (await res.json()) as { url: string; isOriginal: boolean };
    return { url: data.url, isOriginal: Boolean(data.isOriginal) };
  } catch {
    return { url: '', isOriginal: true };
  }
}

function Stars({ rating }: { rating: number }) {
  // Round to nearest whole star — half-stars are more layout pain
  // than they're worth at this resolution.
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            fontSize: 22,
            color: i < filled ? AMBER : STAR_DIM,
            lineHeight: 1,
            display: 'flex',
          }}
        >
          ★
        </div>
      ))}
    </div>
  );
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
  const force = req.nextUrl.searchParams.get('force') === '1';
  const width = variant === 'og' ? 1200 : 1080;
  const height = variant === 'og' ? 630 : 1080;

  const cutout = await fetchCutout(params.slug, force);
  const productImageSrc = cutout.url || product.images[0]?.src || '';
  const isFloating = !!cutout.url && !cutout.isOriginal;

  const priceLabel = formatPrice(product.price);
  const comparePriceLabel =
    typeof product.comparePrice === 'number' && product.comparePrice > product.price
      ? formatPrice(product.comparePrice)
      : null;

  const shortUrl = `afrizonemart.com/product/${product.slug}`;
  const description =
    product.shortDescription ||
    product.longDescription.replace(/<[^>]+>/g, '').slice(0, 200);
  const truncDesc =
    description.length > 140 ? `${description.slice(0, 137)}…` : description;
  const truncName =
    product.name.length > 52 ? `${product.name.slice(0, 49)}…` : product.name;

  // Variant-specific dimensions.
  const cardLeft = 60;
  const cardTop = variant === 'og' ? 80 : 200;
  const cardWidth = variant === 'og' ? 520 : 500;
  const cardHeight = variant === 'og' ? height - 160 : height - 320;

  const productAreaSize = variant === 'og' ? 440 : 500;
  const productAreaRight = variant === 'og' ? 80 : 80;
  const productAreaTop = variant === 'og' ? 100 : 220;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'sans-serif',
          backgroundColor: NAVY,
        }}
      >
        {/* Backdrop wall (top 62%). Explicit width+height — satori
            collapses flex-only sized divs with no children. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${Math.floor(height * 0.62)}px`,
            background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
            display: 'flex',
          }}
        />
        {/* Backdrop floor (bottom 38%) */}
        <div
          style={{
            position: 'absolute',
            top: `${Math.floor(height * 0.62)}px`,
            left: 0,
            width: '100%',
            height: `${height - Math.floor(height * 0.62)}px`,
            background: `linear-gradient(180deg, ${NAVY_LIGHT} 0%, ${NAVY_FLOOR} 100%)`,
            display: 'flex',
          }}
        />

        {/* Brand wordmark top-left */}
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: AMBER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: NAVY,
              fontSize: 30,
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
              letterSpacing: 2,
              display: 'flex',
            }}
          >
            AFRIZONEMART
          </div>
        </div>

        {/* Origin chip top-right */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '10px 18px',
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          PRODUCT OF {product.origin}
        </div>

        {/* Product image area — single root div per variant */}
        {productImageSrc ? (
          isFloating ? (
            <FloatingProduct
              src={productImageSrc}
              size={productAreaSize}
              right={productAreaRight}
              top={productAreaTop}
            />
          ) : (
            <InsetProduct
              src={productImageSrc}
              size={productAreaSize}
              right={productAreaRight}
              top={productAreaTop}
            />
          )
        ) : null}

        {/* Frosted info card on the left */}
        <div
          style={{
            position: 'absolute',
            left: cardLeft,
            top: cardTop,
            width: cardWidth,
            height: cardHeight,
            display: 'flex',
            flexDirection: 'column',
            padding: '36px 36px 32px 36px',
            borderRadius: 24,
            backgroundColor: FROST,
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Eyebrow brand */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: NAVY,
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: 0.7,
              display: 'flex',
            }}
          >
            {product.brand}
          </div>

          {/* Product name */}
          <div
            style={{
              fontSize: variant === 'og' ? 38 : 44,
              fontWeight: 800,
              color: NAVY,
              lineHeight: 1.1,
              marginTop: 8,
              marginBottom: 14,
              display: 'flex',
            }}
          >
            {truncName}
          </div>

          {/* Rating row */}
          {product.rating > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <Stars rating={product.rating} />
              <div style={{ fontSize: 14, color: MUTED, display: 'flex' }}>
                {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()} reviews)
              </div>
            </div>
          ) : null}

          {/* Short description */}
          <div
            style={{
              fontSize: 16,
              color: INK,
              lineHeight: 1.45,
              marginBottom: 22,
              display: 'flex',
            }}
          >
            {truncDesc}
          </div>

          {/* Spacer to push the price + CTA to the bottom */}
          <div style={{ flexGrow: 1, display: 'flex' }} />

          {/* Price row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: variant === 'og' ? 44 : 52,
                fontWeight: 800,
                color: NAVY,
                display: 'flex',
              }}
            >
              {priceLabel}
            </div>
            {comparePriceLabel ? (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: '#999',
                  textDecoration: 'line-through',
                  display: 'flex',
                }}
              >
                {comparePriceLabel}
              </div>
            ) : null}
          </div>

          {/* CTA + URL */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                padding: '12px 22px',
                borderRadius: 999,
                backgroundColor: AMBER,
                color: NAVY,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 1,
                display: 'flex',
              }}
            >
              SHOP NOW
            </div>
            <div
              style={{
                fontSize: 13,
                color: NAVY,
                opacity: 0.65,
                display: 'flex',
              }}
            >
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
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width,
      height,
      headers: {
        // Short browser cache, longer CDN cache. Use ?force=1 to
        // bust both when testing template changes.
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}

function FloatingProduct({
  src,
  size,
  right,
  top,
}: {
  src: string;
  size: number;
  right: number;
  top: number;
}) {
  const shadowWidth = Math.floor(size * 0.78);
  const shadowHeight = 48;
  const shadowOffsetFromTop = top + size - 24;

  // Single root div wrapping shadow + image. Satori is more reliable
  // with a single absolute container than two siblings or a Fragment.
  return (
    <div
      style={{
        position: 'absolute',
        right,
        top,
        width: size,
        height: size + shadowHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{
          objectFit: 'contain',
          width: size,
          height: size,
        }}
      />
      <div
        style={{
          width: shadowWidth,
          height: shadowHeight,
          marginTop: -shadowHeight + 12,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
          display: 'flex',
        }}
      />
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {shadowOffsetFromTop > 0 ? null : null}
    </div>
  );
}

function InsetProduct({
  src,
  size,
  right,
  top,
}: {
  src: string;
  size: number;
  right: number;
  top: number;
}) {
  const pad = 32;
  return (
    <div
      style={{
        position: 'absolute',
        right,
        top,
        width: size,
        height: size,
        backgroundColor: 'white',
        borderRadius: 24,
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.35)',
        padding: pad,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size - pad * 2}
        height={size - pad * 2}
        style={{
          objectFit: 'contain',
          width: size - pad * 2,
          height: size - pad * 2,
        }}
      />
    </div>
  );
}
