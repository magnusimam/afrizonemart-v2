/**
 * The canonical 10-stage Afrizonemart supplier pipeline.
 *
 * Single source of truth for stage numbers + names, shared by the
 * supplier dashboard stage tracker, the progress bar, and anywhere else
 * that needs to talk about "where a supplier is" in the journey.
 *
 * Source: SUPPLIER_PORTAL_TRACKER.md + "AZM Supplier Network Onboarding
 * and Activation Framework". PIQ is Stage 4 (elevated to its own stage).
 *
 * Keep this list and `SUPPLIER_MAX_STAGE` in lockstep with the API's
 * `Supplier.maxStage` when the backend lands.
 */

export const SUPPLIER_MAX_STAGE = 10;

export interface SupplierStage {
  /** 1-10 */
  stage: number;
  /** Short name for the progress bar / chips. */
  name: string;
  /** One-line plain summary for tooltips and the current-stage card. */
  summary: string;
}

export const SUPPLIER_STAGES: SupplierStage[] = [
  {
    stage: 1,
    name: 'Discovery',
    summary: 'Initial contact between you and Afrizonemart.',
  },
  {
    stage: 2,
    name: 'Expression of Interest',
    summary: 'You formally tell us you want to join the network.',
  },
  {
    stage: 3,
    name: 'Registration & Profiling',
    summary: 'Your company profile, documents, and capacity are recorded.',
  },
  {
    stage: 4,
    name: 'Product Questionnaire',
    summary: 'You complete a PIQ for each product; our team reviews each one.',
  },
  {
    stage: 5,
    name: 'Orientation',
    summary: 'You learn how the platform, quality, and compliance work.',
  },
  {
    stage: 6,
    name: 'Product Audit',
    summary: 'Your products and samples are assessed for quality & compliance.',
  },
  {
    stage: 7,
    name: 'Partnership',
    summary: 'You review and sign the AZM Supplier Agreement.',
  },
  {
    stage: 8,
    name: 'Activation & Listing',
    summary: 'Your approved products go live across AZM platforms.',
  },
  {
    stage: 9,
    name: 'Trade Engagement',
    summary: 'You receive purchase orders and fulfil live trade.',
  },
  {
    stage: 10,
    name: 'Continuous Engagement',
    summary: 'Ongoing performance, support, and growth programmes.',
  },
];

/** Lookup helper — returns the stage record or undefined. */
export function getStage(stage: number): SupplierStage | undefined {
  return SUPPLIER_STAGES.find((s) => s.stage === stage);
}

/** Where a stage opens. Stage 4 is managed product-by-product on the PIQ
 *  surface; every other stage has its own /stages/[n] page. */
export function stageHref(stage: number): string {
  return stage === 4 ? '/supplier/piqs' : `/supplier/stages/${stage}`;
}

/** A supplier may open stages up to (and including) their current one. */
export function isStageUnlocked(stage: number, currentStage: number): boolean {
  return stage <= currentStage;
}
