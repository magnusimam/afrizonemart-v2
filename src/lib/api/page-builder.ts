/**
 * Storefront client for the new page-builder API. Distinct from the
 * legacy `categories.ts`/`pages` (CmsPage) clients — this one talks to
 * `/api/site/:slug` and returns typed Section payloads.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Section type discriminator — must match the registry in the API
// (afrizonemart-api/src/modules/pages/section-types.ts).
export type SectionType =
  | 'hero'
  | 'product-grid'
  | 'category-shelf'
  | 'image-banner'
  | 'rich-text'
  | 'africa-map'
  | 'newsletter'
  | 'trust-bar'
  | 'quotation-form'
  | 'country-shelf'
  | 'feature-cards'
  | 'services-grid'
  | 'text-strip'
  | 'rewards-tiers'
  | 'cta-cards'
  | 'marquee-strip'
  | 'final-cta';

export interface HeroSlide {
  imageUrl: string;
  imageAlt: string;
  eyebrow?: string | null;
  headline: string;
  subheadline?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  textAlign?: 'left' | 'center' | 'right' | null;
}

export interface HeroSectionConfig {
  slides: HeroSlide[];
  autoplayMs: number;
  showDots: boolean;
}

export type ProductSource =
  | { kind: 'category'; categorySlug: string }
  | { kind: 'subcategory'; subcategorySlug: string }
  | { kind: 'placement'; placementKey: string }
  | { kind: 'on-sale' }
  | { kind: 'new-arrivals' }
  | { kind: 'manual'; productSlugs: string[] };

export interface ProductGridSectionConfig {
  source: ProductSource;
  columns: number;
  rows: number;
  viewAllHref?: string | null;
  viewAllLabel?: string | null;
}

export interface CategoryShelfSectionConfig {
  categorySlugs: string[];
  layout: 'grid' | 'scroll';
}

export interface ImageBannerSectionConfig {
  imageUrl: string;
  imageAlt: string;
  href?: string | null;
  overlayHeadline?: string | null;
  overlayCtaLabel?: string | null;
  width: 'full' | 'container';
}

export interface RichTextSectionConfig {
  html: string;
  align: 'left' | 'center';
}

export interface AfricaMapSectionConfig {
  headline?: string | null;
  subheadline?: string | null;
}

export interface NewsletterSectionConfig {
  headline: string;
  subheadline?: string | null;
  ctaLabel: string;
}

export interface TrustBarItem {
  icon: string;
  label: string;
  sublabel?: string | null;
}
export interface TrustBarSectionConfig {
  items: TrustBarItem[];
}

export interface QuotationFormSectionConfig {
  headline: string;
  subheadline?: string | null;
}

export interface CountryShelfSectionConfig {
  headline: string;
  countryCodes: string[];
}

export interface FeatureCard {
  imageUrl: string;
  imageAlt: string;
  name: string;
  description?: string | null;
  href: string;
  ctaLabel?: string | null;
}
export interface FeatureCardsSectionConfig {
  cardsPerRow: number;
  cards: FeatureCard[];
}

export interface ServicesGridHeroCard {
  imageUrl: string;
  imageAlt: string;
  href: string;
}
export interface ServicesGridServiceItem {
  icon: string;
  name: string;
  href: string;
}
export interface ServicesGridSectionConfig {
  heroCard?: ServicesGridHeroCard | null;
  services: ServicesGridServiceItem[];
}

export interface TextStripSectionConfig {
  text: string;
  bgColor?: string | null;
}

export interface RewardsTier {
  name: string;
  minPoints: number;
  accentColor?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  intro?: string | null;
  perks: string[];
  readMoreHref?: string | null;
  readMoreLabel?: string | null;
}
export interface RewardsTiersSectionConfig {
  layout: 'ladder' | 'cards';
  tiers: RewardsTier[];
}

export interface CtaCard {
  headline: string;
  subheadline?: string | null;
  href: string;
  background?: string | null;
}
export interface CtaCardsSectionConfig {
  cards: CtaCard[];
}

export interface MarqueeStripSectionConfig {
  items: string[];
  background?: string | null;
  durationSeconds: number;
}

export interface FinalCtaButton {
  label: string;
  href: string;
}
export interface FinalCtaSectionConfig {
  eyebrow?: string | null;
  headline: string;
  body?: string | null;
  background?: string | null;
  primaryCta?: FinalCtaButton | null;
  secondaryCta?: FinalCtaButton | null;
}

export type SectionConfig =
  | HeroSectionConfig
  | ProductGridSectionConfig
  | CategoryShelfSectionConfig
  | ImageBannerSectionConfig
  | RichTextSectionConfig
  | AfricaMapSectionConfig
  | NewsletterSectionConfig
  | TrustBarSectionConfig
  | QuotationFormSectionConfig
  | CountryShelfSectionConfig
  | FeatureCardsSectionConfig
  | ServicesGridSectionConfig
  | TextStripSectionConfig
  | RewardsTiersSectionConfig
  | CtaCardsSectionConfig
  | MarqueeStripSectionConfig
  | FinalCtaSectionConfig;

export interface ApiPageSection {
  id: string;
  type: SectionType;
  position: number;
  visible: boolean;
  headline: string | null;
  subheadline: string | null;
  /// Hex like "#0D1F4E" or palette key (navy/amber/...).
  accentColor: string | null;
  config: SectionConfig;
  startsAt: string | null;
  endsAt: string | null;
  countries: string[];
}

export interface ApiPage {
  slug: string;
  title: string;
  publishedAt: string;
  sections: ApiPageSection[];
}

/**
 * Fetch the published section list for a page slug. Returns null when
 * the page doesn't exist or hasn't been published yet — the caller
 * decides whether to render a fallback or 404.
 *
 * Uses `cache: 'no-store'` so admin Publish/Unpublish takes effect on
 * the next request. The API itself sets a 60s s-maxage so Fastly
 * absorbs the bulk of repeat traffic; only the first request after
 * the cache window expires actually re-resolves.
 */
export async function fetchPage(slug: string): Promise<ApiPage | null> {
  try {
    const res = await fetch(`${API_BASE}/api/site/${slug}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as ApiPage;
  } catch {
    return null;
  }
}
