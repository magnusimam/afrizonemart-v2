export interface Country {
  code: string;
  name: string;
  flag: string;
  dial: string;
  slug: string;
  /// ISO-4217 currency code for the country (e.g. NGN, KES, ZAR).
  /// Used for "show product in origin currency" display on the
  /// storefront — see `DisplayPrice`. CFA-franc members alias to
  /// XOF (West Africa) / XAF (Central Africa); Eswatini, Lesotho,
  /// and Namibia peg to ZAR in practice but list their own
  /// national currency here. Sovereign-country-with-no-currency
  /// (Zimbabwe → USD, by adoption) is honoured.
  currency: string;
}

/**
 * 2026-05-16 — expanded from 21 featured nations to all 54
 * UN-recognised African states + African Union members. The list
 * intentionally omits non-sovereign territories (Western Sahara —
 * disputed; Réunion / Mayotte — French overseas; Saint Helena —
 * British overseas). If a market opens for one of those later, add
 * a row explicitly.
 *
 * Source of truth for every dropdown (signup / checkout / profile /
 * address / admin product / admin filters), every flag display
 * (cards, PDP, reviews, cart), every `/shop/country/<slug>` route,
 * and the homepage Shop-by-Country marquee. Adding a row here makes
 * the country visible across the whole storefront with zero other
 * file changes.
 */
export type CountryCode =
  | 'DZ' | 'AO' | 'BJ' | 'BW' | 'BF' | 'BI'
  | 'CV' | 'CM' | 'CF' | 'TD' | 'KM' | 'CG'
  | 'CD' | 'CI' | 'DJ' | 'EG' | 'GQ' | 'ER'
  | 'SZ' | 'ET' | 'GA' | 'GM' | 'GH' | 'GN'
  | 'GW' | 'KE' | 'LS' | 'LR' | 'LY' | 'MG'
  | 'MW' | 'ML' | 'MR' | 'MU' | 'MA' | 'MZ'
  | 'NA' | 'NE' | 'NG' | 'RW' | 'ST' | 'SN'
  | 'SC' | 'SL' | 'SO' | 'ZA' | 'SS' | 'SD'
  | 'TZ' | 'TG' | 'TN' | 'UG' | 'ZM' | 'ZW';

