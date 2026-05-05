import { fetchProduct, ApiError } from '@/lib/api/products';
import type { ApiProduct, ApiReview } from '@/lib/api/types';

export interface ProductBundle {
  units: number;
  label: string;
  price: number;
  comparePrice: number;
  savings?: number;
  popular?: boolean;
}

export type FeatureIcon = 'sparkles' | 'leaf' | 'globe' | 'shield' | 'heart' | 'check' | 'gem';

export interface ProductFeature {
  icon: FeatureIcon;
  text: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductReview {
  id: string;
  author: string;
  country: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

export interface ProductDetail {
  slug: string;
  name: string;
  brand: string;
  category: { name: string; slug: string };
  origin: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  shortDescription: string;
  longDescription: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  variants?: { type: string; options: string[]; default: string };
  bundles: ProductBundle[];
  features: ProductFeature[];
  specifications: ProductSpec[];
  shipping: string;
  ingredients?: string;
  images: ProductImage[];
  aboutTitle: string;
  aboutBody: string;
  aboutImage: string;
  reviews: ProductReview[];
  // Raw attributes JSON — includes both legacy (bundles/features/specs) and
  // custom-field values (anything authored from /admin/custom-fields).
  // The product page reads custom-field values via this object.
  attributes: Record<string, unknown>;
}

const STANDARD_SHIPPING =
  'Free shipping on orders over NGN10,000. Delivers in 1-3 hours within Lagos, 24-48 hours nationwide, and 5-10 business days internationally. 30-day no-questions-asked returns.';

const FALLBACK_IMAGE = '/images/featured/for-her.jpg';

function formatRelativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk} week${wk === 1 ? '' : 's'} ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const yr = Math.floor(day / 365);
  return `${yr} year${yr === 1 ? '' : 's'} ago`;
}

function reviewFromApi(r: ApiReview): ProductReview {
  return {
    id: r.id,
    author: r.authorName,
    country: r.authorCountry ?? '',
    rating: r.rating,
    date: formatRelativeDate(r.createdAt),
    title: r.title ?? '',
    body: r.body,
    verified: r.verified,
  };
}

function imagesFromApi(api: ApiProduct): ProductImage[] {
  // SEO-rich alt text: name + brand + category + origin + Afrizonemart.
  // Lifts ranking in Google Image Search vs the bare product name.
  const baseParts: string[] = [api.name];
  if (api.brand) baseParts.push(`by ${api.brand}`);
  if (api.category?.name && api.origin) {
    baseParts.push(`${api.category.name} from ${api.origin}`);
  } else if (api.category?.name) {
    baseParts.push(api.category.name);
  } else if (api.origin) {
    baseParts.push(`from ${api.origin}`);
  }
  baseParts.push('Afrizonemart');
  const baseAlt = baseParts.join(' — ');

  if (api.images.length === 0) {
    return [{ src: FALLBACK_IMAGE, alt: baseAlt }];
  }
  return api.images.map((src, i) => {
    // Prefer intern-curated alt text when present — humans describe the
    // specific image better than our generated string. Fall back to the
    // auto-generated SEO string when the alt is missing/blank.
    const curated = api.imageAlts?.[i]?.trim();
    if (curated) return { src, alt: curated };
    return {
      src,
      alt: i === 0 ? baseAlt : `${baseAlt} — view ${i + 1}`,
    };
  });
}

export async function loadProductDetail(
  slug: string,
): Promise<ProductDetail | null> {
  try {
    const api = await fetchProduct(slug);
    const compare = api.comparePrice ?? undefined;
    // Imported / partially-filled products won't have the legacy
    // bundles/features/specs/about keys. Default everything so the page
    // can render without exploding.
    const a = (api.attributes ?? {}) as Partial<{
      bundles: ProductBundle[];
      features: ProductFeature[];
      specifications: ProductSpec[];
      variants: { type: string; options: string[]; default: string };
      aboutTitle: string;
      aboutBody: string;
      aboutImage: string;
    }>;
    const aboutBody = a.aboutBody ?? '';

    return {
      slug: api.slug,
      name: api.name,
      brand: api.brand ?? 'Afrizonemart',
      category: {
        name: api.category?.name ?? 'Shop',
        slug: api.category?.slug ?? '',
      },
      origin: api.origin ?? 'NG',
      rating: api.rating,
      reviewCount: api.reviewCount,
      inStock: api.inStock,
      shortDescription: api.shortDescription ?? aboutBody.slice(0, 160),
      longDescription: api.description ?? aboutBody,
      price: api.price,
      comparePrice: compare,
      discountPercent: api.discountPercent ?? undefined,
      variants: a.variants,
      bundles: a.bundles ?? [],
      features: a.features ?? [],
      specifications: a.specifications ?? [],
      shipping: STANDARD_SHIPPING,
      ingredients: api.ingredients ?? undefined,
      images: imagesFromApi(api),
      aboutTitle: a.aboutTitle ?? api.name,
      aboutBody,
      aboutImage: a.aboutImage ?? '/images/featured/for-her.jpg',
      reviews: (api.reviews ?? []).map(reviewFromApi),
      attributes: (api.attributes ?? {}) as unknown as Record<string, unknown>,
    };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  origin?: string;
}

export function getRelatedProducts(currentSlug: string): RelatedProduct[] {
  const all: RelatedProduct[] = [
    { id: 'r1', slug: 'tara-half-dual-powder', name: 'Tara Half-Dual Powder Palette', price: 4500, origin: 'EG' },
    { id: 'r2', slug: 'bi-bi-doll-browpencil', name: 'Bi Bi Doll Browpencil', price: 800, origin: 'NG' },
    { id: 'r3', slug: 'opera-silky-pressed', name: 'Opera Silky Pressed Powder', price: 3500, origin: 'KE' },
    { id: 'r4', slug: 'tara-bronzer', name: 'Tara Bronzer', price: 3200, comparePrice: 4000, discountPercent: 20, origin: 'EG' },
    { id: 'r5', slug: 'snow-foundation', name: 'Snow Total Coverage Foundation', price: 4800, origin: 'ZA' },
    { id: 'r6', slug: 'fanda-lipstick', name: 'Fanda Lipstick', price: 1000, origin: 'NG' },
  ];
  return all.filter((p) => p.slug !== currentSlug);
}
