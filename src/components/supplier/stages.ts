/// 10-stage definition shared between server and client. Lives in its
/// own non-'use client' file so server components can import it
/// without Next.js complaining about calling .map() on a "client value."

export interface StageDef {
  number: number;
  short: string; // mobile / compact label, e.g. "EoI"
  long: string; // full name, e.g. "Expression of Interest"
}

export const SUPPLIER_STAGES: StageDef[] = [
  { number: 1, short: 'Discovery', long: 'Supplier Discovery & Initial Contact' },
  { number: 2, short: 'EoI', long: 'Expression of Interest' },
  { number: 3, short: 'Profile', long: 'Registration & Profiling' },
  { number: 4, short: 'PIQ', long: 'Product Information Questionnaire' },
  { number: 5, short: 'Orientation', long: 'Supplier Orientation' },
  { number: 6, short: 'Audit', long: 'Product-Commodity Audit (SP-CA)' },
  { number: 7, short: 'Partnership', long: 'Formalize Partnership' },
  { number: 8, short: 'Activation', long: 'Activation & Listing' },
  { number: 9, short: 'Trade', long: 'Procurement & Trade' },
  { number: 10, short: 'Engagement', long: 'Continuous Engagement' },
];
