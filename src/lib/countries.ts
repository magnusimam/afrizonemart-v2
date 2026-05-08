export interface Country {
  code: string;
  name: string;
  flag: string;
  dial: string;
  slug: string;
  /// ISO-4217 currency code for the country (e.g. NGN, KES, ZAR).
  /// Used for "show product in origin currency" display on the
  /// storefront — see `DisplayPrice`. The franc-zone members
  /// (Côte d'Ivoire, Senegal, Mali → XOF; Cameroon → XAF) and any
  /// future shared-currency markets all alias to the right code.
  currency: string;
}

export type CountryCode =
  | 'NG'
  | 'KE'
  | 'ZA'
  | 'EG'
  | 'GH'
  | 'MA'
  | 'ET'
  | 'TZ'
  | 'UG'
  | 'RW'
  | 'ZW'
  | 'CI'
  | 'SN'
  | 'CM'
  | 'ML'
  | 'DZ'
  | 'TN'
  | 'AO'
  | 'BW'
  | 'NA'
  | 'MZ';

export const COUNTRIES: Record<CountryCode, Country> = {
  NG: { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dial: '+234', slug: 'nigeria', currency: 'NGN' },
  KE: { code: 'KE', name: 'Kenya', flag: '🇰🇪', dial: '+254', slug: 'kenya', currency: 'KES' },
  ZA: { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dial: '+27', slug: 'south-africa', currency: 'ZAR' },
  EG: { code: 'EG', name: 'Egypt', flag: '🇪🇬', dial: '+20', slug: 'egypt', currency: 'EGP' },
  GH: { code: 'GH', name: 'Ghana', flag: '🇬🇭', dial: '+233', slug: 'ghana', currency: 'GHS' },
  MA: { code: 'MA', name: 'Morocco', flag: '🇲🇦', dial: '+212', slug: 'morocco', currency: 'MAD' },
  ET: { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dial: '+251', slug: 'ethiopia', currency: 'ETB' },
  TZ: { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dial: '+255', slug: 'tanzania', currency: 'TZS' },
  UG: { code: 'UG', name: 'Uganda', flag: '🇺🇬', dial: '+256', slug: 'uganda', currency: 'UGX' },
  RW: { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dial: '+250', slug: 'rwanda', currency: 'RWF' },
  ZW: { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dial: '+263', slug: 'zimbabwe', currency: 'USD' },
  CI: { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dial: '+225', slug: 'cote-divoire', currency: 'XOF' },
  SN: { code: 'SN', name: 'Senegal', flag: '🇸🇳', dial: '+221', slug: 'senegal', currency: 'XOF' },
  CM: { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dial: '+237', slug: 'cameroon', currency: 'XAF' },
  ML: { code: 'ML', name: 'Mali', flag: '🇲🇱', dial: '+223', slug: 'mali', currency: 'XOF' },
  DZ: { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dial: '+213', slug: 'algeria', currency: 'DZD' },
  TN: { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dial: '+216', slug: 'tunisia', currency: 'TND' },
  AO: { code: 'AO', name: 'Angola', flag: '🇦🇴', dial: '+244', slug: 'angola', currency: 'AOA' },
  BW: { code: 'BW', name: 'Botswana', flag: '🇧🇼', dial: '+267', slug: 'botswana', currency: 'BWP' },
  NA: { code: 'NA', name: 'Namibia', flag: '🇳🇦', dial: '+264', slug: 'namibia', currency: 'NAD' },
  MZ: { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dial: '+258', slug: 'mozambique', currency: 'MZN' },
};

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

export function getCountry(code?: string): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES[code as CountryCode];
}

export function getCountryBySlug(slug?: string): Country | undefined {
  if (!slug) return undefined;
  const lowered = slug.toLowerCase();
  return Object.values(COUNTRIES).find((c) => c.slug === lowered);
}

/// Resolve a country code to its currency for the storefront's
/// "show product in origin currency" feature. Returns null when the
/// code is unknown or absent so callers can fall back cleanly.
export function currencyForCountryCode(code?: string | null): string | null {
  if (!code) return null;
  const country = COUNTRIES[code.toUpperCase() as CountryCode];
  return country?.currency ?? null;
}
