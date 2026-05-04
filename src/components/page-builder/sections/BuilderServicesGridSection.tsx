import { ServicesSection } from '@/components/sections/ServicesSection';
import type { ApiPageSection, ServicesGridSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Delegates to the existing ServicesSection — same gift-cards hero +
/// dark service tiles layout. Admin owns the hero image, tile names,
/// and links; the design (card backgrounds, icon styling, hover states)
/// stays in code.
export function BuilderServicesGridSection({ section }: Props) {
  const config = section.config as ServicesGridSectionConfig;
  return (
    <ServicesSection
      heroCard={
        config.heroCard
          ? { src: config.heroCard.imageUrl, alt: config.heroCard.imageAlt, href: config.heroCard.href }
          : null
      }
      services={(config.services ?? []).map((s) => ({ name: s.name, href: s.href, icon: s.icon }))}
    />
  );
}
