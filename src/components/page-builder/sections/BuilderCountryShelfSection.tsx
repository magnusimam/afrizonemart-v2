import { ShopByCountrySection } from '@/components/sections/ShopByCountrySection';

/// Wrapper around the existing twin-marquee ShopByCountrySection. The
/// underlying component pulls from the COUNTRY_CODES list — admin
/// override of which countries to show is a future enhancement (the
/// schema accepts countryCodes but the renderer ignores it for now).
export function BuilderCountryShelfSection() {
  return <ShopByCountrySection />;
}
