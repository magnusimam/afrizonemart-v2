import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { PNG } from 'pngjs';
import { loadProductDetail } from '@/lib/products';
import { SITE_URL } from '@/lib/seo';

/**
 * GET /api/products/[slug]/share-image?variant=og|square&force=1
 *
 * Generates a PNG promotional card for the product, modeled on the
 * LARQ Water Bottle reference Magnus shared as the design target.
 *
 * Defaults to `og` (1200×630 landscape). `?variant=square` available
 * for IG/WhatsApp Status formats. `?force=1` bypasses the cutout
 * R2 cache when re-rendering for testing.
 *
 * Layout principles:
 *  - Horizon-split backdrop (navy wall + product-tinted floor).
 *  - Translucent glass card on the left.
 *  - Card overlaps product by ~30–60px for depth.
 *  - Product floats with elliptical drop-shadow.
 *  - Real Afrizonemart logo top-left (orange Africa + wordmark).
 *  - Floor gradient tinted with the product's own dominant color so
 *    each card feels "lit" by its product (Spotify-style). Top wall
 *    stays brand-anchor navy so the visual identity is consistent.
 *
 * Color extraction approach (Goal B — vibe-matching, not category
 * coding): we ask Cloudflare to downsize the original product image
 * to 1×1 via `cdn-cgi/image/width=1,height=1,fit=cover/…`. Cloudflare's
 * resampler computes the average color across the whole image and
 * gives it back as a one-pixel PNG. We decode that single pixel and
 * use the RGB as a subtle tint on the lower portion of the backdrop
 * gradient. Cost: one extra in-network HTTP fetch (~50ms cold,
 * counted under existing CF Image Transformations free tier of
 * 5k/month). Cached at Vercel's edge for hours alongside the
 * composite PNG, so the second share of the same product within an
 * hour is zero-recompute.
 */
export const dynamic = 'force-dynamic';

const NAVY = '#000066';
const NAVY_LIGHT = '#1a1a8c';
const NAVY_FLOOR_FALLBACK = '#2a2aa3';
const AMBER = '#FBAC34';
const GLASS = 'rgba(255, 255, 255, 0.10)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.22)';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255, 255, 255, 0.78)';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.55)';
const STAR_DIM = 'rgba(255, 255, 255, 0.22)';
const LOGO_URL = `${SITE_URL}/images/logo.png`;

