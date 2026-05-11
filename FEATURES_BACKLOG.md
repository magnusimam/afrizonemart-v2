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

---

## R2 orphan-scan cron (image-cleanup safety net)

**Status:** Deferred — inline best-effort R2 cleanup landed
2026-05-11 (afrizonemart-api `uploads/cleanup.ts`, wired into
product delete + intern resubmit). The cron is the safety net
for the failure cases that inline cleanup misses.

**Why deferred:** inline cleanup catches the 95% case. R2 file
storage is cheap (~$15/TB/month) so a few orphans accumulating
is a cost issue, not a correctness one. We want this to exist
before the catalog hits ~10k products — at that scale orphans
add up.

**What it needs (rough scope):**
- Monthly cron (extend the existing webhook/notification
  dispatcher pattern in `src/modules/*/dispatcher.ts` or
  cart/abandoned-cron.ts).
- List all R2 keys under `products/` (paginated S3 ListObjects).
- Build a referenced-set from the DB: every URL in
  `Product.images[]`, `Product.brandImageUrl`, and every
  `ProductImageSubmission.{front,back,side,brand,additional}`
  field. Use the existing `urlToKey()` helper to normalise.
- Delete the difference. Cap per-run (e.g. 1000 deletes max)
  so a runaway scan can't accidentally trash the bucket.
- Dry-run mode toggled by an env var so the first prod run
  just logs what *would* be deleted.
- Log totals to Sentry breadcrumbs so we have visibility into
  the orphan rate over time.

**Trigger to promote:** when product count exceeds ~5k OR
when R2 storage costs cross a threshold worth caring about
(probably $50/month).

Added: 2026-05-11

---

## Shareable product links (Share button on PDP) — ✅ SHIPPED 2026-05-11

**Status:** Shipped 2026-05-11 — `<ShareProductButton />` lives on
every PDP next to the wishlist heart. Mobile uses
`navigator.share` (native iOS/Android sheet → WhatsApp /
Messenger / SMS / etc.); desktop falls back to an inline popover
with explicit one-tap targets (Copy link, WhatsApp, X, Facebook,
Telegram, Email). UTM parameters per-channel
(`utm_source=share&utm_medium=<whatsapp|copy|web-share|…>`) so
analytics can attribute share-driven traffic. OG tags on
`/product/[slug]` were already in place from earlier SEO work,
so unfurls render with the product image.

(Original scope retained below for historical context.)

**Why it matters:** product shares to WhatsApp / IG DMs / SMS are
high-intent referral traffic for a continent where WhatsApp is the
default product-recommendation channel. Adding a one-tap share is
the cheapest organic-growth lever on the site.

**What it needs (rough scope):**
- `<ShareProductButton />` mounted on the PDP near the title /
  price. Mobile: invokes `navigator.share({ title, text, url })`
  — the native iOS / Android sheet handles routing to WhatsApp,
  Messenger, SMS, copy, etc.
- Desktop fallback (no `navigator.share`): inline popover with a
  "Copy link" button + direct one-tap targets for WhatsApp
  (`https://wa.me/?text=…`), X/Twitter, Facebook, Telegram, and
  email.
- Open Graph tags on `/product/[slug]` need to be solid so the
  unfurl renders nicely — title, description, **product image as
  `og:image`**, price in description. Test in Slack, WhatsApp,
  iMessage. Vercel's image-optimizer should already serve a
  ~1200×630 variant; just need to add `metadata.openGraph` and
  `metadata.twitter` to the product page's `generateMetadata`.
- UTM parameters on shared links so we can measure share-driven
  traffic in analytics: append `?utm_source=share&utm_medium=
  <whatsapp|copy|web-share|…>`. Stripped on the server side for
  canonicalisation but kept in the query for analytics.
- Optional: short link service. Today's URLs are already short
  for slug-based products (`afrizonemart.com/product/<slug>`)
  but a custom `azm.to/p/<id>` could be cleaner for SMS. Out of
  scope for first cut.

**Trigger to promote:** No real blocker — this is cheap and
high-leverage. Magnus said "add to backlog first" so I'm holding
until he gives the build signal. Likely ships in a single PR
once we're done with the current price-management batch.

Added: 2026-05-11
