import { HeroSlider } from '@/components/layout/HeroSlider';
import type { ApiPageSection, HeroSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Renders the page-builder hero by delegating to the existing
/// HeroSlider component — same layout, animation, and styling. The
/// builder only owns the slide content (image + alt text); the visual
/// design stays in HeroSlider so admin edits can never change it.
///
/// We map the builder's richer slide shape down to what HeroSlider
/// expects (src + alt). Headline / CTA / eyebrow fields are intentionally
/// dropped — those weren't in the original design and adding them
/// here would visually diverge.
export function BuilderHeroSection({ section }: Props) {
  const config = section.config as HeroSectionConfig;
  const slides = (config.slides ?? [])
    .filter((s) => s.imageUrl)
    .map((s) => ({ src: s.imageUrl, alt: s.imageAlt }));
  if (slides.length === 0) return <HeroSlider />;
  return <HeroSlider slides={slides} />;
}
