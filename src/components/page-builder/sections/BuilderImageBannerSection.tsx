import { BrandBanner } from '@/components/sections/BrandBanner';
import type { ApiPageSection, ImageBannerSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Delegates to the existing BrandBanner component — same full-bleed
/// layout the homepage uses for the "Made in Africa" banner. The admin
/// only owns the image URL + alt text; nothing about the section's
/// shape, sizing, or surrounding spacing changes.
///
/// The richer overlay/CTA features (overlayHeadline, overlayCtaLabel,
/// width modes) are intentionally ignored — those weren't part of the
/// existing BrandBanner design and surfacing them would visually
/// diverge.
export function BuilderImageBannerSection({ section }: Props) {
  const config = section.config as ImageBannerSectionConfig;
  if (!config.imageUrl) return null;
  return <BrandBanner src={config.imageUrl} alt={config.imageAlt} />;
}
