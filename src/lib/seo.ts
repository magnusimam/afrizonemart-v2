/**
 * Centralised SEO constants + helpers. Anything that touches a meta
 * tag, JSON-LD payload, or sitemap entry threads through here so we
 * have one source of truth for site identity, brand, and base URL.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afrizonemart.vercel.app';

export const SITE_NAME = 'Afrizonemart';
export const SITE_TAGLINE = 'Buy Everything Made in Africa';
export const SITE_DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SITE_DEFAULT_DESCRIPTION =
  'Afrizonemart — the marketplace for authentic African-made products: groceries, beauty, fashion, home goods, automobile, and more. Verified by us, delivered worldwide.';
export const SITE_DEFAULT_OG_IMAGE = `${SITE_URL}/images/logo.png`;
export const SITE_TWITTER = '@afrizonemart';

/** Build an absolute URL from a path. */
export function absUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Strip HTML tags + collapse whitespace; clamp to a Google-friendly
 *  description length (155 chars). Safe to feed any free-text product
 *  description into a meta tag. */
export function metaDescription(input: string | null | undefined, fallback = SITE_DEFAULT_DESCRIPTION): string {
  if (!input) return fallback;
  const stripped = input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length <= 155) return stripped || fallback;
  return stripped.slice(0, 152).trimEnd() + '…';
}

/** Build an enriched alt-text string for a product image. Includes
 *  product name + brand + category + origin for image-search ranking
 *  ("Maya Himalaya Facial Scrub — Beauty product from Nigeria — Afrizonemart"). */
export function productImageAlt(p: {
  name: string;
  brand?: string | null;
  origin?: string | null;
  category?: { name?: string | null } | null;
}): string {
  const parts: string[] = [p.name];
  if (p.brand) parts.push(`by ${p.brand}`);
  if (p.category?.name && p.origin) {
    parts.push(`${p.category.name} from ${countryName(p.origin)}`);
  } else if (p.category?.name) {
    parts.push(p.category.name);
  } else if (p.origin) {
    parts.push(`from ${countryName(p.origin)}`);
  }
  parts.push(SITE_NAME);
  return parts.join(' — ');
}

/** ISO-2 → display country name, mirroring the storefront list. */
const COUNTRY_NAMES: Record<string, string> = {
  NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', ZA: 'South Africa',
  EG: 'Egypt', MA: 'Morocco', ET: 'Ethiopia', TZ: 'Tanzania',
  UG: 'Uganda', RW: 'Rwanda', ZW: 'Zimbabwe', CI: "Côte d'Ivoire",
  SN: 'Senegal', CM: 'Cameroon', ML: 'Mali', DZ: 'Algeria',
  TN: 'Tunisia', AO: 'Angola', BW: 'Botswana', NA: 'Namibia',
  MZ: 'Mozambique',
};

function countryName(iso2: string): string {
  return COUNTRY_NAMES[iso2.toUpperCase()] ?? iso2.toUpperCase();
}
