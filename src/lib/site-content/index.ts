/**
 * Site-content reader — server-side helpers that fetch admin overrides
 * from the API and return typed values. Each helper accepts a default
 * so a missing/clearned override falls back to the component-hardcoded
 * value. Designed for use inside server components and route handlers.
 *
 * Usage:
 *   const c = await fetchSiteContent();
 *   const text = c.getText('content.home.satisfactionStrip.text', 'For Your Ultimate Satisfaction');
 *   const slides = c.getImageList('content.home.hero.slides', DEFAULT_SLIDES);
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ImageWithAlt {
  url: string;
  alt: string;
  /// Optional deep-link target. Same path conventions as web
  /// routes (`/product/<slug>`, `/shop/<cat>`, `/shop/country/<slug>`,
  /// `/supplier`, or `https://...` for external). Mobile parses
  /// internally; storefront can route via Next.js Link when set.
  link?: string;
  /// Optional featured-product slugs to overlay on the slide as
  /// floating cards. Used by **category-page heroes only** today;
  /// home heroes ignore this so Home stays editorial. Cap of 2
  /// cards per slide is enforced in the mobile renderer.
  products?: string[];
}

export interface SiteContent {
  getText(key: string, fallback: string): string;
  getLongText(key: string, fallback: string): string;
  getNumber(key: string, fallback: number): number;
  getBoolean(key: string, fallback: boolean): boolean;
  getImage(key: string, fallback: { url: string }): { url: string };
  getImageWithAlt(key: string, fallback: ImageWithAlt): ImageWithAlt;
  getImageList(key: string, fallback: ImageWithAlt[]): ImageWithAlt[];
  /// Raw access for unusual shapes (escape hatch).
  getRaw(key: string): unknown;
}

function makeReader(overrides: Record<string, unknown>): SiteContent {
  const get = <T>(key: string, fallback: T, validate: (v: unknown) => v is T): T => {
    const v = overrides[key];
    if (v === undefined || v === null) return fallback;
    return validate(v) ? v : fallback;
  };
  return {
    getText: (k, f) => get(k, f, (v): v is string => typeof v === 'string'),
    getLongText: (k, f) => get(k, f, (v): v is string => typeof v === 'string'),
    getNumber: (k, f) =>
      get(k, f, (v): v is number => typeof v === 'number' && Number.isFinite(v)),
    getBoolean: (k, f) => get(k, f, (v): v is boolean => typeof v === 'boolean'),
    getImage: (k, f) =>
      get(k, f, (v): v is { url: string } => {
        return typeof v === 'object' && v !== null && typeof (v as { url?: unknown }).url === 'string';
      }),
    getImageWithAlt: (k, f) =>
      get(k, f, (v): v is ImageWithAlt => {
        return (
          typeof v === 'object' &&
          v !== null &&
          typeof (v as { url?: unknown }).url === 'string' &&
          typeof (v as { alt?: unknown }).alt === 'string'
        );
      }),
    getImageList: (k, f) =>
      get(k, f, (v): v is ImageWithAlt[] => {
        return (
          Array.isArray(v) &&
          v.every(
            (it) =>
              typeof it === 'object' &&
              it !== null &&
              typeof it.url === 'string' &&
              typeof it.alt === 'string' &&
              (it.link === undefined || typeof it.link === 'string'),
          )
        );
      }),
    getRaw: (k) => overrides[k],
  };
}

/**
 * Fetch all admin overrides. Called once per server-render at the page
 * level — the returned reader is then passed down to components that
 * need it. Failure modes (API down, network blip) return an empty
 * override map so the page falls back to defaults.
 */
export async function fetchSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_BASE}/api/content`, {
      // 30s s-maxage on the API; we don't double-cache here so admin
      // saves are visible quickly across the site.
      cache: 'no-store',
    });
    if (!res.ok) return makeReader({});
    const data = (await res.json()) as { overrides?: Record<string, unknown> };
    return makeReader(data.overrides ?? {});
  } catch {
    return makeReader({});
  }
}
