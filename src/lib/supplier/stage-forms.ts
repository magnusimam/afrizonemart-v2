/**
 * Form configs for the supplier-input stages of the journey. Same
 * schema-driven shape as the PIQ (`PIQFormConfig`) so they render through
 * the same form engine (Principle 4 — schema-driven; one engine, many
 * forms).
 *
 * - Stage 1 Discovery  → DISCOVERY_FORM (how they found us)
 * - Stage 2 EoI        → EOI_FORM (from the real AZM EoI Google Form)
 * - Stage 3 Profiling  → PROFILE_FORM (company registration & profile)
 *
 * When the API lands these become editable records keyed to the supplier;
 * for now the engine auto-saves locally.
 */
import type { PIQFormConfig } from '@/lib/supplier/piq-config';

/** Stage 1 — Discovery. Light touch: how the supplier found the programme. */
export const DISCOVERY_FORM: PIQFormConfig = {
  category: 'DISCOVERY',
  label: 'Discovery',
  version: 1,
  sections: [
    {
      id: 'discovery',
      title: 'How you found us',
      description:
        'A quick hello. Tell us how you came across the Afrizonemart Supplier Network and what interests you.',
      questions: [
        {
          id: 'how_heard',
          label: 'How did you hear about the AZM Supplier Network?',
          type: 'select',
          required: true,
          options: [
            'AZM Website',
            'Referral',
            'Trade Fair',
            'Social Media',
            'Partner workshops',
            'Other',
          ],
        },
        {
          id: 'how_heard_detail',
          label: 'If a referral or “Other”, who or where? (optional)',
          type: 'text',
          required: false,
          placeholder: 'e.g. Referred by a partner cooperative',
        },
      ],
    },
  ],
};

const BUSINESS_TYPES = [
  'I/We engage in farming',
  'I/We have a factory (e.g. oil mills, grinders, rice mills)',
  'I/We engage in manufacturing (e.g. food & beverage, leather processing, FMCGs)',
  'I/We engage in artisanal production (e.g. handcrafts, fashion, shoes)',
  'Other',
];

const CERTIFIED_OPTIONS = ['Yes', 'Not yet but intend to', 'Started but not completed', 'No', 'Not sure'];

/** Stage 2 — Expression of Interest. Mirrors the AZM EoI Google Form. */
export const EOI_FORM: PIQFormConfig = {
  category: 'EOI',
  label: 'Expression of Interest',
  version: 1,
  sections: [
    {
      id: 'business_contact',
      title: 'Business & contact',
      questions: [
        { id: 'business_name', label: 'Full name of business / cooperative / association', type: 'text', required: true },
        { id: 'contact_name', label: 'Primary contact person’s name', type: 'text', required: true },
        { id: 'contact_email', label: 'Primary contact person’s email address', type: 'text', required: true, placeholder: 'name@company.com' },
        { id: 'contact_phone', label: 'Primary contact phone number (with country code)', type: 'text', required: true, placeholder: '+234 …' },
        { id: 'physical_address', label: 'Physical address (country, city, street)', type: 'textarea', required: true },
        { id: 'state_country', label: 'State & country', type: 'text', required: true },
        { id: 'web_social', label: 'Website or social media handles (LinkedIn, Facebook, Instagram, etc.)', type: 'textarea', required: false },
      ],
    },
    {
      id: 'business_product',
      title: 'Business & product information',
      questions: [
        { id: 'business_type', label: 'What type of business? Choose all that apply.', type: 'multiselect', required: true, options: BUSINESS_TYPES },
        { id: 'product_count', label: 'How many products do you have?', type: 'number', required: false },
        { id: 'product_list', label: 'List your different types of products', type: 'textarea', required: true, placeholder: 'One per line' },
        { id: 'product_images', label: 'Upload your product images', type: 'file', required: false, acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB: 20 },
        { id: 'raw_materials', label: 'From which city/country(s) do you source raw materials? (per product, including farm inputs)', type: 'textarea', required: true },
        { id: 'certified', label: 'Are any of your products certified (e.g. Fair Trade, Organic, ISO, Phytosanitary)?', type: 'select', required: true, options: CERTIFIED_OPTIONS },
      ],
    },
    {
      id: 'compliance_readiness',
      title: 'Compliance & readiness',
      questions: [
        {
          id: 'aware_of',
          label: 'Are you aware of any of the following?',
          type: 'multiselect',
          required: false,
          // NOTE: confirm the exact checklist from AZM — placeholders from the compliance docs.
          options: [
            'AfCFTA rules of origin',
            'NAFDAC / SON certification requirements',
            'Export documentation requirements',
            'Product standardization & quality requirements',
            'None of the above',
          ],
        },
        { id: 'accept_packaging_inputs', label: 'Are you willing to accept inputs on labeling and packaging improvements from AZM?', type: 'boolean', required: true },
        { id: 'attend_clinic', label: 'Are you willing to attend AZM’s capacity-building clinic on standardization and product improvement with CALLYVALLEY?', type: 'boolean', required: true },
        { id: 'exclusive_line', label: 'Will you consider a product line exclusively made for AZM?', type: 'boolean', required: true },
      ],
    },
    {
      id: 'declaration',
      title: 'Declaration',
      questions: [
        {
          id: 'declaration',
          label:
            'I confirm that all the information provided is accurate to the best of my knowledge and I am interested in formally joining the Afrizonemart Supplier Network.',
          type: 'boolean',
          required: true,
        },
      ],
    },
  ],
};

