/**
 * Supplier support / "we're always here to help" details.
 *
 * Centralised so the hotline, email, and hours render identically on the
 * marketing page, the dashboard help panel, and the PIQ support flow. A
 * single edit here updates every "contact us" surface (Principle 6 —
 * separation; Principle 3 — config, not hardcoded scattering).
 *
 * Sources: AZM Supplier Network Overview + Onboarding Framework.
 */

export const SUPPLIER_SUPPORT = {
  hotline: '+234 703 614 9590',
  hotlineHref: 'tel:+2347036149590',
  /** Same line — suppliers can call or message it on WhatsApp. */
  whatsapp: '+234 703 614 9590',
  whatsappHref: 'https://wa.me/2347036149590',
  email: 'corporate@afrizonemart.com',
  emailHref: 'mailto:corporate@afrizonemart.com',
  hours: 'Mon–Sat, 9am–6pm WAT (GMT+1)',
  /** The team that owns supplier relations end to end. */
  desk: 'Supplier Relations Desk',
} as const;

/**
 * Frequently asked questions for the supplier support hub. Centralised so
 * the same answers can also feed an in-PIQ help drawer or a public FAQ
 * later (Principle 3 — config, not scattered copy).
 */
export interface SupplierFAQ {
  q: string;
  a: string;
}

export const SUPPLIER_FAQS: SupplierFAQ[] = [
  {
    q: 'How do I start supplying Afrizonemart?',
    a: 'Your journey runs through 10 stages, from Discovery to live trade. After you sign in, the dashboard shows exactly where you are and what to do next — start by completing your Expression of Interest and company profile, then submit a Product Information Questionnaire (PIQ) for your first product.',
  },
  {
    q: 'What is a PIQ, and do I need one for every product?',
    a: 'A Product Information Questionnaire (PIQ) captures everything buyers and our team need to list a product — identification, specs, safety, compliance, pricing, and branding. Yes: one PIQ per product. You advance to the next stage once your first PIQ is approved.',
  },
  {
    q: 'Do I have to finish a PIQ in one sitting?',
    a: 'No. The form saves automatically as you type and is broken into short sections, so you can leave at any point and pick up exactly where you left off.',
  },
  {
    q: 'What documents and certifications will I need?',
    a: 'It depends on your product and target markets, but commonly: business registration, NAFDAC/NAQS registration where applicable, MANCAP/SON certification, and quality marks (ISO/QMS, HACCP). For cross-border trade, AfCFTA rules-of-origin documentation helps. Our team guides you through exactly what is required at the Product Audit stage.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'It largely depends on how quickly you complete your PIQ and provide documents. Identification and review steps are handled by our Merchandise Sourcing Unit and Supplier Relations Desk — staying responsive keeps your journey moving.',
  },
  {
    q: 'What is Project Voltron?',
    a: 'Project Voltron is our on-demand business-support layer: legal, taxation & e-invoicing, insurance & risk, product management, certification readiness, and Made-in-Africa storytelling. It is there so you are supported across the whole journey, not just at sign-up.',
  },
  {
    q: 'Will my products reach markets beyond my country?',
    a: 'Yes — that is the goal. We help you progress through market-readiness tiers: Bronze (domestic-ready), Silver (AfCFTA-ready), and Gold (global-market-ready), supporting you with the certifications and rules-of-origin needed at each level, and we take your products to those markets.',
  },
  {
    q: 'How do I get help while filling a form?',
    a: 'Every question has a “How to answer” tip beside it with an example and guidance. If you are still stuck, call or WhatsApp the Supplier Relations Desk on the number above during business hours.',
  },
];

/**
 * Project Voltron — AZM's on-demand business support services. We surface
 * these to reassure suppliers they're supported across the whole journey,
 * not just at sign-up.
 *
 * Market-readiness tiers: Bronze = Domestic-ready, Silver = AfCFTA-ready,
 * Gold = Global-market-ready.
 */
export interface VoltronService {
  title: string;
  blurb: string;
  /** lucide-react icon name, mapped where it renders. */
  icon: string;
}

export const VOLTRON_SERVICES: VoltronService[] = [
  {
    title: 'Legal interlocutor',
    blurb: 'Consumer protection, negotiation, partnerships, and regulator liaison — so you never face the paperwork alone.',
    icon: 'Scale',
  },
  {
    title: 'Taxation & e-invoicing',
    blurb: 'Tax technology, e-invoicing, audit, and compliance support to keep your trade clean across borders.',
    icon: 'Receipt',
  },
  {
    title: 'Insurance & risk',
    blurb: 'Liability cover and risk guidance to protect your business as you scale.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Product management',
    blurb: 'Recalls, customer feedback, R&D, and customer communication — managed with you, for the life of the product.',
    icon: 'Boxes',
  },
  {
    title: 'Certification readiness',
    blurb: 'MANCAP/SON, NAFDAC/NAQS, ISO/QMS, and AfCFTA rules-of-origin — we help you get audit-ready.',
    icon: 'BadgeCheck',
  },
  {
    title: 'Made-in-Africa storytelling',
    blurb: 'Meet-the-producer features, product storytelling, and "How it’s made" videos that help your brand sell.',
    icon: 'Clapperboard',
  },
];
