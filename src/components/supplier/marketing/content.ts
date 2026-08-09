/**
 * Content for the public supplier marketing page (`/suppliers`).
 *
 * Kept as plain data — separate from the rendering components — for two
 * reasons:
 *  1. Copy is easy to edit and review without touching JSX.
 *  2. When the supplier portal grows, this is the natural seam to make
 *     the page admin-editable via the existing site-content system
 *     (Principle 4 — Schema-Driven; Principle 3 — Rules Engine).
 *
 * Icons are Lucide names resolved by the page; storing the component
 * reference here would couple this data module to React, so we keep it
 * as a string key and map it where it renders.
 */

export interface ValueProp {
  icon: string; // lucide-react icon name, mapped in the page
  title: string;
  body: string;
}

export interface HowItWorksStep {
  title: string;
  body: string;
}

export interface JourneyStage {
  /** 1-10. The canonical AZM supplier pipeline number. */
  stage: number;
  name: string;
  /** One-line plain-language summary. */
  tagline: string;
  /** What actually happens at this stage. */
  what: string;
  /** What the supplier is expected to do. */
  youDo: string;
  /** What Afrizonemart does. */
  weDo: string;
  icon: string;
}

export interface Faq {
  q: string;
  a: string;
}

/** Short, honest hero proof-points — no invented metrics. */
export const HERO_CHIPS: string[] = [
  'Made in Africa',
  'Delivered worldwide',
  '10-stage guided onboarding',
  'Dedicated supplier support',
];

export const VALUE_PROPS: ValueProp[] = [
  {
    icon: 'Globe2',
    title: 'Reach the whole world',
    body: 'Every product made in Africa, available to customers across the continent and beyond. List once — we put your products in front of buyers worldwide.',
  },
  {
    icon: 'Route',
    title: 'A guided journey, not a guess',
    body: 'A clear, 10-stage path from first contact to fully active. You always know exactly where you are and what comes next — no black boxes.',
  },
  {
    icon: 'LayoutDashboard',
    title: 'Tools built for suppliers',
    body: 'Your supplier dashboard tracks your stage, manages a questionnaire for each product, opens support tickets, and shows how your products perform.',
  },
  {
    icon: 'BadgeCheck',
    title: 'Quality buyers can trust',
    body: 'Every supplier is profiled, quality-audited, and verified before going live. The trust we build together is what turns browsers into buyers.',
  },
];

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    title: 'Apply',
    body: 'Submit an Expression of Interest with your company basics. It takes minutes and tells us you want to supply Afrizonemart.',
  },
  {
    title: 'Get profiled',
    body: 'Complete your company registration and profile — legal documents, certifications, capacity, and where you operate.',
  },
  {
    title: 'Submit your products',
    body: 'Fill a Product Information Questionnaire (PIQ) for each product. Our Merchandise Sourcing team reviews every one.',
  },
  {
    title: 'Get verified & listed',
    body: 'Complete orientation, host your facility visit, sign the partnership, and we start buying and listing your products.',
  },
  {
    title: 'Supply & grow',
    body: 'Receive our orders, fulfil them, and scale with performance insights and continuous support from our team.',
  },
];

/**
 * The full 10-stage supplier pipeline. This is the heart of the page —
 * the "whole process and steps" laid out transparently, the way Amazon
 * Seller Central explains its onboarding. Stage map is the canonical one
 * from SUPPLIER_PORTAL_TRACKER.md (PIQ is Stage 4).
 */
