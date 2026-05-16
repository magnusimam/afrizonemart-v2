import { apiFetchAuthed } from './client';
import type { LoyaltyTier, LoyaltyTransactionType } from './admin';

/**
 * Customer-facing loyalty API client (Tracker #44 PR 2).
 *
 * `getMyLoyalty()` returns the authenticated user's full loyalty
 * state in one round-trip. The shape varies — when the user has
 * never made a paid order yet, the API returns
 * `{ enrolled: false, config }` so the dashboard can render a
 * teaser. Otherwise it returns the account + recent ledger +
 * tier-progress + config.
 */

export interface LoyaltyTransactionDto {
  id: string;
  accountId: string;
  delta: number;
  balanceAfter: number;
  type: LoyaltyTransactionType;
  causeOrderId: string | null;
  causeAdminId: string | null;
  reason: string | null;
  expiresAt: string | null;
  expiredAt: string | null;
  createdAt: string;
}

export interface PublicLoyaltyConfigDto {
  coinValueNgn: number;
  welcomeBonusCoins: number;
  maxOrderRedeemPercent: number;
  minRedeemCoins: number;
  coinExpiryMonths: number;
  spendWindowMonths: number;
  tier2GoldThreshold: number;
  tier3VipThreshold: number;
  tier4AmbassadorThreshold: number;
  tier5DorimeThreshold: number;
}

export interface LoyaltyTierProgressDto {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  ngnUntilNextTier: number;
  percentToNextTier: number;
}

export interface LoyaltyMeAccountDto {
  id: string;
  coinBalance: number;
  currentTier: LoyaltyTier;
  lifetimeCoinsEarned: number;
  lifetimeCoinsRedeemed: number;
  enrolledAt: string;
}

/// 2026-05-16 — Phase 1 gamification additions: rollingPaidOrders +
/// expiring batch. Both optional so an older API build still hydrates
/// the page without crashing the new components.
export interface ExpiringCoinsDto {
  coins: number;
  expiresAt: string;
}

export type LoyaltyMeResponse =
  | {
      enrolled: false;
      config: PublicLoyaltyConfigDto;
    }
  | {
      enrolled: true;
      account: LoyaltyMeAccountDto;
      transactions: LoyaltyTransactionDto[];
      rollingSpend: number;
      rollingPaidOrders?: number;
      tierProgress: LoyaltyTierProgressDto;
      expiring?: ExpiringCoinsDto | null;
      config: PublicLoyaltyConfigDto;
    };

export function getMyLoyalty(): Promise<LoyaltyMeResponse> {
  return apiFetchAuthed('/api/loyalty/me');
}
