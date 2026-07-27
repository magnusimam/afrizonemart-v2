/**
 * Product Information Questionnaire (PIQ) — form configuration.
 *
 * This is the schema-driven definition of the PIQ (Principle 4). The form
 * engine renders whatever is described here — when Magnus/Sourcing supply
 * a different or category-specific question set, this object is replaced
 * (eventually via `POST /api/admin/piq-configs`) with **no UI code change**.
 *
 * Every question carries `guidance` (example + how-to + why-it-matters),
 * lifted verbatim-in-spirit from "AZM Guideline for Product Information
 * Questionnaire". The form engine shows this guidance inline, beside each
 * question, so a supplier always sees how to answer the field they're on.
 *
 * One PIQ = one product (see the opening instruction in the guideline).
 */

export type PIQQuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'date'
  | 'file'
  /**
   * A first-level subdivision that depends on a country field. The engine
   * resolves it to a dropdown (or free text) using `regions.ts`, with the
   * label following local terminology (State, Region, Province, …).
   */
  | 'subdivision';

/** Inline help shown beside a question. */
export interface PIQGuidance {
  /** A concrete, copyable example answer. */
  example?: string;
  /** Step-by-step "how to provide this" bullets. */
  howTo?: string[];
  /** Why Afrizonemart and buyers need it. */
  why?: string;
}

export interface PIQQuestion {
  id: string;
  label: string;
  type: PIQQuestionType;
  required: boolean;
  placeholder?: string;
  /** For select / multiselect. */
  options?: string[];
  /** For file. */
  acceptedTypes?: string[];
  maxSizeMB?: number;
  maxLength?: number;
  /** Only render when `answers[dependsOn]` is one of `showWhen`. */
  conditional?: { dependsOn: string; showWhen: (string | boolean)[] };
  /** For `subdivision`: the id of the country question this depends on. */
  countryField?: string;
  guidance?: PIQGuidance;
}

export interface PIQSection {
  id: string;
  title: string;
  description?: string;
  questions: PIQQuestion[];
}

export interface PIQFormConfig {
  category: string;
  label: string;
  version: number;
  sections: PIQSection[];
}

/** Representative African-country list for Country of Origin. */
export const AFRICAN_COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Ethiopia',
  'Egypt',
  'Tanzania',
  'Uganda',
  'Rwanda',
  'Côte d’Ivoire',
  'Senegal',
  'Cameroon',
  'Morocco',
  'Other',
];