export const JOURNEY: JourneyStage[] = [
  {
    stage: 1,
    name: 'Discovery',
    tagline: 'We find you — or you find us.',
    what: 'Afrizonemart identifies promising African makers through outreach, referrals, and market scouting. This is the first handshake.',
    youDo: 'Express initial interest, or respond to our outreach.',
    weDo: 'Reach out, share what supplying Afrizonemart looks like, and answer your first questions.',
    icon: 'Handshake',
  },
  {
    stage: 2,
    name: 'Expression of Interest',
    tagline: 'Tell us you’re in.',
    what: 'A lightweight first step. You let us know you want to proceed and give us the basics about your business.',
    youDo: 'Submit a short Expression of Interest form — company name, contact, and what you make.',
    weDo: 'Review your interest and open the door to full registration.',
    icon: 'ClipboardList',
  },
  {
    stage: 3,
    name: 'Registration & Profiling',
    tagline: 'Build your company profile.',
    what: 'The full picture of your business: who you are, your production facility, and the documents that prove it. Anything you’ve already told us is filled in for you.',
    youDo: 'Share your legal documents, banking details, certifications, and your production facility details.',
    weDo: 'Verify everything and set up your supplier account.',
    icon: 'Building2',
  },
  {
    stage: 4,
    name: 'Product Questionnaire (PIQ)',
    tagline: 'Tell us about each product.',
    what: 'One guided questionnaire per product — broken into short steps, with an example and tips beside every field, and autosave so you never lose progress. Each PIQ is reviewed individually.',
    youDo: 'Complete a PIQ per product. If we request changes, you see the exact note on each field and resubmit.',
    weDo: 'Review each PIQ and approve it, or send precise, per-field feedback.',
    icon: 'FileSpreadsheet',
  },
  {
    stage: 5,
    name: 'Review Call & Orientation',
    tagline: 'Get reviewed, then get oriented.',
    what: 'A quick call to go through your PIQ and answer questions, followed by a live orientation that shows you how to succeed on Afrizonemart.',
    youDo: 'Join your scheduled review call and attend the orientation session.',
    weDo: 'Walk through your products with you and host orientation — slides and recording sent afterwards.',
    icon: 'GraduationCap',
  },
  {
    stage: 6,
    name: 'Facility Visit',
    tagline: 'We come see where it’s made.',
    what: 'You pick a date and our team visits your production site for a quality and capacity audit, captured on our digital form. The report decides what comes next.',
    youDo: 'Choose a visit slot and host our team at your facility.',
    weDo: 'Visit, audit, and produce a detailed report — then route you to Partnership or a Cally Valley readiness programme.',
    icon: 'ShieldCheck',
  },
  {
    stage: 7,
    name: 'Partnership',
    tagline: 'Make it official.',
    what: 'Review and accept the partnership agreement. Once it’s signed, our crew schedules your “It’s Made in Africa” production and Meet-the-Producer feature.',
    youDo: 'Review the terms and accept the agreement.',
    weDo: 'Formalise the partnership and book your documentary and producer story.',
    icon: 'FileSignature',
  },
  {
    stage: 8,
    name: 'Activation & Listing',
    tagline: 'Go live.',
    what: 'After your “It’s Made in Africa” shoot, re-upload your product photos to our simple spec — then we list your product and take it to buyers.',
    youDo: 'Upload listing-ready images following our photo guide.',
    weDo: 'Capture your story, then list your products for buyers worldwide.',
    icon: 'Rocket',
  },
  {
    stage: 9,
    name: 'Trade Engagement',
    tagline: 'Start trading.',
    what: 'Your first bulk order arrives — or you start with samples. Orders flow and trade begins.',
    youDo: 'Confirm and fulfil orders, or send samples to start.',
    weDo: 'Place orders, handle payments, and support fulfilment and logistics.',
    icon: 'PackageCheck',
  },
  {
    stage: 10,
    name: 'Continuous Engagement',
    tagline: 'Grow with us.',
    what: 'An ongoing partnership of repeat orders, performance insights, and room to grow your range — and you unlock the verified Afrizonemart Supplier badge.',
    youDo: 'Keep delivering, add new products, and grow.',
    weDo: 'Share insights, support you, and help you scale across markets.',
    icon: 'TrendingUp',
  },
];

export const FAQS: Faq[] = [
  {
    q: 'Who can become an Afrizonemart supplier?',
    a: 'Brands, farms, manufacturers, co-ops, and creative entrepreneurs producing goods made in Africa. If you make it in Africa, we want to buy it and take it to the world.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'It depends on your readiness. The journey has 10 stages — most of the time is spent on profiling, completing a questionnaire for each product, and the quality audit. You always see exactly which stage you are in.',
  },
  {
    q: 'Do I fill a form for every product?',
    a: 'Yes. You complete one Product Information Questionnaire (PIQ) per product, and each is reviewed individually. You only need your first products approved to advance — then you can keep adding more whenever you like.',
  },
  {
    q: 'What documents and information will I need?',
    a: 'Typically your company registration, relevant certifications or regulatory approvals (for example NAFDAC where it applies), banking details, and product information with photos. We tell you exactly what is needed at each stage.',
  },
  {
    q: 'What support do I get during onboarding?',
    a: 'Dedicated onboarding support throughout, plus per-product help: if you get stuck on any questionnaire, you can open a support ticket about that specific product right from your dashboard.',
  },
  {
    q: 'What does it cost to join?',
    a: 'Commercial terms are shared and agreed during onboarding, before you formalize the partnership. You will always know the terms before you commit.',
  },
];
