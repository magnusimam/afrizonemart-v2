# Features Backlog

Queue of customer-facing features that aren't on the active build path
yet. Adding here means: design is roughed in, we know roughly what it
costs, and we're choosing not to build it now. Each entry should
include the *trigger* — what we're waiting for before promoting it to
ARCHITECTURE_TRACKER.md.

This is **not** a bug list. Bugs go to GitHub issues. This is for
"good idea, not now."

---

## Continental Rewards (loyalty / points)

**Status:** Deferred — placeholder card on `/account` and "Coming
Soon" tile in dashboard quick-actions.

**Why deferred:** The `/account` audit revealed every dashboard tile
was hardcoded mock data. Real Orders, Profile, Addresses, and
Wishlist were the must-fix items; loyalty is a meaningful product
feature in its own right and deserves its own scope, not a side
effect of the audit.

**What it needs (rough scope):**
- `LoyaltyAccount` Prisma model (userId 1:1, balance int, tier enum)
- `LoyaltyTransaction` ledger model (earn / redeem / expire / adjust),
  immutable rows, cause = orderId | adminAdjustment | expiry
- Earn rules: % of order subtotal at PAID, configurable per region
- Tier ladder (Bronze / Silver / Gold / Continental) with thresholds
  and benefits matrix
- Redeem at checkout: convert balance to a percentage off, capped
- `/account/rewards` page (history, balance, tier progress)
- Admin: per-customer adjustments, rules editor, expiry policy
- Migration plan for any imported WC customer balance (likely none)

**Trigger to promote:** After Phase 12 stabilises (orders + profile
+ addresses + wishlist all in production for 2+ weeks with no
regressions) AND there's a marketing reason to launch — e.g. a
campaign tying loyalty to a product launch or seasonal push. Without
a marketing hook, points-without-promotion gets ignored.

**Today's UX:** dashboard "Points" stat card shows `0`, the
Continental Rewards tile in quick-actions links to `/account/rewards`
which can stay 404 for now (or land on a "coming soon" page) until
this ships.

Added: 2026-05-09 (alongside the /account audit batch)
