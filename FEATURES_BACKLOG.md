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

## Scheduled price changes (PR 4 of the price-management workstream)

**Status:** Deferred — was originally queued as PR 4 of the
five-stage price-management workstream (tracker #42). Cancelled
2026-05-11 after PRs 1–3 landed (inline edit + bulk re-price +
CSV import). Three working surfaces are enough for today's
catalog size; scheduling adds cron infrastructure that isn't
urgent without a specific campaign to power.

**Why deferred:** Without a Black Friday / supplier-deal /
weekend-sale campaign actively planned, the value of "the cron
flips prices for me at midnight" is too abstract to justify the
build cost. Today admin can do the same flip by hand once we
know a sale window — applying a bulk re-price (PR 2) at start
and again at end gets you the same outcome with two clicks
each.

**What it needs (rough scope):**
- New `ProductPriceSchedule` Prisma model — one row per future
  flip, queueable per product (multiple future changes can
  stack). Columns: productId, scheduledPrice,
  scheduledComparePrice (nullable), effectiveFrom,
  effectiveUntil (nullable; null = no auto-revert),
  revertToPrice (snapshot at schedule time so the revert
  flips back to what was current, not what is current),
  status enum (PENDING / APPLIED / REVERTED / CANCELLED),
  createdById, reason.
- Cron worker — extend the existing dispatcher pattern in
  `src/modules/*/dispatcher.ts`. Tick every minute; find rows
  where `effectiveFrom <= now AND status = PENDING` → apply
  via applyPriceChange(source: SCHEDULED, actorId: null); find
  rows where `effectiveUntil <= now AND status = APPLIED` →
  revert via applyPriceChange(source: SCHEDULED, actorId:
  null) using the snapshotted revertToPrice.
- Admin UI on /admin/products/[id] — "Schedule a price change"
  form (or table of upcoming schedules), edit/cancel pending
  rows.
- Bulk-schedule: same shape as bulk re-price (PR 2) but with
  effectiveFrom/Until date pickers.

**Trigger to promote:** When a concrete campaign is on the
calendar that needs prices to flip on a schedule — Black
Friday, Eid promotion, supplier deal week. Without that
forcing function this is over-engineering.

Added: 2026-05-11 (cancelled mid-workstream)

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

---

## Share product as image (PDP "Share as image" action) — ✅ v1 LANDED 2026-05-11

**v1 shipped 2026-05-11**: pluggable cutout service + satori
composite + PDP popover entry, all wired and typechecking clean.
Behind the `share_as_image` feature flag (default OFF). To enable,
flip the flag in `/admin/feature-flags`; to upgrade cutout quality
from the Noop pass-through to remove.bg, set `REMOVE_BG_API_KEY` in
the API env (no code change). End-to-end smoke (curl the route on
prod, eyeball the PNG, then flip the flag for a wider test) is
deferred to the next deploy window.

(Original scope retained below for historical context.)

## Share product as image (PDP "Share as image" action) — 🚧 BUILDING 2026-05-11

**Status:** Active — promoted from backlog 2026-05-11 immediately
after design alignment. Tracker home is item #43 in
ARCHITECTURE_TRACKER.md.

**Why it matters:** the link-share button (shipped 2026-05-11)
covers the WhatsApp/Twitter/etc. unfurl path, but an unfurl needs
the receiver to be on a platform that renders OG previews and
trusts the domain. A pre-generated **PNG card** is universal — it
renders inside any chat, story, status, or feed without needing
metadata, link previews, or even an internet round-trip on the
receiver's side. For a marketplace where status-shares on WhatsApp
and Instagram are a real traffic source, this closes the gap.

**Reference design:** the LARQ Water Bottle PDP composition Magnus
shared (`share product as photo.jpg`). Cutout product floating on
a branded backdrop with a frosted card overlay containing brand /
name / rating / price / CTA. We swap LARQ teal for Afrizonemart
navy `#000066` + amber `#FBAC34`, Raleway type.

**Decisions locked 2026-05-11:**
1. **Background removal:** Cloudflare Workers AI primary; if their
   `rmbg` model availability/quality is iffy on test products, the
   provider interface (`BackgroundRemovalProvider`) is pluggable —
   `RemoveBgProvider` (paid, best quality) and `NoopProvider`
   (returns original; share image still ships but without the
   floating-product look) are available swap-ins. **For v1 we
   start with `NoopProvider` so the feature can ship before any
   AI vendor is signed up**; the `REMOVE_BG_API_KEY` env (or CF AI
   credentials) just needs to be set to upgrade quality with no
   code change.
2. **Cache:** R2 at `cutouts/{sha256(originalImageUrl)}.png`. No
   Prisma schema change for v1 — R2 HEAD on each share request is
   cheap (~20ms in-region). Migrate to a `Product.cutoutImageUrl`
   column if cold-cache rate ever matters.
3. **Composition:** `@vercel/og` (satori + resvg) in a Next.js
   App Router route handler — `app/api/products/[slug]/share-image
   /route.tsx`. Vercel infra is purpose-built for this; keeps the
   memory-heavy image work off the Railway API node.
4. **Variants for v1:** square `1080×1080` (WhatsApp / IG status)
   + landscape `1200×630` (Twitter / Facebook / iMessage). Story
   `1080×1920` deferred until we see whether the square variant
   gets used on stories anyway.
5. **No QR code.** Footer just shows `afrizonemart.com/p/<slug>`
   text — QR adds noise on a 1080² canvas and most users tap
   image links directly when forwarded.
6. **Surface:** PDP only for v1. Product cards on the home /
   shelf grids do **not** get this — too many entry points dilute
   the action and small thumbnails don't justify generation cost.
7. **Mobile delivery:** Web Share API with `files: [pngBlob]` →
   native iOS / Android share sheet. Desktop downloads the PNG.
8. **Resilience trio (per standing rule):** `useFlag
   ('share_as_image')` kill switch (default OFF in registry until
   smoke-tested in prod) + `<SafeBoundary>` around the share
   modal + plain-link fallback (the existing
   `<ShareProductButton>` actions stay available even if the
   image generation throws).

**Scope of the build:**
- API: `share-image` module
  (`afrizonemart-api/src/modules/share-image/{service,controller,
  routes,providers/}.ts`). Public rate-limited endpoint `GET
  /api/products/:slug/cutout` returns `{ url, isOriginal }`.
- API: `shareImageLimiter` (20/hr per IP) added to
  `middleware/rate-limit.ts`.
- API: `REMOVE_BG_API_KEY` (optional) added to
  `config/env.ts` zod schema.
- API: `share_as_image` flag added to `feature-flags/registry.ts`,
  `defaultValue: false`.
- Storefront: install `@vercel/og`. New route handler at
  `app/api/products/[slug]/share-image/route.tsx`.
- Storefront: extend `<ShareProductButton>` with a "Share as
  image" item (icon + label) in the existing popover.
- Smoke test: hit `/api/products/<known-slug>/share-image?variant
  =square` from `npm run smoke` and verify PNG content-type +
  non-zero body.

**Trigger to promote:** N/A — actively building.

Added: 2026-05-11 (promoted same day)
