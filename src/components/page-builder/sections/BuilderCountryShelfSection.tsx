import { ShopByCountrySection } from '@/components/sections/ShopByCountrySection';
import type { CountryCode } from '@/lib/countries';
import type { ApiPageSection, CountryShelfSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Delegates to the existing ShopByCountrySection — the admin only
/// owns the headline override and (optionally) which country codes
/// to feature. Layout / animation stays in code.
export function BuilderCountryShelfSection({ section }: Props) {
  const config = section.config as CountryShelfSectionConfig;
  const codes = (config.countryCodes ?? []) as CountryCode[];
  return (
    <ShopByCountrySection
      headline={config.headline ?? section.headline ?? undefined}
      countryCodes={codes.length > 0 ? codes : undefined}
    />
  );
}
