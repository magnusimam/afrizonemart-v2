/// 9-stage definition shared between server and client. Lives in its
/// own non-'use client' file so server components can import it
/// without Next.js complaining about calling .map() on a "client value."
///
/// Note: an earlier draft had a 10th stage at the front, "Supplier
/// Discovery & Initial Contact." That stage was AZM-side scouting
/// (admins finding suppliers), not something the supplier saw or
/// interacted with — so it was removed from the supplier-facing
/// pipeline. Discovery still happens internally; it just doesn't
/// show up on the supplier's progress bar.

export interface StageDef {
  number: number;
  short: string; // mobile / compact label
  long: string; // full name
}

export const SUPPLIER_STAGES: StageDef[] = [
  { number: 1, short: 'EoI', long: 'Expression of Interest' },
  { number: 2, short: 'Profile', long: 'Registration & Profiling' },
  { number: 3, short: 'PIQ', long: 'Product Information Questionnaire' },
  { number: 4, short: 'Orientation', long: 'Supplier Orientation' },
  { number: 5, short: 'Audit', long: 'Product-Commodity Audit (SP-CA)' },
  { number: 6, short: 'Partnership', long: 'Formalize Partnership' },
  { number: 7, short: 'Activation', long: 'Activation & Listing' },
  { number: 8, short: 'Trade', long: 'Procurement & Trade' },
  { number: 9, short: 'Engagement', long: 'Continuous Engagement' },
];

/// Single source of truth for "which stage is PIQ?" — used by stage-
/// advance logic, dashboard messaging, and admin tooling.
export const PIQ_STAGE_NUMBER = 3;
export const TOTAL_STAGES = SUPPLIER_STAGES.length; // 9
