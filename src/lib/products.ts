import { fetchProduct, fetchProducts, ApiError } from '@/lib/api/products';
import type { ApiProduct, ApiReview } from '@/lib/api/types';

export interface ProductBundle {
  /// Tracker #45 — real ProductVariant.id from the API. Sent to the
  /// cart endpoint when the customer adds this bundle. Optional only
  /// for safety during the migration; loadProductDetail always
  /// populates it now.
  variantId?: string;
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
  /// Tracker #45 — id of the product's default variant. Used as the
  /// productVariantId when the PDP has no bundle selector (single
  /// SKU products).
  defaultVariantId?: string;
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
  /// Alt text for the about-brand image. Null when using the legacy
  /// auto-fallback so the consumer can build something sensible.
  aboutImageAlt: string | null;
  reviews: ProductReview[];
  // Raw attributes JSON — includes both legacy (bundles/features/specs) and
  // custom-field values (anything authored from /admin/custom-fields).
  // The product page reads custom-field values via this object.
  attributes: Record<string, unknown>;
}

const STANDARD_SHIPPING =
  'Free shipping on orders over NGN10,000. Delivers in 1-3 hours within Lagos, 24-48 hours nationwide, and 5-10 business days internationally.';

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

/// Tracker #45 — build the PDP bundle selector from the variants the
/// API returned. Returns null when the product has no variants at all;
/// the caller falls back to the legacy attributes.bundles JSON in
/// that case so freshly-imported products still render.
///
/// We include the default (1-unit) variant alongside any multi-pack
/// variants so customers can always pick the single-unit option
/// instead of being silently forced into the first multi-pack.
function bundlesFromVariants(api: ApiProduct): ProductBundle[] | null {
  const variants = api.variants ?? [];
  if (variants.length === 0) return null;
  return variants
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => {
      const compare = v.comparePriceNgn ?? v.priceNgn;
      const savings =
        compare > v.priceNgn
          ? Math.round(((compare - v.priceNgn) / compare) * 100)
          : undefined;
      return {
        variantId: v.id,
        units: v.unitsPerPack,
        label: v.label,
        price: v.priceNgn,
        comparePrice: compare,
        savings,
      };
    });
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
  return api.images.map((src, i) => ({
    src,
    alt: i === 0 ? baseAlt : `${baseAlt} — view ${i + 1}`,
  }));
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
      /// Tracker #45 — prefer real ProductVariant rows when present.
      /// Falls back to the legacy attributes.bundles JSON for safety
      /// in case a stale deploy hits a freshly-migrated DB.
      bundles: bundlesFromVariants(api) ?? a.bundles ?? [],
      defaultVariantId:
        api.variants?.find((v) => v.isDefault)?.id ??
        api.variants?.[0]?.id,
      features: a.features ?? [],
      specifications: a.specifications ?? [],
      shipping: STANDARD_SHIPPING,
      ingredients: api.ingredients ?? undefined,
      images: imagesFromApi(api),
      aboutTitle: a.aboutTitle ?? api.name,
      aboutBody,
      // Prefer the intern-curated brand logo when present; fall back
      // to the legacy attribute, then the placeholder.
      aboutImage: api.brandImageUrl || a.aboutImage || '/images/featured/for-her.jpg',
      aboutImageAlt: api.brandImageAlt ?? null,
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
  imageSrc?: string;
}

/**
 * Fetch products related to the given slug. "Related" = same category,
 * different product. Falls back to newest products if there's no
 * category match. Returns empty when nothing's available — no fake
 * fallback list. Caller (cart, product page) should hide the section
 * when the array is empty.
 */
export async function getRelatedProducts(
  currentSlug: string,
  limit = 6,
): Promise<RelatedProduct[]> {
  // 1. Look up the current product to learn its category.
  let currentCategorySlug: string | null = null;
  if (currentSlug) {
    try {
      const cur = await fetchProduct(currentSlug);
      currentCategorySlug = cur.category?.slug ?? null;
    } catch {
      // Product not found — fall through to a category-less fetch.
    }
  }

  // 2. Pull a small set from the same category if known, else newest.
  const params = currentCategorySlug
    ? { category: currentCategorySlug, limit: limit + 1, sort: 'newest' as const }
    : { limit: limit + 1, sort: 'newest' as const };

  try {
    const r = await fetchProducts(params);
    return r.items
      .filter((p) => p.slug !== currentSlug)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        comparePrice: p.comparePrice ?? undefined,
        discountPercent: p.discountPercent ?? undefined,
        origin: p.origin ?? undefined,
        imageSrc: p.images?.[0],
      }));
  } catch {
    return [];
  }
}
