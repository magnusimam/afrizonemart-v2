import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { loadProductDetail } from '@/lib/products';

/**
 * GET /api/products/[slug]/share-image?variant=og|square&force=1
 *
 * Generates a PNG promotional card for the product, closer to the
 * LARQ Water Bottle reference Magnus shared as the design target.
 *
 * Defaults to `og` (1200×630 landscape) — best for Twitter/Facebook
 * unfurls, WhatsApp link previews, iMessage. `?variant=square`
 * (1080×1080) is available for Instagram Status / WhatsApp Status
 * where portrait/square fits the medium better.
 *
 * Layout principles taken from LARQ:
 *  - Horizon-split backdrop (navy wall + slightly lighter floor).
 *  - **Translucent glass card** on the left (not opaque white) so it
 *    reads as "overlay on the photo" not "modal over a dark page."
 *  - Card is ~65% of frame height, vertically centered, with the
 *    right edge **overlapping the product** by ~30–60px for depth.
 *  - Product is **tall, vertically centered** on the right —
 *    dominates the frame. Soft elliptical drop-shadow grounds it on
 *    the "floor."
 *  - No bottom accent bar — the horizon line is the only bottom
 *    signal, keeping the bottom airy.
 *
 * Render paths:
 *  - Floating (cutout.isOriginal === false): product floats on the
 *    backdrop with the elliptical shadow.
 *  - Inset (cutout.isOriginal === true, Noop fallback): product
 *    sits inside a rounded white frame so the rectangular original
 *    looks intentional, not pasted.
 *
 * Satori gotchas this file works around:
 *  1. Backdrops sized with `flex: X%` collapse → explicit px height.
 *  2. Fragment-wrapped absolute children sometimes drop → single
 *     root <div> per helper.
 *  3. Bundled Inter font has no Naira glyph → "NGN 950" not "₦950".
 */
export const dynamic = 'force-dynamic';

const NAVY = '#000066';
const NAVY_LIGHT = '#1a1a8c';
const NAVY_FLOOR = '#2a2aa3';
const AMBER = '#FBAC34';
const GLASS = 'rgba(255, 255, 255, 0.10)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.22)';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255, 255, 255, 0.78)';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.55)';
const STAR_DIM = 'rgba(255, 255, 255, 0.22)';

function formatPrice(value: number): string {
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

  // Default flipped to landscape (og). Square is opt-in for status
  // formats. Accept any truthy value of variant=square; everything
  // else falls through to og.
  const variant =
    req.nextUrl.searchParams.get('variant') === 'square' ? 'square' : 'og';
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
    description.length > 130 ? `${description.slice(0, 127)}…` : description;
  const truncName =
    product.name.length > 48 ? `${product.name.slice(0, 45)}…` : product.name;

  // Layout — variant-specific dimensions tuned for the LARQ-style
  // composition: card vertically centered, product tall and biased
  // right, card overlapping product by ~30–60px.
  let cardLeft: number;
  let cardTop: number;
  let cardWidth: number;
  let cardHeight: number;
  let productRight: number;
  let productSize: number;
  let productTop: number;
  let nameSize: number;
  let priceSize: number;

  if (variant === 'og') {
    // 1200 × 630
    cardLeft = 60;
    cardWidth = 620;
    cardHeight = 430;
    cardTop = Math.floor((height - cardHeight) / 2);
    productRight = 60;
    productSize = 500;
    productTop = Math.floor((height - productSize) / 2);
    nameSize = 36;
    priceSize = 44;
  } else {
    // 1080 × 1080
    cardLeft = 60;
    cardWidth = 460;
    cardHeight = 600;
    cardTop = Math.floor((height - cardHeight) / 2);
    productRight = 60;
    productSize = 600;
    productTop = Math.floor((height - productSize) / 2);
    nameSize = 38;
    priceSize = 48;
  }

  // Horizon line — 60% of frame height for the "wall" portion.
  const horizonY = Math.floor(height * 0.62);

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
        {/* Backdrop wall (top 62%) — explicit px sizing so satori
            doesn't collapse the flex child. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${horizonY}px`,
            background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
            display: 'flex',
          }}
        />
        {/* Backdrop floor (bottom 38%) */}
        <div
          style={{
            position: 'absolute',
            top: `${horizonY}px`,
            left: 0,
            width: '100%',
            height: `${height - horizonY}px`,
            background: `linear-gradient(180deg, ${NAVY_LIGHT} 0%, ${NAVY_FLOOR} 100%)`,
            display: 'flex',
          }}
        />

        {/* Brand wordmark top-left */}
        <div
          style={{
            position: 'absolute',
            top: 32,
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
              color: TEXT_PRIMARY,
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
            top: 40,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '10px 18px',
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.14)',
            border: `1px solid ${GLASS_BORDER}`,
            color: TEXT_PRIMARY,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          PRODUCT OF {product.origin}
        </div>

        {/* Product image area — rendered BEFORE the card so the
            card z-orders on top (creates the overlap depth). */}
        {productImageSrc ? (
          isFloating ? (
            <FloatingProduct
              src={productImageSrc}
              size={productSize}
              right={productRight}
              top={productTop}
            />
          ) : (
            <InsetProduct
              src={productImageSrc}
              size={productSize}
              right={productRight}
              top={productTop}
            />
          )
        ) : null}

        {/* Translucent glass info card on the left. Z-orders above
            product because of render order — gives the overlap
            depth. */}
        <div
          style={{
            position: 'absolute',
            left: cardLeft,
            top: cardTop,
            width: cardWidth,
            height: cardHeight,
            display: 'flex',
            flexDirection: 'column',
            padding: '34px 34px 30px 34px',
            borderRadius: 22,
            backgroundColor: GLASS,
            border: `1px solid ${GLASS_BORDER}`,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Eyebrow brand */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: TEXT_SECONDARY,
              letterSpacing: 3,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            {product.brand}
          </div>

          {/* Product name */}
          <div
            style={{
              fontSize: nameSize,
              fontWeight: 800,
              color: TEXT_PRIMARY,
              lineHeight: 1.08,
              marginTop: 8,
              marginBottom: 14,
              display: 'flex',
            }}
          >
            {truncName}
          </div>

          {/* Rating row (hidden when no reviews) */}
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
              <div
                style={{
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  display: 'flex',
                }}
              >
                {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()} reviews)
              </div>
            </div>
          ) : null}

          {/* Short description */}
          <div
            style={{
              fontSize: 16,
              color: TEXT_SECONDARY,
              lineHeight: 1.45,
              marginBottom: 18,
              display: 'flex',
            }}
          >
            {truncDesc}
          </div>

          {/* Spacer pushes price + CTA to the bottom of the card */}
          <div style={{ flexGrow: 1, display: 'flex' }} />

          {/* Price row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: priceSize,
                fontWeight: 800,
                color: TEXT_PRIMARY,
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
                  color: TEXT_MUTED,
                  textDecoration: 'line-through',
                  display: 'flex',
                }}
              >
                {comparePriceLabel}
              </div>
            ) : null}
          </div>

          {/* CTA pill + URL */}
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
                fontSize: 17,
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
                color: TEXT_MUTED,
                display: 'flex',
              }}
            >
              {shortUrl}
            </div>
          </div>
        </div>
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
  // Single absolute container = single root div. Image stacks with
  // the shadow as a vertical flex; shadow sits where the product
  // bottom would be, slightly inset.
  const shadowWidth = Math.floor(size * 0.78);
  const shadowHeight = 42;
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
          marginTop: -shadowHeight + 10,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
          display: 'flex',
        }}
      />
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
  const pad = 28;
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
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
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