function formatPrice(value: number): string {
  return `NGN ${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

// ISO 2-letter code → full English country name. Falls back to the
// raw code on any failure (region unknown, ICU not bundled, etc.).
const REGION_NAMES = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();

function countryName(code: string): string {
  try {
    return REGION_NAMES?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

// ISO 2-letter code → flag emoji via Unicode regional indicators.
// "NG" → 🇳🇬. Renders to a colored flag SVG via twemoji at
// composite time (see `emoji: 'twemoji'` on the ImageResponse).
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const base = 127397; // 0x1F1E6 - 'A'.charCodeAt(0)
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
    .join('');
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

/**
 * Dominant color extraction via Cloudflare's resampler.
 *
 * Asks CF to downsize the source image to 1×1 with `fit=cover`. The
 * resulting single pixel IS the area-averaged color of the input.
 * Decode that one pixel via pngjs and return RGB.
 *
 * Falls back to null on any failure (network, decode error,
 * transformation domain not on a CF zone). Callers should default
 * to the static navy floor in that case.
 *
 * Uses the original product image, NOT the cutout — the cutout has
 * alpha-transparent regions that pull the average toward zero and
 * produce a muddy result. The original packaging has the colors we
 * actually want to sample.
 */
async function extractDominantColor(
  sourceUrl: string,
): Promise<{ r: number; g: number; b: number } | null> {
  // Only works for sources on the CF zone where Image Transformations
  // is enabled (images.afrizonemart.com). Bail early if not.
  if (!sourceUrl.startsWith('https://images.afrizonemart.com/')) {
    return null;
  }
  const transformUrl = `https://images.afrizonemart.com/cdn-cgi/image/width=1,height=1,fit=cover,format=png/${sourceUrl}`;
  try {
    const res = await fetch(transformUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return await new Promise((resolve) => {
      new PNG().parse(buffer, (err, png) => {
        if (err || !png || !png.data || png.data.length < 3) {
          resolve(null);
          return;
        }
        resolve({ r: png.data[0], g: png.data[1], b: png.data[2] });
      });
    });
  } catch {
    return null;
  }
}

/**
 * Mix a sampled product color with the navy floor.
 *
 * We don't want to use the raw product color (a bright red Dangote
 * pack would give us a bright red floor — bad). We desaturate and
 * darken the sample, then mix with the navy floor at ~35% strength.
 * Result: a subtle warm-or-cool wash on the floor that's still
 * unmistakably navy-family.
 */
function tintedFloor(color: { r: number; g: number; b: number } | null): string {
  if (!color) return NAVY_FLOOR_FALLBACK;
  // Mix navy base (42, 42, 163) with a darkened-desaturated product
  // tint. Bias toward the navy.
  const mixed = {
    r: Math.round(42 * 0.65 + color.r * 0.35 * 0.55),
    g: Math.round(42 * 0.65 + color.g * 0.35 * 0.55),
    b: Math.round(163 * 0.65 + color.b * 0.35 * 0.55),
  };
  return `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`;
}

/** Strip HTML tags + collapse whitespace. */
function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Pick the best description text for the share card. We prefer the
 * shortDescription when it's substantial (≥ 80 chars) because it's
 * usually a curated tagline; otherwise we fall back to the cleaned
 * longDescription for products where the seller only entered a few
 * words in the short field.
 */
function pickDescription(
  shortDescription: string | undefined,
  longDescription: string,
): string {
  const sd = (shortDescription ?? '').trim();
  const ld = plainText(longDescription);
  if (sd.length >= 80) return sd;
  if (ld.length > sd.length) return ld;
  return sd;
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

  const variant =
    req.nextUrl.searchParams.get('variant') === 'square' ? 'square' : 'og';
  const force = req.nextUrl.searchParams.get('force') === '1';
  const width = variant === 'og' ? 1200 : 1080;
  const height = variant === 'og' ? 630 : 1080;

  // Fetch cutout + dominant color in parallel. Both can fail
  // independently and we degrade gracefully.
  const sourceProductImage = product.images[0]?.src ?? '';
  const [cutout, dominantColor] = await Promise.all([
    fetchCutout(params.slug, force),
    sourceProductImage ? extractDominantColor(sourceProductImage) : Promise.resolve(null),
  ]);

  const productImageSrc = cutout.url || sourceProductImage;
  const isFloating = !!cutout.url && !cutout.isOriginal;

  const priceLabel = formatPrice(product.price);
  const comparePriceLabel =
    typeof product.comparePrice === 'number' && product.comparePrice > product.price
      ? formatPrice(product.comparePrice)
      : null;

  const shortUrl = `afrizonemart.com/product/${product.slug}`;
  const description = pickDescription(product.shortDescription, product.longDescription);
  const truncDesc =
    description.length > 160 ? `${description.slice(0, 157)}…` : description;
  const truncName =
    product.name.length > 48 ? `${product.name.slice(0, 45)}…` : product.name;

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
    // 1200 × 630. Card slightly shorter + pushed down to give
    // breathing room below the logo (was almost touching).
    // Width 600 + product right=60 + product width=500 ⇒ ~20px
    // overlap between card right edge and product left edge:
    // enough for the LARQ-style depth without covering the
    // product's important left edge.
    cardLeft = 60;
    cardWidth = 600;
    cardHeight = 400;
    cardTop = 130;
    productRight = 60;
    productSize = 500;
    productTop = Math.floor((height - productSize) / 2);
    nameSize = 36;
    priceSize = 44;
  } else {
    // 1080 × 1080. Card narrower than before (was 460) so it stops
    // covering large parts of tall/narrow products. ~20px overlap
    // preserved for depth.
    cardLeft = 60;
    cardWidth = 380;
    cardHeight = 560;
    cardTop = 260;
    productRight = 60;
    productSize = 600;
    productTop = 240;
    nameSize = 36;
    priceSize = 46;
  }

  const horizonY = Math.floor(height * 0.62);
  const floorEnd = tintedFloor(dominantColor);

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
        {/* Backdrop wall (brand anchor — stays navy regardless of
            product color so the visual identity reads consistently
            across every share card) */}
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
        {/* Backdrop floor — product-tinted bottom. Top of the floor
            stays at NAVY_LIGHT (continuity with the wall); bottom
            shifts toward a desaturated/darkened version of the
            product's dominant color. Subtle on purpose. */}
        <div
          style={{
            position: 'absolute',
            top: `${horizonY}px`,
            left: 0,
            width: '100%',
            height: `${height - horizonY}px`,
            background: `linear-gradient(180deg, ${NAVY_LIGHT} 0%, ${floorEnd} 100%)`,
            display: 'flex',
          }}
        />

        {/* Real Afrizonemart logo top-left, wrapped in a white pill
            so the navy elements of the logo (wordmark, cart) have
            contrast against the navy backdrop. The orange Africa
            silhouette stays visible either way; the white pill
            just rescues the navy bits. */}
        <div
          style={{
            position: 'absolute',
            top: 22,
            left: 48,
            display: 'flex',
            alignItems: 'center',
            padding: '8px 14px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: 14,
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt=""
            width={variant === 'og' ? 220 : 240}
            height={variant === 'og' ? 60 : 66}
            style={{
              width: variant === 'og' ? 220 : 240,
              height: variant === 'og' ? 60 : 66,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Origin chip top-right — full country name + flag */}
        <div
          style={{
            position: 'absolute',
            top: 36,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.14)',
            border: `1px solid ${GLASS_BORDER}`,
            color: TEXT_PRIMARY,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', fontSize: 20 }}>
            {countryFlag(product.origin)}
          </div>
          <div style={{ display: 'flex' }}>
            Made in {countryName(product.origin)}
          </div>
        </div>

        {/* Product image — painted before the card so the card's
            right edge sits visually on top of the product, creating
            depth (no z-index needed; satori paints in DOM order). */}
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

        {/* Translucent glass info card on the left */}
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

          <div style={{ flexGrow: 1, display: 'flex' }} />

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
      // Render flag emoji + any future emoji glyphs via Twitter's
      // open-source SVG set. Without this, `🇳🇬` would render as
      // tofu (the bundled Inter font has no flag glyphs).
      emoji: 'twemoji',
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
