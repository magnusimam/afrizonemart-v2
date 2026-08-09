/**
 * Country → first-level subdivision data for the "Country of Origin"
 * cascade. Each country carries its *local terminology* (State, Region,
 * Province, County, Governorate, District…) and the list of subdivisions,
 * so the PIQ asks "State" for Nigeria but "Region" for Ghana, etc.
 *
 * Data-only (Principle 3/4): the form engine reads this to render the
 * dependent dropdown; no UI logic lives here. Countries without a list
 * fall back to a free-text input using the generic term below.
 *
 * Country names must match `AFRICAN_COUNTRIES` in piq-config.ts exactly.
 */

export interface CountryRegions {
  /** Local name for a first-level subdivision (drives the field label). */
  term: string;
  /** Subdivisions; when present the field is a dropdown, else free text. */
  options?: string[];
}

/** Used when the selected country has no list (or "Other"). */
export const DEFAULT_REGION_TERM = 'State / Province / Region';

export const COUNTRY_REGIONS: Record<string, CountryRegions> = {
  Nigeria: {
    term: 'State',
    options: [
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
      'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
      'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
      'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
      'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
      'Federal Capital Territory (Abuja)',
    ],
  },
  Ghana: {
    term: 'Region',
    options: [
      'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
      'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
      'Upper East', 'Upper West', 'Volta', 'Western', 'Western North',
    ],
  },
  Kenya: {
    term: 'County',
    options: [
      'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
      'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
      'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
      'Nyeri', 'Kirinyaga', "Murang'a", 'Kiambu', 'Turkana', 'West Pokot',
      'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
      'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet',
      'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
      'Migori', 'Kisii', 'Nyamira', 'Nairobi',
    ],
  },
  'South Africa': {
    term: 'Province',
    options: [
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
      'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
    ],
  },
  Ethiopia: {
    term: 'Region',
    options: [
      'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Central Ethiopia',
      'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
      'South Ethiopia', "South West Ethiopia Peoples'", 'Tigray',
    ],
  },
  Egypt: {
    term: 'Governorate',
    options: [
      'Alexandria', 'Aswan', 'Asyut', 'Beheira', 'Beni Suef', 'Cairo',
      'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Ismailia',
      'Kafr El Sheikh', 'Luxor', 'Matrouh', 'Minya', 'Monufia', 'New Valley',
      'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharqia',
      'Sohag', 'South Sinai', 'Suez',
    ],
  },
  Tanzania: {
    term: 'Region',
    options: [
      'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera',
      'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya',
      'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South',
      'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe',
      'Tabora', 'Tanga', 'Unguja North', 'Unguja South', 'Zanzibar Urban/West',
    ],
  },
  Uganda: {
    term: 'Region',
    options: ['Central', 'Eastern', 'Northern', 'Western'],
  },
  Rwanda: {
    term: 'Province',
    options: ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'],
  },
  'Côte d’Ivoire': {
    term: 'District',
    options: [
      'Abidjan', 'Bas-Sassandra', 'Comoé', 'Denguélé', 'Gôh-Djiboua', 'Lacs',
      'Lagunes', 'Montagnes', 'Sassandra-Marahoué', 'Savanes',
      'Vallée du Bandama', 'Woroba', 'Yamoussoukro', 'Zanzan',
    ],
  },
  Senegal: {
    term: 'Region',
    options: [
      'Dakar', 'Diourbel', 'Fatick', 'Kaffrine', 'Kaolack', 'Kédougou',
      'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda',
      'Thiès', 'Ziguinchor',
    ],
  },
  Cameroon: {
    term: 'Region',
    options: [
      'Adamawa', 'Centre', 'East', 'Far North', 'Littoral', 'North',
      'North-West', 'South', 'South-West', 'West',
    ],
  },
  Morocco: {
    term: 'Region',
    options: [
      'Tanger-Tétouan-Al Hoceïma', "L'Oriental", 'Fès-Meknès',
      'Rabat-Salé-Kénitra', 'Béni Mellal-Khénifra', 'Casablanca-Settat',
      'Marrakech-Safi', 'Drâa-Tafilalet', 'Souss-Massa', 'Guelmim-Oued Noun',
      'Laâyoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab',
    ],
  },
};

/** Lookup helper — returns the subdivision config for a country, if any. */
export function regionsFor(country?: string): CountryRegions | undefined {
  if (!country) return undefined;
  return COUNTRY_REGIONS[country];
}