/** Stage 3 — Registration & Profiling. Company record + key documents. */
export const PROFILE_FORM: PIQFormConfig = {
  category: 'PROFILE',
  label: 'Registration & Profiling',
  version: 1,
  sections: [
    {
      id: 'company',
      title: 'Company details',
      questions: [
        { id: 'legal_name', label: 'Registered legal name', type: 'text', required: true },
        { id: 'registration_number', label: 'Business registration / CAC number', type: 'text', required: true },
        { id: 'tax_id', label: 'Tax identification number (TIN)', type: 'text', required: false },
        { id: 'year_established', label: 'Year established', type: 'number', required: false },
        { id: 'num_employees', label: 'Number of employees', type: 'number', required: false },
      ],
    },
    {
      // Facility info feeds the later Facility Visit stage. Product-level
      // capacity & destination markets are intentionally NOT here — they're
      // asked per product in the PIQ, so we don't ask twice.
      id: 'facility',
      title: 'Production facility',
      description:
        'Where you produce — this is what our team uses to plan your facility visit.',
      questions: [
        { id: 'factory_type', label: 'Facility type', type: 'select', required: true, options: ['Primary (finished goods)', 'Component (parts / packaging)'] },
        { id: 'factory_address', label: 'Factory / production address', type: 'textarea', required: true },
      ],
    },
    {
      // Company-level only. Product certifications live in the PIQ, so the
      // duplicate certifications upload has been removed from here.
      id: 'banking_docs',
      title: 'Banking & documents',
      questions: [
        { id: 'bank_details', label: 'Banking details (bank, account name, account number)', type: 'textarea', required: true },
        { id: 'business_license', label: 'Upload business license / registration certificate', type: 'file', required: true, acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'], maxSizeMB: 10 },
      ],
    },
  ],
};

/** Stage number → form config, for the stages that are supplier-filled. */
export const STAGE_FORMS: Record<number, { config: PIQFormConfig; submitLabel: string; submittedMessage: string }> = {
  1: {
    config: DISCOVERY_FORM,
    submitLabel: 'Save & continue',
    submittedMessage: 'Thanks! Your details have been saved.',
  },
  2: {
    config: EOI_FORM,
    submitLabel: 'Submit Expression of Interest',
    submittedMessage:
      'Thank you — your Expression of Interest has been recorded. Our Merchandise Sourcing Unit will be in touch.',
  },
  3: {
    config: PROFILE_FORM,
    submitLabel: 'Submit profile',
    submittedMessage: 'Your company profile has been saved for review.',
  },
};
