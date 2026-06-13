import { apiFetchAuthed } from './client';

/**
 * Client-side mirror of WrappedStatsV1 (api/src/modules/wrap/types.ts).
 *
 * Versioned by the `version` discriminator so the renderer can
 * gracefully degrade when the API ships a newer shape. Keep the
 * fields in lockstep — if you change one, change both.
 */

export type WrappedPersonality =
  | 'CONNECTOR'
  | 'PATRIOT'
  | 'EXPLORER'
  | 'CURATOR';

export interface WrappedStatsV1 {
  version: 1;
  personality: WrappedPersonality;
  personalityReason: string;

  totalOrders: number;
  totalProducts: number;
  uniqueCategoriesCount: number;
  uniqueCountriesCount: number;

  homeCountry: string | null;
  topOriginCountries: Array<{
    code: string;
    name: string;
    orderCount: number;
    sharePct: number;
  }>;

  carePackagesCount: number;
  carePackageDestinations: string[];

  topCategories: Array<{
    slug: string;
    name: string;
    orderCount: number;
    sharePct: number;
  }>;

  cultural: {
    eidWeekOrders: number;
    independenceDayWeekOrders: number;
    christmasWeekOrders: number;
    busiestMonth: { month: number; orders: number };
    quietestMonth: { month: number; orders: number };
    monthlyOrderCounts: number[];
  };

  smallBusinessesSupported: number;
  topSellers: Array<{
    brand: string;
    country: string | null;
    orderCount: number;
  }>;

  loyalty: {
    coinsEarned: number;
    coinsRedeemedNgn: number;
    finalTier: 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    percentileRank: number;
  };

  discoveries: Array<{
    productSlug: string;
    productName: string;
    productImage: string | null;
    why: string;
  }>;
}

export interface WrapYearStats {
  year: number;
  snapshots: number;
  visible: number;
  published: number;
}

export interface MockWrapInput {
  personality: WrappedPersonality;
  homeCountry?: string | null;
  totalOrders?: number;
}

export function adminWrapStats(): Promise<{ years: WrapYearStats[] }> {
  return apiFetchAuthed('/api/admin/wrap/stats');
}

export function adminWrapPreview(
  userId: string,
  year?: number,
): Promise<{ stats: WrappedStatsV1 | null; reason: string | null }> {
  const qs = year ? `?userId=${encodeURIComponent(userId)}&year=${year}` : `?userId=${encodeURIComponent(userId)}`;
  return apiFetchAuthed(`/api/admin/wrap/preview${qs}`);
}

export function adminWrapMockPreview(
  input: MockWrapInput,
): Promise<{ stats: WrappedStatsV1 }> {
  return apiFetchAuthed('/api/admin/wrap/mock-preview', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * POST /api/admin/wrap/backfill — re-index every eligible user (≥3
 * orders), not just recently active ones. Run before the Dec 1 drop
 * or to recover after an outage. Returns upsert counts.
 */
export function adminWrapBackfill(
  year?: number,
): Promise<{ eligible: number; upserted: number; skipped: number; failed: number }> {
  const qs = year ? `?year=${year}` : '';
  return apiFetchAuthed(`/api/admin/wrap/backfill${qs}`, { method: 'POST' });
}

/**
 * Customer-facing wrap state — mirror of the API's WrapMeResult
 * (afrizonemart-api/src/modules/wrap/me.service.ts). Discriminated by
 * `status`; the /wrapped page branches on it. Keep in lockstep.
 */
export type WrapMeResult =
  | { status: 'ready'; year: number; publishedAt: string; stats: WrappedStatsV1 }
  | { status: 'pending'; year: number; dropAt: string }
  | { status: 'locked'; year: number; ordersCount: number; minOrders: number }
  | { status: 'optedOut'; year: number };

/**
 * GET /api/wrap/me — the logged-in user's own wrap for a year.
 * Requires auth (apiFetchAuthed attaches the token + refresh dance).
 */
export function getWrapMe(year?: number): Promise<WrapMeResult> {
  const qs = year ? `?year=${year}` : '';
  return apiFetchAuthed(`/api/wrap/me${qs}`);
}