const YES_NO_UNKNOWN = ['Yes', 'No', 'Unknown'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/** Trade currencies suppliers commonly quote in. */
const TRADE_CURRENCIES = [
  'NGN — Nigerian Naira',
  'USD — US Dollar',
  'EUR — Euro',
  'GBP — British Pound',
  'GHS — Ghanaian Cedi',
  'KES — Kenyan Shilling',
  'ZAR — South African Rand',
  'EGP — Egyptian Pound',
  'XOF — West African CFA Franc',
  'XAF — Central African CFA Franc',
  'Other',
];

/** Incoterms — who pays/risks what in cross-border delivery. */
const INCOTERMS = [
  'EXW — Ex Works',
  'FOB — Free On Board',
  'CIF — Cost, Insurance & Freight',
  'CFR — Cost & Freight',
  'DAP — Delivered At Place',
  'DDP — Delivered Duty Paid',
  'Not sure yet',
];

/**
 * The general PIQ. Category === 'GENERAL' is the placeholder/default until
 * category-specific configs are uploaded; the structure is identical, so
 * those will slot in without code changes.
 */
export const PIQ_GENERAL_CONFIG: PIQFormConfig = {
  category: 'GENERAL',
  label: 'Product Information Questionnaire',
  version: 1,
  sections: [
    {
      id: 'identification',
      title: 'Product Identification',
      description:
        'Core identity of this product. Remember: one form per product — submit a separate PIQ for each SKU or size.',
      questions: [
        {
          id: 'product_name',
          label: 'Product Name',
          type: 'text',
          required: true,
          maxLength: 200,
          placeholder: 'e.g. John Dan Extra Virgin Avocado Oil (500 ml)',
          guidance: {
            example: 'John Dan Extra Virgin Avocado Oil (500 ml)',
            howTo: [
              'Enter the exact commercial name as printed on the package.',
              'Include the variant/size in parentheses.',
              'Use Title Case; avoid promotional phrases like “Best Ever!”.',
              'Don’t include SKU codes here.',
            ],
            why: 'This is the title buyers see in search and on the product page — it drives discoverability and clarity.',
          },
        },
        {
          id: 'brand_name',
          label: 'Brand Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. John Dan Foods',
          guidance: {
            example: 'John Dan Foods',
            howTo: [
              'Enter the registered brand or trade name.',
              'If you sell under multiple brands, use the one that appears on packaging.',
              'If the brand is still being registered, enter “In Process” and upload docs later.',
            ],
            why: 'Brand builds trust and lets us link all products from the same maker for brand pages and cross-promotion.',
          },
        },
        {
          id: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          options: ['Food', 'Fashion', 'Tech', 'Home', 'Health', 'Other'],
          guidance: {
            example: 'Food',
            howTo: ['Pick the single category that best fits. If “Other”, specify it in the notes.'],
            why: 'Correct category placement improves search relevance and puts the product in the right buyer funnels.',
          },
        },
        {
          id: 'short_description',
          label: 'Short Description',
          type: 'textarea',
          required: true,
          maxLength: 300,
          placeholder: 'A concise summary of what it does and who it’s for.',
          guidance: {
            example:
              '100% Pure Cold-Pressed Avocado Oil — rich in Vitamins A, D & E; ideal for cooking and skincare. Non-GMO, preservative-free.',
            howTo: [
              '1–3 short sentences (20–60 words).',
              'Mention the core benefit, primary use, and one or two key attributes.',
              'Keep it factual; avoid marketing hyperbole.',
            ],
            why: 'Used in search snippets, category listings, and quick previews — it must convey the essence instantly.',
          },
        },
        {
          id: 'long_description',
          label: 'Long Description',
          type: 'textarea',
          required: true,
          maxLength: 2000,
          placeholder: 'Detailed explanation including how the product works and how to use it.',
          guidance: {
            example:
              'Our cold-pressed avocado oil is produced from handpicked ripe avocados using low-temperature pressing to retain natural vitamins. Use for high-heat cooking up to 200°C, as a salad dressing, or as a skin moisturizer. Free from preservatives. Store in a cool, dark place; shake before use.',
            howTo: [
              '4–8 short paragraphs or 150–300 words.',
              'Cover origin, production method, primary uses, benefits, and key specs.',
              'Include usage examples and a one-line care/storage note.',
              'Avoid exaggerated claims (e.g. “cures disease”).',
            ],
            why: 'Detailed copy improves conversions, reduces returns, and powers marketing content.',
          },
        },
        {
          id: 'product_image',
          label: 'Product Image',
          type: 'file',
          required: true,
          acceptedTypes: IMAGE_TYPES,
          maxSizeMB: 20,
          guidance: {
            howTo: [
              'High-resolution, front-facing photo. JPEG/PNG.',
              'Minimum 1500×1500 px; ideally 3000 px on the longest side.',
              'White or neutral background, label legible.',
              'If possible add 2–4 more views: top, back (ingredients), and in-use.',
            ],
            why: 'High-quality images increase buyer confidence and are required for retail/export listings.',
          },
        },
        {
          id: 'packaging_image',
          label: 'Packaging Image',
          type: 'file',
          required: false,
          acceptedTypes: IMAGE_TYPES,
          maxSizeMB: 20,
          guidance: {
            howTo: [
              'Clear shots of label panels, barcode, manufacturing/expiry dates, and handling icons.',
              'Include a close-up of the nutrition facts and ingredient list.',
            ],
            why: 'Lets us verify compliance — label requirements, ingredients, and claims.',
          },
        },
        {
          id: 'country_of_origin',
          label: 'Country of Origin',
          type: 'select',
          required: true,
          options: AFRICAN_COUNTRIES,
          guidance: {
            example: 'Nigeria',
            howTo: [
              'Select where the product was manufactured or processed.',
              'If ingredients come from multiple countries, choose where final packaging happens.',
            ],
            why: 'Affects buyer preferences, taxes, export requirements, and AfCFTA eligibility.',
          },
        },
        {
          id: 'region_of_origin',
          label: 'State / Province / Region',
          type: 'subdivision',
          required: true,
          countryField: 'country_of_origin',
          guidance: {
            howTo: [
              'Pick the state, province, or region where the product is made or packaged.',
              'The list updates to match the country you chose above.',
            ],
            why: 'Pinpoints provenance for buyers and logistics, and supports “Made in …” and regional-sourcing stories.',
          },
        },
        {
          id: 'gtin',
          label: 'Barcode / GTIN (EAN or UPC)',
          type: 'text',
          required: false,
          placeholder: 'e.g. 6 154000 123456',
          guidance: {
            example: '6154000123456',
            howTo: [
              'Enter the product’s barcode number (8, 12, 13, or 14 digits).',
              'Use the EAN/UPC printed under the barcode on the package.',
              'If you don’t have one yet, leave blank — you can add it before going live.',
            ],
            why: 'A GTIN uniquely identifies the product across retail and marketplaces and prevents duplicate or mismatched listings.',
          },
        },
        {
          id: 'hs_code',
          label: 'HS / Tariff Code',
          type: 'text',
          required: false,
          placeholder: 'e.g. 1515.90',
          guidance: {
            example: '1515.90',
            howTo: [
              'Enter the Harmonised System code for the product (at least the 6-digit heading).',
              'If unsure, give the closest category — our team will help confirm it.',
            ],
            why: 'The HS code drives customs classification, duties, and AfCFTA eligibility for cross-border trade.',
          },
        },
      ],
    },
    {
      id: 'specifications',
      title: 'Product Specifications',
      questions: [
        {
          id: 'weight_volume',
          label: 'Weight / Volume',
          type: 'text',
          required: true,
          placeholder: 'e.g. 500 ml or 500 g',
          guidance: {
            example: '500 ml or 500 g',
            howTo: [
              'Use metric units. Give net weight/volume (not including packaging).',
              'For multi-packs, specify unit size × units (e.g. 250 ml × 6).',
            ],
            why: 'Required for shipping calculations, per-unit pricing, and regulatory compliance.',
          },
        },
        {
          id: 'dimensions',
          label: 'Dimensions (L × W × H)',
          type: 'text',
          required: false,
          placeholder: 'e.g. Height 18 cm × Diameter 6 cm',
          guidance: {
            howTo: ['Packaging dimensions in centimetres. For irregular shapes, give max dimensions.'],
            why: 'Used for warehouse shelving, shipping costs, and pallet planning.',
          },
        },
        {
          id: 'units_per_carton',
          label: 'Units per carton / case',
          type: 'number',
          required: false,
          placeholder: 'e.g. 24',
          guidance: {
            example: '24',
            howTo: [
              'How many sellable units are packed in one shipping carton.',
              'If you use inner + outer packs, give the outer-carton total.',
            ],
            why: 'Sets case quantities for wholesale ordering, freight, and palletisation.',
          },
        },
        {
          id: 'carton_specs',
          label: 'Carton weight & dimensions',
          type: 'text',
          required: false,
          placeholder: 'e.g. 12 kg · 40 × 30 × 25 cm',
          guidance: {
            example: '12 kg · 40 × 30 × 25 cm',
            howTo: [
              'Give the gross weight and L × W × H of a full shipping carton.',
              'Use kg and cm.',
            ],
            why: 'Lets us calculate freight cost, container loading, and landed cost accurately.',
          },
        },
        {
          id: 'ingredients',
          label: 'Ingredients / Materials',
          type: 'textarea',
          required: true,
          placeholder: 'Comma-separated list',
          guidance: {
            example: 'Avocado oil (Persea americana), natural vitamin E',
            howTo: [
              'List in order of predominance (largest to smallest by weight).',
              'Use standardised ingredient names; list components for allergens.',
            ],
            why: 'Consumers and regulators need ingredient transparency; critical for allergy checks and imports.',
          },
        },
        {
          id: 'nutritional_content',
          label: 'Nutritional Content (if food)',
          type: 'textarea',
          required: false,
          placeholder: 'Per-serving metrics with serving size',
          guidance: {
            example: 'Per 15 ml (1 tbsp): Energy 135 kcal; Fat 15 g (Saturated 2 g); Carbs 0 g; Protein 0 g; Vitamin E 2 mg.',
            howTo: ['Use per-serving metrics and include serving size. Indicate units (kcal, g, mg).'],
            why: 'Required for food labelling, health-conscious buyers, and marketplace filters.',
          },
        },
        {
          id: 'contains',
          label: 'Contains (allergens, chemicals, preservatives)',
          type: 'textarea',
          required: false,
          guidance: {
            example: 'Contains: None (allergen-free). OR Contains: traces of peanuts.',
            howTo: [
              'Declare known allergens (peanuts, tree nuts, milk, soy, gluten, shellfish, eggs, sesame).',
              'Add cross-contamination statements when relevant.',
            ],
            why: 'Protects allergic consumers; non-disclosure can cause health and legal risk.',
          },
        },
        {
          id: 'does_not_contain',
          label: 'Does Not Contain',
          type: 'text',
          required: false,
          placeholder: 'e.g. Artificial colors, preservatives, gluten',
          guidance: {
            howTo: ['Only state negatives you can substantiate. Be ready to provide proof when asked.'],
            why: 'Buyers rely on “free-from” claims; false claims may result in delisting.',
          },
        },
        {
          id: 'gmo_status',
          label: 'GMO Status',
          type: 'select',
          required: true,
          options: YES_NO_UNKNOWN.map((o) => (o === 'Yes' ? 'GMO' : o === 'No' ? 'Non-GMO' : 'Unknown')),
          guidance: {
            example: 'Non-GMO',
            howTo: ['If you have proof, select Non-GMO and upload it. If unsure, select Unknown and explain in notes.'],
            why: 'Many buyers filter for non-GMO; affects marketability and some export/import rules.',
          },
        },
        {
          id: 'shelf_life',
          label: 'Shelf Life / Expiry',
          type: 'text',
          required: false,
          placeholder: 'e.g. Best before: 24 months from manufacture',
          guidance: {
            howTo: ['State shelf life (months/years) or a date as YYYY-MM-DD. Note lot-based dating if relevant.'],
            why: 'Ensures customers receive product with sufficient remaining shelf life.',
          },
        },
        {
          id: 'storage_conditions',
          label: 'Storage Conditions',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. Store in a cool, dry place away from sunlight.',
          guidance: {
            howTo: ['Be specific: temperature range (e.g. 5–25 °C) and humidity if relevant.'],
            why: 'Protects product quality during storage, transit, and after purchase.',
          },
        },
        {
          id: 'has_patent',
          label: 'Is there a patent or proprietary protection?',
          type: 'boolean',
          required: true,
          guidance: {
            howTo: ['If Yes, you’ll be asked for the details next. If unsure, choose No and note “In Process”.'],
            why: 'IP details prevent counterfeits, protect your rights, and help us avoid infringing listings.',
          },
        },
        {
          id: 'patent_details',
          label: 'Patent / IP details',
          type: 'textarea',
          required: false,
          conditional: { dependsOn: 'has_patent', showWhen: [true] },
          guidance: {
            example: 'Design patent NG-2020-D-12345 registered in Nigeria; trade secret for spice blend.',
            howTo: ['Include country, registration number, and a one-line explanation. Attach certificate scans if you have them.'],
            why: 'Documentation speeds verification and supports proprietary-quality marketing.',
          },
        },
        {
          id: 'trademark_status',
          label: 'Is the product / packaging trademarked or copyrighted?',
          type: 'select',
          required: true,
          options: ['Yes', 'No', 'In Process'],
          guidance: {
            example: 'Yes — Trademark registered: John Dan (Nigeria TM # 321045).',
            howTo: ['Provide registration info, or choose “In Process” and add expected timelines.'],
            why: 'Trademarks safeguard brand identity and prevent IP disputes on the platform.',
          },
        },
      ],
    },
    {
      id: 'usage',
      title: 'How It Works / Usage',
      questions: [
        {
          id: 'how_it_works',
          label: 'How It Works',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'High smoke point makes it suitable for frying and sautéing; antioxidants support topical skin hydration.',
            howTo: ['Explain the mechanism or function in 1–3 short paragraphs, with any technical detail.'],
            why: 'Buyers need to understand function to judge suitability for use or resale.',
          },
        },
        {
          id: 'how_to_use',
          label: 'How to Use It',
          type: 'textarea',
          required: false,
          guidance: {
            example: 'Cooking: up to medium-high heat, 1 tbsp per serving. Skincare: 2–3 drops on damp skin nightly.',
            howTo: ['Give clear steps, dosages, or frequency. Include safety notes (e.g. avoid contact with eyes).'],
            why: 'Clear instructions reduce misuse, returns, and negative reviews.',
          },
        },
        {
          id: 'how_made',
          label: 'How It Is Made',
          type: 'textarea',
          required: false,
          guidance: {
            howTo: ['Brief manufacturing summary: raw material → key process steps → finishing/packaging. Note quality steps (HACCP, GMP).'],
            why: 'Transparency supports claims like “cold-pressed” and helps buyers assess quality and ethics.',
          },
        },
        {
          id: 'what_it_does',
          label: 'What It Does',
          type: 'textarea',
          required: false,
          guidance: {
            howTo: ['List 3–6 main benefits or outcomes in bullet form.'],
            why: 'Helps marketing copy and use-case-driven buying decisions.',
          },
        },
        {
          id: 'what_it_doesnt',
          label: 'What It Doesn’t Do',
          type: 'textarea',
          required: false,
          guidance: {
            example: 'Not a medical treatment; not suitable for deep-frying above 220 °C.',
            howTo: ['Clarify limitations and avoidable misuse. Be honest about scope.'],
            why: 'Reduces unrealistic expectations and legal risk from misleading claims.',
          },
        },
        {
          id: 'target_users',
          label: 'Target Users / Audience',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Health-conscious adults, restaurants, and boutique skincare brands.',
            howTo: ['Define primary segments: age, professional vs consumer, B2B vs B2C, geography.'],
            why: 'Lets us target promotions, recommend to the right buyers, and set search filters.',
          },
        },
      ],
    },
    {
      id: 'safety',
      title: 'Safety, Warnings & Health',
      questions: [
        {
          id: 'general_warning',
          label: 'General Warning',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Keep out of reach of children. For external use only. If swallowed, seek medical advice.',
            howTo: ['Short, clear hazard warnings (1–2 sentences). Use your packaging phrasing if available.'],
            why: 'Safety warnings are legally required in many markets and protect consumers.',
          },
        },
        {
          id: 'hazardous_materials',
          label: 'Hazardous Materials Present?',
          type: 'boolean',
          required: true,
          guidance: {
            howTo: ['If Yes, describe the material, concentration, and hazard class, and upload an SDS/MSDS.'],
            why: 'Hazard declaration is essential for transport, storage, and warehouse handling.',
          },
        },
        {
          id: 'sds_upload',
          label: 'Upload Safety Data Sheet (SDS/MSDS)',
          type: 'file',
          required: false,
          acceptedTypes: DOC_TYPES,
          maxSizeMB: 10,
          conditional: { dependsOn: 'hazardous_materials', showWhen: [true] },
          guidance: {
            why: 'Required to safely transport and store hazardous goods.',
          },
        },
        {
          id: 'cautions',
          label: 'Cautions',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Avoid contact with eyes. Store below 25 °C. Not for children under 3 without advice.',
            howTo: ['Handling and usage cautions in short bullets. Add first-aid advice if relevant.'],
            why: 'Prevents misuse and supports liability protection.',
          },
        },
        {
          id: 'allergies',
          label: 'Allergies / Sensitivities',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'May contain traces of tree nuts; processed in a facility that handles peanuts and sesame.',
            howTo: ['Mention known allergens and cross-contamination risks; be explicit about severity.'],
            why: 'Protects allergic consumers and prevents legal exposure.',
          },
        },
        {
          id: 'contraindications',
          label: 'Notes for pregnant persons / those on medication / with medical conditions',
          type: 'textarea',
          required: false,
          guidance: {
            example: 'For pregnant persons: consult a healthcare professional before use. May interact with blood thinners.',
            howTo: ['State known contraindications or advice. If none, say “No known contraindications — advise medical consult.”'],
            why: 'Safety for vulnerable groups builds trust and reduces claims.',
          },
        },
        {
          id: 'efficacy_summary',
          label: 'Efficacy Test Results (summary)',
          type: 'textarea',
          required: false,
          guidance: {
            example: 'Independent lab (LabX) confirms 95% purity and oxidative stability exceeding industry standard.',
            howTo: ['Summarise the key outcome in one sentence; upload the full report below.'],
            why: 'Efficacy proof supports marketing claims and B2B purchase decisions.',
          },
        },
        {
          id: 'efficacy_upload',
          label: 'Efficacy Test Results (upload lab evidence)',
          type: 'file',
          required: false,
          acceptedTypes: ['application/pdf'],
          maxSizeMB: 10,
          guidance: {
            howTo: ['Upload certified lab reports or QC reports. PDF preferred.'],
            why: 'Verifies claims and supports quality scoring on the platform.',
          },
        },
        {
          id: 'toxicology_upload',
          label: 'Toxicology / Microbial Test (optional)',
          type: 'file',
          required: false,
          acceptedTypes: ['application/pdf'],
          maxSizeMB: 10,
          guidance: {
            why: 'Required for some retail channels and can accelerate export approval.',
          },
        },
      ],
    },
    {
      id: 'compliance',
      title: 'Certifications & Compliance',
      questions: [
        {
          id: 'afcfta_compliant',
          label: 'AfCFTA Compliant?',
          type: 'select',
          required: true,
          options: YES_NO_UNKNOWN,
          guidance: { why: 'Determines eligibility for intra-African trade under AfCFTA rules of origin.' },
        },
        {
          id: 'agm_compliant',
          label: 'AGM Standard Compliant?',
          type: 'select',
          required: true,
          options: YES_NO_UNKNOWN,
        },
        {
          id: 'eu_compliant',
          label: 'EU Standard Compliant?',
          type: 'select',
          required: true,
          options: YES_NO_UNKNOWN,
        },
        {
          id: 'son_certified',
          label: 'SON Certification?',
          type: 'select',
          required: true,
          options: YES_NO_UNKNOWN,
        },
        {
          id: 'fda_approved',
          label: 'FDA Approved?',
          type: 'select',
          required: true,
          options: YES_NO_UNKNOWN,
          guidance: {
            howTo: ['Choose Yes/No/Unknown for each standard. If Yes, upload the certificate below.'],
            why: 'Certifications determine market eligibility, promotions, and buyer confidence.',
          },
        },
        {
          id: 'halal_certified',
          label: 'Halal Certified?',
          type: 'select',
          required: false,
          options: ['Yes', 'In Process', 'No', 'Not applicable'],
          guidance: {
            howTo: ['Select Yes only if you hold valid Halal certification, and upload it below.'],
            why: 'Halal status is a key buyer filter across many African and export markets.',
          },
        },
        {
          id: 'organic_certified',
          label: 'Organic Certified?',
          type: 'select',
          required: false,
          options: ['Yes', 'In Process', 'No', 'Not applicable'],
          guidance: {
            howTo: ['Select Yes only with valid organic certification from a recognised body; upload it below.'],
            why: 'Certified-organic products command premium pricing and unlock dedicated buyer filters.',
          },
        },
        {
          id: 'quality_marks',
          label: 'Certifications or Quality Marks',
          type: 'multiselect',
          required: false,
          options: ['Organic', 'Eco-Friendly', 'Fair Trade', 'Halal', 'Kosher', 'ISO', 'Other'],
          guidance: {
            howTo: ['Tick the marks you hold and upload the certificate. For “Other”, name it in the notes.'],
            why: 'Badges like Organic and Fair Trade increase conversion and enable product filters.',
          },
        },
        {
          id: 'certification_docs',
          label: 'Upload Certification Documents',
          type: 'file',
          required: false,
          acceptedTypes: DOC_TYPES,
          maxSizeMB: 10,
          guidance: {
            howTo: ['Upload scans showing the certifying body, registration number, and validity period.'],
            why: 'We verify these before awarding certification badges or premium listing features.',
          },
        },
      ],
    },
    {
      id: 'traceability',
      title: 'Traceability & Sustainability',
      questions: [
        {
          id: 'batch_number',
          label: 'Production Batch / Lot Number',
          type: 'text',
          required: false,
          placeholder: 'e.g. B20240715-01',
          guidance: {
            howTo: ['Use your internal batch convention. If none, state “Not applicable”.'],
            why: 'Essential for recalls, quality tracking, and verifying production lots.',
          },
        },
        {
          id: 'traceability_statement',
          label: 'Traceability Statement',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Each bottle carries a lot number tracing back to farm supplier codes; avocados from Farm ID: AKW-22.',
            howTo: ['Explain how a buyer or AZM can trace the product (lot numbers, supplier codes, farm IDs, QR links).'],
            why: 'Traceability builds consumer trust and is often required for export or regulatory compliance.',
          },
        },
        {
          id: 'sourcing_info',
          label: 'Sourcing Information',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Raw avocados sourced from smallholder farms in Akwa Ibom; oil processed in Lagos.',
            howTo: ['State where raw materials come from, local/imported, and key supplier details.'],
            why: 'Buyers care about origin; we use this for origin claims and storytelling.',
          },
        },
        {
          id: 'sustainability_claims',
          label: 'Sustainability Claims',
          type: 'textarea',
          required: false,
          guidance: {
            example: 'Packaging is 100% recyclable; processing plant runs on solar energy.',
            howTo: ['Be specific (recyclable type, % recycled). For carbon-neutral/compostable, attach proof.'],
            why: 'Sustainability matters to buyers; claims must be verifiable.',
          },
        },
        {
          id: 'fair_trade',
          label: 'Fair Trade / Ethical Production',
          type: 'select',
          required: false,
          options: YES_NO_UNKNOWN,
          guidance: {
            howTo: ['If Yes, attach supporting docs or a short policy description.'],
            why: 'Ethical sourcing improves buyer trust and access to premium markets.',
          },
        },
      ],
    },
    {
      id: 'pricing',
      title: 'Pricing & Supply',
      questions: [
        {
          id: 'pricing_currency',
          label: 'Pricing currency',
          type: 'select',
          required: true,
          options: TRADE_CURRENCIES,
          guidance: {
            example: 'NGN — Nigerian Naira',
            howTo: ['Choose the currency your prices below are quoted in.'],
            why: 'Buyers can’t compare quotes without knowing the currency — this powers correct price display and conversion.',
          },
        },
        {
          id: 'bulk_price',
          label: 'Bulk price per unit',
          type: 'text',
          required: true,
          placeholder: 'e.g. 1,800.00 (Excl. VAT)',
          guidance: {
            example: '1,800.00',
            howTo: ['Per-unit bulk price in the currency selected above. Note if VAT is excluded.'],
            why: 'Buyers compare on price and we display pricing; errors cause trust issues.',
          },
        },
        {
          id: 'moq',
          label: 'Minimum Order Quantity (MOQ)',
          type: 'number',
          required: true,
          placeholder: 'e.g. 100',
          guidance: {
            example: '100 units (500 ml bottles)',
            howTo: ['State units and pack size. Clarify if sample orders are allowed and the sample MOQ.'],
            why: 'Buyers need MOQ to plan purchases, shipping, and cost per order.',
          },
        },
        {
          id: 'max_capacity',
          label: 'Maximum Supply Capacity per Month',
          type: 'number',
          required: true,
          placeholder: 'e.g. 5000',
          guidance: {
            example: '5,000 units/month steady; peak 8,000 (Nov–Jan).',
            howTo: ['Give realistic monthly figures and note seasonal constraints or ramp time.'],
            why: 'Used for supply planning, large orders, and inventory forecasting.',
          },
        },
        {
          id: 'delivery_time',
          label: 'Expected Delivery Time',
          type: 'text',
          required: true,
          placeholder: 'e.g. 7–14 business days local; 4–6 weeks international',
          guidance: {
            howTo: ['Lead time in days/weeks. Distinguish local vs international. Include production lead if made-to-order.'],
            why: 'Accurate lead times prevent buyer frustration and allow logistical planning.',
          },
        },
        {
          id: 'payment_terms',
          label: 'Payment Terms',
          type: 'textarea',
          required: true,
          placeholder: 'Net terms, COD, bank transfer, etc.',
          guidance: {
            example: '30% deposit, 70% before shipment; bank transfer preferred.',
            howTo: ['Specify accepted payment methods. If unfamiliar with trade terms, use plain language: “50% upfront, 50% on delivery.”'],
            why: 'Clarity reduces disputes and speeds transaction set-up for buyers.',
          },
        },
        {
          id: 'incoterms',
          label: 'Preferred Incoterms',
          type: 'select',
          required: false,
          options: INCOTERMS,
          guidance: {
            example: 'FOB — Free On Board',
            howTo: [
              'Pick the delivery term you prefer to quote on.',
              'EXW = buyer arranges everything; DDP = you deliver duty-paid. Pick “Not sure yet” if unsure.',
            ],
            why: 'Incoterms define who pays freight, insurance, and duties — essential for cross-border price comparison.',
          },
        },
        {
          id: 'sample_available',
          label: 'Are samples available?',
          type: 'boolean',
          required: false,
          guidance: {
            howTo: ['Select Yes if buyers can request a sample before placing a bulk order.'],
            why: 'Sampling is a normal first step in B2B sourcing and builds buyer confidence.',
          },
        },
        {
          id: 'sample_price',
          label: 'Sample price & terms',
          type: 'text',
          required: false,
          placeholder: 'e.g. Free sample, buyer pays shipping',
          conditional: { dependsOn: 'sample_available', showWhen: [true] },
          guidance: {
            example: 'Free unit; buyer covers courier (~USD 30).',
            howTo: ['State the sample cost (or “free”) and who pays shipping.'],
            why: 'Sets clear expectations so buyers can request samples without back-and-forth.',
          },
        },
      ],
    },
    {
      id: 'brand',
      title: 'Brand & Marketing',
      questions: [
        {
          id: 'brand_story',
          label: 'Brand Story / Origin',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Founded in 2018 to support smallholder farmers in Eastern Nigeria; mission: sustainable healthy oils.',
            howTo: ['1–3 short paragraphs on founding, mission, and what makes the brand meaningful.'],
            why: 'Stories sell. Used on product pages, promos, and brand pages.',
          },
        },
        {
          id: 'usp',
          label: 'Unique Selling Proposition (USP)',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'The only locally cold-pressed avocado oil using same-day pressing to retain maximum nutrients.',
            howTo: ['1–2 sentences summing up your single biggest differentiator.'],
            why: 'Used in search filters, paid campaigns, and headline claims.',
          },
        },
        {
          id: 'comparative_advantage',
          label: 'Product Comparative Advantage',
          type: 'textarea',
          required: true,
          guidance: {
            howTo: ['Explain what you have (process, tech, access) that others typically don’t. Be specific and factual.'],
            why: 'Explains unique production strengths and supports premium positioning.',
          },
        },
        {
          id: 'competitive_advantage',
          label: 'Product Competitive Advantage',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Faster fulfilment (7 days), export-ready packaging, ISO-certified facility.',
            howTo: ['Explain how you outperform competitors (quality, speed, pricing, certifications, distribution).'],
            why: 'Convinces retailers and distributors to prefer your offering.',
          },
        },
        {
          id: 'is_new',
          label: 'Is this product new in the market?',
          type: 'boolean',
          required: true,
          guidance: {
            howTo: ['Yes if launched within the last 6 months; otherwise No. If Yes, give the expected launch date.'],
            why: 'New products may qualify for launch promotions or need extra verification.',
          },
        },
        {
          id: 'time_in_market',
          label: 'How long has it been in the market?',
          type: 'text',
          required: true,
          placeholder: 'e.g. 2 years (Launched March 2022)',
          guidance: {
            howTo: ['Give a timeframe or exact launch date (YYYY-MM) and notable milestones.'],
            why: 'Indicates product maturity and risk for bulk buyers.',
          },
        },
        {
          id: 'where_sold',
          label: 'Where else is the product listed or sold?',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Jumia Nigeria, KeyLokz Supermarkets (Lagos), exported to Ghana via distributor X.',
            howTo: ['List marketplaces, retail chains, distributors, or export markets. Include URLs if available.'],
            why: 'Shows market penetration and helps us assess competitiveness and exclusivity.',
          },
        },
        {
          id: 'differentiators',
          label: 'Key Differentiators / Highlights',
          type: 'textarea',
          required: true,
          guidance: {
            example: '• Cold-pressed • Non-GMO • 24-month shelf life • Recyclable glass bottle • ISO-certified facility',
            howTo: ['3–6 measurable bullet points; avoid vague adjectives.'],
            why: 'Used as quick facts and filters on the product page; drives conversion.',
          },
        },
        {
          id: 'target_market',
          label: 'Target Market',
          type: 'textarea',
          required: true,
          guidance: {
            example: 'Urban health-conscious adults 25–45; boutique restaurants; skincare formulators.',
            howTo: ['Describe demographic, B2B or B2C, and geographic focus.'],
            why: 'Helps on-site recommendations, targeted campaigns, and category placement.',
          },
        },
        {
          id: 'promo_materials',
          label: 'Promotional Materials',
          type: 'file',
          required: false,
          acceptedTypes: ['application/pdf', ...IMAGE_TYPES, 'video/mp4'],
          maxSizeMB: 50,
          guidance: {
            howTo: ['Upload brochures, lifestyle images, or short demo videos (MP4). Add captions for context.'],
            why: 'Marketing assets accelerate listing quality and promotional opportunities.',
          },
        },
        {
          id: 'social_handles',
          label: 'Social Media Handles / Website',
          type: 'text',
          required: false,
          placeholder: 'e.g. Instagram: @johndanfoods | https://johndanfoods.ng',
          guidance: {
            howTo: ['Full URLs or exact handles. Ensure channels are active and consistent with brand claims.'],
            why: 'Used for verification and customer reference; builds multi-channel trust.',
          },
        },
      ],
    },
    {
      id: 'declaration',
      title: 'Declaration & Consent',
      description:
        'I hereby declare that the information provided is true, accurate, and complete to the best of my knowledge. I understand Afrizonemart.com reserves the right to verify any details and may reject listings with false information. I acknowledge that any certifications, trademarks, or patents claimed are legally held or authorized by my company.',
      questions: [
        {
          id: 'declaration_agree',
          label: 'I confirm the information above is true, accurate, and complete.',
          type: 'boolean',
          required: true,
          guidance: {
            why: 'This is your legal attestation — it protects both you and Afrizonemart, and is required before a product goes live.',
          },
        },
        {
          id: 'representative_name',
          label: 'Full Name of Authorized Representative',
          type: 'text',
          required: true,
          placeholder: 'e.g. Jane Doe — Managing Director',
          guidance: { howTo: ['Type your full name and job title.'] },
        },
        {
          id: 'declaration_date',
          label: 'Date',
          type: 'date',
          required: true,
          guidance: { howTo: ['Pick the date of submission.'] },
        },
      ],
    },
  ],
};

/** All required question ids — used for completion % and submit validation. */
export function requiredQuestionIds(config: PIQFormConfig): string[] {
  return config.sections.flatMap((s) =>
    s.questions.filter((q) => q.required).map((q) => q.id),
  );
}
