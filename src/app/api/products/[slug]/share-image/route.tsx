import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { loadProductDetail } from '@/lib/products';

/**
 * GET /api/products/[slug]/share-image?variant=square|og
 *
 * Generates a PNG promotional card for the product. Layout takes
 * its cue from the LARQ Water Bottle reference Magnus supplied —
 * horizon-split backdrop, frosted-glass info card on the left,
 * product floating on the right with a soft drop-shadow.
 *
 * Two render variants in this file:
 *
 *  - Floating (when the API's cutout endpoint returns
 *    `isOriginal: false`, i.e. background-removed PNG with alpha
 *    channel). Product floats on the gradient with a soft elliptical
 *    shadow underneath, exactly as in the LARQ reference.
 *
 *  - Inset (when `isOriginal: true`, i.e. the API fell back to the
 *    NoopProvider because REMOVE_BG_API_KEY isn't configured).
 *    Product image sits inside a rounded white frame on the right —
 *    the rectangular original looks intentional inside a frame, not
 *    pasted onto the gradient.
 *
 * Either way the frosted card on the left renders the same:
 * brand eyebrow, name, rating, short description, price (with
 * compare-price strike when applicable), amber "Shop now" pill,
 * and short URL footer.
 *
 * Variants:
 *  - `square` (default) — 1080×1080 for WhatsApp / IG status / SMS.
 *  - `og`              — 1200×630 for Twitter / Facebook / iMessage.
 */
export const dynamic = 'force-dynamic';

const NAVY = '#000066';
const NAVY_LIGHT = '#1a1a8c';
const NAVY_FLOOR = '#2a2aa3';
const AMBER = '#FBAC34';
const FROST = 'rgba(255, 255, 255, 0.95)';
const FROST_BORDER = 'rgba(255, 255, 255, 0.7)';
const INK = '#2C2C2C';
const MUTED = '#555555';

function formatPrice(value: number): string {
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
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
  // Round to nearest half star — but for satori we cheat and round to
  // the nearest whole star since rendering half-stars cleanly without
  // SVG paths is more work than it's worth at this scale.
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const stars = Array.from({ length: 5 }, (_, i) => i < filled);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {stars.map((isFilled, i) => (
        <span
          key={i}
          style={{
            fontSize: 22,
            color: isFilled ? AMBER : '#E5E5E5',
            lineHeight: 1,
          }}
        >
          ★
        </span>
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
    description.length > 160 ? `${description.slice(0, 157)}…` : description;
  const truncName =
    product.name.length > 56 ? `${product.name.slice(0, 53)}…` : product.name;

  // Layout dimensions per variant. Square gets the full left/right
  // split LARQ-style; og is wider so we slightly narrow the card.
  const cardWidth = variant === 'og' ? 560 : 520;
  const cardLeft = variant === 'og' ? 60 : 60;
  const cardTop = variant === 'og' ? 80 : 200;
  const cardBottom = variant === 'og' ? 80 : 120;
  const productAreaWidth = variant === 'og' ? 520 : 480;
  const productAreaRight = variant === 'og' ? 60 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Horizon-split backdrop. Top wall darker, bottom floor
            slightly lighter — gives the photo-studio look. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: '0 0 62%',
              background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
              display: 'flex',
            }}
          />
          <div
            style={{
              flex: '1',
              background: `linear-gradient(180deg, ${NAVY_LIGHT} 0%, ${NAVY_FLOOR} 100%)`,
              display: 'flex',
            }}
          />
        </div>

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
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: AMBER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: NAVY,
              fontSize: 28,
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

        {/* Origin chip top-right (e.g. "Made in NG") */}
        <div
          style={{
            position: 'absolute',
            top: 50,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          PRODUCT OF {product.origin}
        </div>

        {/* Right side — product image area */}
        {productImageSrc ? (
          isFloating ? (
            <FloatingProduct
              src={productImageSrc}
              width={productAreaWidth}
              right={productAreaRight}
              variant={variant}
            />
          ) : (
            <InsetProduct
              src={productImageSrc}
              width={productAreaWidth}
              right={productAreaRight}
              variant={variant}
            />
          )
        ) : null}

        {/* Frosted info card on the left, full height */}
        <div
          style={{
            position: 'absolute',
            left: cardLeft,
            top: cardTop,
            bottom: cardBottom,
            width: cardWidth,
            display: 'flex',
            flexDirection: 'column',
            padding: '36px 36px 32px 36px',
            borderRadius: 24,
            backgroundColor: FROST,
            border: `1px solid ${FROST_BORDER}`,
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
              fontSize: variant === 'og' ? 40 : 46,
              fontWeight: 800,
              color: NAVY,
              lineHeight: 1.08,
              marginTop: 10,
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
                marginBottom: 16,
              }}
            >
              <Stars rating={product.rating} />
              <div style={{ fontSize: 14, color: MUTED, display: 'flex' }}>
                {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()} reviews)
              </div>
            </div>
          ) : (
            <div style={{ height: 8, display: 'flex' }} />
          )}

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

          {/* Price row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              marginTop: 'auto',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: variant === 'og' ? 48 : 56,
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
                  fontSize: 24,
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
              marginTop: 18,
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
                fontSize: 14,
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

function FloatingProduct({
  src,
  width,
  right,
  variant,
}: {
  src: string;
  width: number;
  right: number;
  variant: 'square' | 'og';
}) {
  const productSize = width;
  const productTop = variant === 'og' ? 80 : 180;
  // Shadow ellipse sits below the product. Width slightly bigger
  // than the product, height shallow, soft radial fade.
  const shadowWidth = productSize * 0.85;
  const shadowHeight = 60;
  const shadowBottom = variant === 'og' ? 100 : 160;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          right: right + (productSize - shadowWidth) / 2,
          bottom: shadowBottom,
          width: shadowWidth,
          height: shadowHeight,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right,
          top: productTop,
          width: productSize,
          height: productSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={productSize}
          height={productSize}
          style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    </>
  );
}

function InsetProduct({
  src,
  width,
  right,
  variant,
}: {
  src: string;
  width: number;
  right: number;
  variant: 'square' | 'og';
}) {
  const frameSize = width;
  const frameTop = variant === 'og' ? 100 : 220;
  const innerPad = 32;

  return (
    <div
      style={{
        position: 'absolute',
        right,
        top: frameTop,
        width: frameSize,
        height: frameSize,
        backgroundColor: 'white',
        borderRadius: 24,
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.35)',
        padding: innerPad,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={frameSize - innerPad * 2}
        height={frameSize - innerPad * 2}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
