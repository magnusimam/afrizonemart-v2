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
  /// 2026-05-16 Phase 2 perks. Optional in the storefront type so
  /// a stale build hitting an older API doesn't crash.
  birthdayBonusBlue?: number;
  birthdayBonusGold?: number;
  birthdayBonusVip?: number;
  birthdayBonusAmbassador?: number;
  birthdayBonusDorime?: number;
  referralCapBlue?: number;
  referralCapGold?: number;
  referralCapVip?: number;
  referralCapAmbassador?: number;
  referralCapDorime?: number;
  referralPercent?: number;
  referralHoldDays?: number;
  refereeCouponNgn?: number;
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

/// 2026-05-16 Phase 2 — refer-a-friend summary. Returns the
/// customer's stable referral code + counts of pending/scheduled/
/// paid referrals + the live cap so the share page copy stays
/// accurate when admin tunes the config.
export interface ReferralSummaryDto {
  code: string;
  totalReferred: number;
  pending: number;
  scheduled: number;
  paidOut: number;
  totalCoinsEarned: number;
  capPerReferral: number;
  percentOfFirstOrder: number;
  holdDays: number;
}

export function getReferralSummary(): Promise<ReferralSummaryDto> {
  return apiFetchAuthed('/api/loyalty/referral-summary');
}

/// Referee's "₦500 off first order" coupon. Lazy-created server-side
/// on first call. 404 if the user wasn't referred by anyone.
export interface RefereeCouponDto {
  code: string;
  valueNgn: number;
  expiresAt: string;
}

export function getRefereeCoupon(): Promise<RefereeCouponDto> {
  return apiFetchAuthed('/api/loyalty/referral-coupon');
}
