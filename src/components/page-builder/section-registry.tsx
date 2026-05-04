import type { ApiPageSection } from '@/lib/api/page-builder';
import { BuilderHeroSection } from './sections/BuilderHeroSection';
import { BuilderProductGridSection } from './sections/BuilderProductGridSection';
import { BuilderCategoryShelfSection } from './sections/BuilderCategoryShelfSection';
import { BuilderImageBannerSection } from './sections/BuilderImageBannerSection';
import { BuilderRichTextSection } from './sections/BuilderRichTextSection';
import { BuilderAfricaMapSection } from './sections/BuilderAfricaMapSection';
import { BuilderNewsletterSection } from './sections/BuilderNewsletterSection';
import { BuilderTrustBarSection } from './sections/BuilderTrustBarSection';
import { BuilderQuotationFormSection } from './sections/BuilderQuotationFormSection';
import { BuilderCountryShelfSection } from './sections/BuilderCountryShelfSection';
import { BuilderFeatureCardsSection } from './sections/BuilderFeatureCardsSection';
import { BuilderServicesGridSection } from './sections/BuilderServicesGridSection';
import { BuilderTextStripSection } from './sections/BuilderTextStripSection';
import { BuilderRewardsTiersSection } from './sections/BuilderRewardsTiersSection';
import { BuilderCtaCardsSection } from './sections/BuilderCtaCardsSection';
import { BuilderMarqueeStripSection } from './sections/BuilderMarqueeStripSection';
import { BuilderFinalCtaSection } from './sections/BuilderFinalCtaSection';

/**
 * Maps section type discriminators to their renderer components. Adding
 * a new section type means: (1) add its config schema in the API
 * (section-types.ts), (2) add a renderer here, (3) add an editor in
 * the admin builder.
 *
 * Returning null for an unknown type is intentional — keeps a stale
 * client safe when the API ships a new section type before the
 * frontend redeploys.
 */
export function renderSection(section: ApiPageSection): React.ReactNode {
  switch (section.type) {
    case 'hero':
      return <BuilderHeroSection section={section} />;
    case 'product-grid':
      return <BuilderProductGridSection section={section} />;
    case 'category-shelf':
      return <BuilderCategoryShelfSection section={section} />;
    case 'image-banner':
      return <BuilderImageBannerSection section={section} />;
    case 'rich-text':
      return <BuilderRichTextSection section={section} />;
    case 'africa-map':
      return <BuilderAfricaMapSection section={section} />;
    case 'newsletter':
      return <BuilderNewsletterSection />;
    case 'trust-bar':
      return <BuilderTrustBarSection />;
    case 'quotation-form':
      return <BuilderQuotationFormSection />;
    case 'country-shelf':
      return <BuilderCountryShelfSection section={section} />;
    case 'feature-cards':
      return <BuilderFeatureCardsSection section={section} />;
    case 'services-grid':
      return <BuilderServicesGridSection section={section} />;
    case 'text-strip':
      return <BuilderTextStripSection section={section} />;
    case 'rewards-tiers':
      return <BuilderRewardsTiersSection section={section} />;
    case 'cta-cards':
      return <BuilderCtaCardsSection section={section} />;
    case 'marquee-strip':
      return <BuilderMarqueeStripSection section={section} />;
    case 'final-cta':
      return <BuilderFinalCtaSection section={section} />;
    default:
      return null;
  }
}

/// Shared helper — converts an accent color (hex or palette key) to the
/// CSS color that the renderer applies to the section's heading bar.
/// Palette keys map to brand tokens; raw hex passes through. Defaults
/// to the brand amber when null/empty.
export function resolveAccentColor(accent: string | null | undefined): string {
  if (!accent) return 'var(--color-amber, #F5A623)';
  if (accent.startsWith('#')) return accent;
  const map: Record<string, string> = {
    navy: 'var(--color-navy, #0D1F4E)',
    amber: 'var(--color-amber, #F5A623)',
    success: 'var(--color-success, #10B981)',
    danger: 'var(--color-danger, #EF4444)',
    info: 'var(--color-info, #3B82F6)',
    charcoal: 'var(--color-charcoal, #1F2937)',
    muted: 'var(--color-muted, #6B7280)',
  };
  return map[accent] ?? 'var(--color-amber, #F5A623)';
}
