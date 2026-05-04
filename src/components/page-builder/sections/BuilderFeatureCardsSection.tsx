import { ShopByCategorySection } from '@/components/sections/ShopByCategorySection';
import type { ApiPageSection, FeatureCardsSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Delegates to the existing ShopByCategorySection — the homepage's
/// "Shop By Category" / "Mixed Categories" big-card grid. The admin
/// owns each card's image + name + description + href + button label;
/// the section's amber stripe, navy band, grid layout, and card
/// styling all stay in code so publishing never changes the design.
export function BuilderFeatureCardsSection({ section }: Props) {
  const config = section.config as FeatureCardsSectionConfig;
  const cards = (config.cards ?? []).map((c) => ({
    name: c.name,
    description: c.description ?? '',
    image: c.imageUrl,
    href: c.href,
    buttonText: c.ctaLabel ?? undefined,
  }));
  return (
    <ShopByCategorySection
      headline={section.headline ?? undefined}
      cards={cards.length > 0 ? cards : undefined}
    />
  );
}
