export interface Country {
  code: string;
  name: string;
  flag: string;
  dial: string;
  slug: string;
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
  NG: { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dial: '+234', slug: 'nigeria' },
  KE: { code: 'KE', name: 'Kenya', flag: '🇰🇪', dial: '+254', slug: 'kenya' },
  ZA: { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dial: '+27', slug: 'south-africa' },
  EG: { code: 'EG', name: 'Egypt', flag: '🇪🇬', dial: '+20', slug: 'egypt' },
  GH: { code: 'GH', name: 'Ghana', flag: '🇬🇭', dial: '+233', slug: 'ghana' },
  MA: { code: 'MA', name: 'Morocco', flag: '🇲🇦', dial: '+212', slug: 'morocco' },
  ET: { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dial: '+251', slug: 'ethiopia' },
  TZ: { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dial: '+255', slug: 'tanzania' },
  UG: { code: 'UG', name: 'Uganda', flag: '🇺🇬', dial: '+256', slug: 'uganda' },
  RW: { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dial: '+250', slug: 'rwanda' },
  ZW: { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dial: '+263', slug: 'zimbabwe' },
  CI: { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dial: '+225', slug: 'cote-divoire' },
  SN: { code: 'SN', name: 'Senegal', flag: '🇸🇳', dial: '+221', slug: 'senegal' },
  CM: { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dial: '+237', slug: 'cameroon' },
  ML: { code: 'ML', name: 'Mali', flag: '🇲🇱', dial: '+223', slug: 'mali' },
  DZ: { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dial: '+213', slug: 'algeria' },
  TN: { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dial: '+216', slug: 'tunisia' },
  AO: { code: 'AO', name: 'Angola', flag: '🇦🇴', dial: '+244', slug: 'angola' },
  BW: { code: 'BW', name: 'Botswana', flag: '🇧🇼', dial: '+267', slug: 'botswana' },
  NA: { code: 'NA', name: 'Namibia', flag: '🇳🇦', dial: '+264', slug: 'namibia' },
  MZ: { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dial: '+258', slug: 'mozambique' },
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
