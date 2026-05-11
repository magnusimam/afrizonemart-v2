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

---

## Cost + markup pricing model

**Status:** Deferred — current pricing is a typed-in `price` (Naira)
plus an optional `comparePrice`. No notion of cost or margin in the
DB.

**Why deferred:** Magnus is building out the easier price-management
surfaces first (inline edit, bulk re-price, CSV import, audit log,
scheduling — see ARCHITECTURE_TRACKER 2026-05-11 entry). Those
work on the existing typed-in price column. Cost + markup is the
deepest refactor of the bunch and only pays off once supplier-cost
data is reliable.

**What it needs (rough scope):**
- `costPrice` (NGN) and `markupPercent` columns on Product (or a
  separate `ProductPricing` 1:1 table to keep the main row tight).
- Optional default markup per Category, per Origin country, per
  Supplier — so admin can set "all Nigerian groceries: 25%"
  without touching each row.
- Derived view: `price = round(costPrice * (1 + markupPercent / 100))`.
  Either persisted (written on every cost / markup change) or
  computed at read time — persistence is faster but means cache
  invalidation, computation is simpler but adds a CPU hop on every
  list query.
- Admin product form: "Cost", "Markup %", and a read-only "Selling
  price" field showing the derived value. Toggle to override into
  manual-price mode for one-off exceptions.
- Bulk cost-update: same shape as bulk re-price, but updates the
  cost column. The price recalculates automatically based on the
  product's markup.
- Migration plan for the existing ~hundred products: backfill
  `costPrice = round(price / 1.25)` (i.e. assume a default 25%
  margin) and let admin correct from there. Mark each row as
  "estimated cost" until reviewed.

**Trigger to promote:** After (a) the five price-management surfaces
land and stabilise for 2+ weeks AND (b) Magnus has a clean source
of supplier-cost data (Excel sheet, supplier portal feed, anything
better than guessing). Without reliable cost data, deriving prices
from costs just moves the bad-data problem one column to the left.

Added: 2026-05-11