export const COUNTRIES: Record<CountryCode, Country> = {
  DZ: { code: 'DZ', name: 'Algeria',                          flag: '🇩🇿', dial: '+213', slug: 'algeria',                          currency: 'DZD' },
  AO: { code: 'AO', name: 'Angola',                           flag: '🇦🇴', dial: '+244', slug: 'angola',                           currency: 'AOA' },
  BJ: { code: 'BJ', name: 'Benin',                            flag: '🇧🇯', dial: '+229', slug: 'benin',                            currency: 'XOF' },
  BW: { code: 'BW', name: 'Botswana',                         flag: '🇧🇼', dial: '+267', slug: 'botswana',                         currency: 'BWP' },
  BF: { code: 'BF', name: 'Burkina Faso',                     flag: '🇧🇫', dial: '+226', slug: 'burkina-faso',                     currency: 'XOF' },
  BI: { code: 'BI', name: 'Burundi',                          flag: '🇧🇮', dial: '+257', slug: 'burundi',                          currency: 'BIF' },
  CV: { code: 'CV', name: 'Cabo Verde',                       flag: '🇨🇻', dial: '+238', slug: 'cabo-verde',                       currency: 'CVE' },
  CM: { code: 'CM', name: 'Cameroon',                         flag: '🇨🇲', dial: '+237', slug: 'cameroon',                         currency: 'XAF' },
  CF: { code: 'CF', name: 'Central African Republic',         flag: '🇨🇫', dial: '+236', slug: 'central-african-republic',         currency: 'XAF' },
  TD: { code: 'TD', name: 'Chad',                             flag: '🇹🇩', dial: '+235', slug: 'chad',                             currency: 'XAF' },
  KM: { code: 'KM', name: 'Comoros',                          flag: '🇰🇲', dial: '+269', slug: 'comoros',                          currency: 'KMF' },
  CG: { code: 'CG', name: 'Republic of the Congo',            flag: '🇨🇬', dial: '+242', slug: 'congo',                            currency: 'XAF' },
  CD: { code: 'CD', name: 'Democratic Republic of the Congo', flag: '🇨🇩', dial: '+243', slug: 'dr-congo',                         currency: 'CDF' },
  CI: { code: 'CI', name: "Côte d'Ivoire",                    flag: '🇨🇮', dial: '+225', slug: 'cote-divoire',                     currency: 'XOF' },
  DJ: { code: 'DJ', name: 'Djibouti',                         flag: '🇩🇯', dial: '+253', slug: 'djibouti',                         currency: 'DJF' },
  EG: { code: 'EG', name: 'Egypt',                            flag: '🇪🇬', dial: '+20',  slug: 'egypt',                            currency: 'EGP' },
  GQ: { code: 'GQ', name: 'Equatorial Guinea',                flag: '🇬🇶', dial: '+240', slug: 'equatorial-guinea',                currency: 'XAF' },
  ER: { code: 'ER', name: 'Eritrea',                          flag: '🇪🇷', dial: '+291', slug: 'eritrea',                          currency: 'ERN' },
  SZ: { code: 'SZ', name: 'Eswatini',                         flag: '🇸🇿', dial: '+268', slug: 'eswatini',                         currency: 'SZL' },
  ET: { code: 'ET', name: 'Ethiopia',                         flag: '🇪🇹', dial: '+251', slug: 'ethiopia',                         currency: 'ETB' },
  GA: { code: 'GA', name: 'Gabon',                            flag: '🇬🇦', dial: '+241', slug: 'gabon',                            currency: 'XAF' },
  GM: { code: 'GM', name: 'Gambia',                           flag: '🇬🇲', dial: '+220', slug: 'gambia',                           currency: 'GMD' },
  GH: { code: 'GH', name: 'Ghana',                            flag: '🇬🇭', dial: '+233', slug: 'ghana',                            currency: 'GHS' },
  GN: { code: 'GN', name: 'Guinea',                           flag: '🇬🇳', dial: '+224', slug: 'guinea',                           currency: 'GNF' },
  GW: { code: 'GW', name: 'Guinea-Bissau',                    flag: '🇬🇼', dial: '+245', slug: 'guinea-bissau',                    currency: 'XOF' },
  KE: { code: 'KE', name: 'Kenya',                            flag: '🇰🇪', dial: '+254', slug: 'kenya',                            currency: 'KES' },
  LS: { code: 'LS', name: 'Lesotho',                          flag: '🇱🇸', dial: '+266', slug: 'lesotho',                          currency: 'LSL' },
  LR: { code: 'LR', name: 'Liberia',                          flag: '🇱🇷', dial: '+231', slug: 'liberia',                          currency: 'LRD' },
  LY: { code: 'LY', name: 'Libya',                            flag: '🇱🇾', dial: '+218', slug: 'libya',                            currency: 'LYD' },
  MG: { code: 'MG', name: 'Madagascar',                       flag: '🇲🇬', dial: '+261', slug: 'madagascar',                       currency: 'MGA' },
  MW: { code: 'MW', name: 'Malawi',                           flag: '🇲🇼', dial: '+265', slug: 'malawi',                           currency: 'MWK' },
  ML: { code: 'ML', name: 'Mali',                             flag: '🇲🇱', dial: '+223', slug: 'mali',                             currency: 'XOF' },
  MR: { code: 'MR', name: 'Mauritania',                       flag: '🇲🇷', dial: '+222', slug: 'mauritania',                       currency: 'MRU' },
  MU: { code: 'MU', name: 'Mauritius',                        flag: '🇲🇺', dial: '+230', slug: 'mauritius',                        currency: 'MUR' },
  MA: { code: 'MA', name: 'Morocco',                          flag: '🇲🇦', dial: '+212', slug: 'morocco',                          currency: 'MAD' },
  MZ: { code: 'MZ', name: 'Mozambique',                       flag: '🇲🇿', dial: '+258', slug: 'mozambique',                       currency: 'MZN' },
  NA: { code: 'NA', name: 'Namibia',                          flag: '🇳🇦', dial: '+264', slug: 'namibia',                          currency: 'NAD' },
  NE: { code: 'NE', name: 'Niger',                            flag: '🇳🇪', dial: '+227', slug: 'niger',                            currency: 'XOF' },
  NG: { code: 'NG', name: 'Nigeria',                          flag: '🇳🇬', dial: '+234', slug: 'nigeria',                          currency: 'NGN' },
  RW: { code: 'RW', name: 'Rwanda',                           flag: '🇷🇼', dial: '+250', slug: 'rwanda',                           currency: 'RWF' },
  ST: { code: 'ST', name: 'São Tomé and Príncipe',            flag: '🇸🇹', dial: '+239', slug: 'sao-tome-and-principe',            currency: 'STN' },
  SN: { code: 'SN', name: 'Senegal',                          flag: '🇸🇳', dial: '+221', slug: 'senegal',                          currency: 'XOF' },
  SC: { code: 'SC', name: 'Seychelles',                       flag: '🇸🇨', dial: '+248', slug: 'seychelles',                       currency: 'SCR' },
  SL: { code: 'SL', name: 'Sierra Leone',                     flag: '🇸🇱', dial: '+232', slug: 'sierra-leone',                     currency: 'SLE' },
  SO: { code: 'SO', name: 'Somalia',                          flag: '🇸🇴', dial: '+252', slug: 'somalia',                          currency: 'SOS' },
  ZA: { code: 'ZA', name: 'South Africa',                     flag: '🇿🇦', dial: '+27',  slug: 'south-africa',                     currency: 'ZAR' },
  SS: { code: 'SS', name: 'South Sudan',                      flag: '🇸🇸', dial: '+211', slug: 'south-sudan',                      currency: 'SSP' },
  SD: { code: 'SD', name: 'Sudan',                            flag: '🇸🇩', dial: '+249', slug: 'sudan',                            currency: 'SDG' },
  TZ: { code: 'TZ', name: 'Tanzania',                         flag: '🇹🇿', dial: '+255', slug: 'tanzania',                         currency: 'TZS' },
  TG: { code: 'TG', name: 'Togo',                             flag: '🇹🇬', dial: '+228', slug: 'togo',                             currency: 'XOF' },
  TN: { code: 'TN', name: 'Tunisia',                          flag: '🇹🇳', dial: '+216', slug: 'tunisia',                          currency: 'TND' },
  UG: { code: 'UG', name: 'Uganda',                           flag: '🇺🇬', dial: '+256', slug: 'uganda',                           currency: 'UGX' },
  ZM: { code: 'ZM', name: 'Zambia',                           flag: '🇿🇲', dial: '+260', slug: 'zambia',                           currency: 'ZMW' },
  ZW: { code: 'ZW', name: 'Zimbabwe',                         flag: '🇿🇼', dial: '+263', slug: 'zimbabwe',                         currency: 'USD' },
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

/// Resolve a country from a raw `origin` value that may be ISO-2
/// ("NG"), a full name ("Nigeria"), or a slug ("nigeria"). Product
/// rows have unnormalised `origin` strings so anything that touches a
/// product's country leans on this. Returns undefined when nothing
/// matches.
export function findCountry(origin?: string | null): Country | undefined {
  if (!origin) return undefined;
  const raw = origin.trim();
  if (raw.length === 2) {
    const byCode = COUNTRIES[raw.toUpperCase() as CountryCode];
    if (byCode) return byCode;
  }
  const lower = raw.toLowerCase();
  return Object.values(COUNTRIES).find(
    (c) => c.name.toLowerCase() === lower || c.slug === lower,
  );
}

/// Resolve a country code to its currency for the storefront's
/// "show product in origin currency" feature. Returns null when the
/// code is unknown or absent so callers can fall back cleanly.
export function currencyForCountryCode(code?: string | null): string | null {
  if (!code) return null;
  const country = COUNTRIES[code.toUpperCase() as CountryCode];
  return country?.currency ?? null;
}

/// 2026-05-16 — a curated "featured" subset used by the homepage
/// marquee and the Shop-by-Country teaser block. Keeps the marquee
/// visually balanced (18 countries, 9 per row) without burying
/// long-tail markets — the "See all 54" link routes to the full
/// /shop/countries index. Reorder here when business priorities
/// shift; the rest of the codebase reads `COUNTRY_CODES` for the
/// complete list.
export const FEATURED_COUNTRY_CODES: CountryCode[] = [
  'NG', 'KE', 'ZA', 'GH', 'EG', 'MA', 'ET', 'TZ', 'UG',
  'RW', 'CI', 'SN', 'CM', 'DZ', 'TN', 'AO', 'NA', 'ZM',
];
