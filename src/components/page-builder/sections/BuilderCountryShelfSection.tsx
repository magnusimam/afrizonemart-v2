import { ShopByCountrySection } from '@/components/sections/ShopByCountrySection';
import type { ApiPageSection, CountryShelfSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Wrapper around the existing twin-marquee ShopByCountrySection. The
/// underlying component pulls from the COUNTRY_CODES list — admin
/// override of which countries to show is a future enhancement (the
/// schema accepts countryCodes but the renderer ignores it for now).
export function BuilderCountryShelfSection({ section: _section }: Props) {
  return <ShopByCountrySection />;
}
