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

## Share product as image (PDP "Share as image" action) — ✅ v3 SHIPPED 2026-05-12

**Final state (2026-05-12)**: flag is **ON in prod**, LARQ-style
composition achieved across all tested products, Cloudflare Images
Transform powers the cutout (free under 5k/mo tier), satori in a
Next.js route composes the card on Vercel. Standalone
`<ShareAsImageButton>` icon next to the wishlist + link-share
buttons on every PDP.

**Iteration history (one workstream, three end-to-end design
passes):**
- v1 (2026-05-11): pluggable cutout service + satori composite +
  popover-item entry. Flag default OFF.
- v2 (2026-05-12): moved button out of popover into its own icon
  (popover never opened on mobile because navigator.share fires
  first); switched provider from Noop → remove.bg → Cloudflare
  Images Transform; landscape default; translucent glass card;
  product-color-tinted floor (Spotify-style); real Afrizonemart
  logo in white pill; horizon-split backdrop.
- v3 (2026-05-12): polish pass — smaller logo pill, lighter
  description, stable SHOP NOW alignment via price+pill on one
  row + URL footer on its own line, full country name + flag
  emoji on origin chip ("🇳🇬 Product of Nigeria"), satori
  render-bug fixes (explicit dims on backdrop divs, single-root
  divs in helpers, NGN ASCII prefix, emoji: 'twemoji').

Tracker entry #43 in ARCHITECTURE_TRACKER.md has the full
checklist (21 sub-tasks) + final architecture notes.

(Original v1 record retained below for historical context.)

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

---

# Engagement / retention ideas (brainstorm 2026-05-12)

Thirteen feature ideas surfaced when Magnus asked "what would make
people come back to Afrizonemart?". Grouped here under the engagement
loop each one creates. Top 3 to build first (the 80/20):
1. Send to my mum + family-pool cart + subscriptions (one
   workstream, three features, all share infrastructure).
2. Continental Rewards (already above) + price-drop alerts +
   one-tap reorder.
3. Meet-the-maker content + WhatsApp catalog.

Each individual entry below stands on its own scope. Some have hard
dependencies on Continental Rewards or the planned multi-vendor
seller surface, noted in their respective "Trigger to promote"
lines.

---

## "Send to my mum" — buy on someone's behalf

**Status:** Deferred — diaspora-native feature, highest-leverage
of the engagement-ideas batch. Should be the first in the
"diaspora workstream" trio (this + family pool + subscriptions).

**Why it matters:** Diaspora customers are Afrizonemart's most
monetisable cohort. They have higher AOV, longer LTV, and an
emotional reason to come back (sending things "home" to family).
Right now they shop the site like any other customer — load cart,
checkout, type Mum's Lagos address from memory each time. A
purpose-built "send to my mum" flow turns that into one tap and
turns Afrizonemart into a remittance-shaped product they tell
their cousins about.

**What it needs (rough scope):**
- New `Recipient` Prisma model owned by a User — name, phone,
  delivery address(es), relationship label (Mum, Dad, Sister,
  Cousin, etc.), optional photo.
- `/account/recipients` page to add/edit/delete recipients.
- Checkout flow: a "Sending to" picker at the top of the shipping
  step. Picking a recipient prefills the shipping address from
  their saved record.
- Recipient receives an SMS on order placement: "Your son Tunde
  in London just sent you these groceries. Arriving Saturday.
  Track: afrizonemart.com/r/<short-token>".
- Recipient gets a second SMS on delivery: "Your delivery from
  Tunde has arrived."
- Optional gift note on each order — short text typed at
  checkout, surfaces on the delivery slip and the recipient's
  SMS.
- Optional gift wrap / handwritten note add-on as a paid SKU
  for higher-AOV diaspora orders.

**Trigger to promote:** This is the diaspora-cohort killer
feature. Promote when diaspora-share of revenue crosses ~15% OR
when retention analytics show diaspora repeat-rate is below
target (probably both happen around the same time). Pairs with
basic remittance-style transactional SMS infrastructure (Twilio
already in place for OTP, reuse).

Added: 2026-05-12

---

## Family pool cart — multiple people one shipment

**Status:** Deferred — part of the diaspora-workstream trio.

**Why it matters:** Couples and siblings often coordinate a
single "things from home" shipment but don't have a clean way
to add items together. Today this means one person collects
requests via WhatsApp, types each item manually into their
cart, then everyone Venmos/PayPals them. A shared cart lets
two-to-six people add items from different devices/accounts,
see a running total, pay separately or together, and ship to
one address.

**What it needs (rough scope):**
- New `SharedCart` Prisma model — id, ownerUserId, recipientId
  (optional, ties into "Send to my mum"), createdAt, expiresAt
  (default 7 days), status (open/locked/paid).
- `SharedCartParticipant` join model — sharedCartId,
  userId-or-email-or-phone, role (owner/contributor), invited-at,
  joined-at.
- `SharedCartItem` like a regular cart item but with an
  `addedByUserId` so everyone can see who added what.
- Share-cart link with a token: `afrizonemart.com/share-cart/<token>`.
  Recipient clicks the link, gets a one-tap WhatsApp/email login,
  joins the cart, adds their items.
- Settlement options: (a) one person pays for everyone, (b) split
  evenly, (c) each person pays for their own items. (a) is the
  simplest first cut.
- Real-time updates via SSE or polling so participants see new
  items as others add them.

**Trigger to promote:** Build after "Send to my mum" lands and we
see usage patterns. If diaspora customers are already coordinating
informally, the share-cart flow is a natural upgrade.

Added: 2026-05-12

---

## Subscriptions for staples

**Status:** Deferred — third in the diaspora-workstream trio.

**Why it matters:** Recurring revenue + emotional stickiness. The
killer use case is the diaspora child setting up "garri, rice, palm
oil, every month to Mum" once and never touching it again. Combines
the "remittance-shaped" pattern with the "set it and forget it"
behaviour that makes Amazon Subscribe-and-Save sticky.

**What it needs (rough scope):**
- New `ProductSubscription` Prisma model — userId, productId,
  quantity, intervalDays (7/14/30/60/90), recipientId (optional),
  nextRunAt, status (active/paused/cancelled), priceLockedAt
  (optional — lock price for 12 months as the loyalty perk).
- Cron worker (extend the existing dispatcher pattern) ticks
  hourly; finds subscriptions where `nextRunAt <= now`, creates
  an order via the normal order flow, charges the saved payment
  method, advances `nextRunAt`.
- Sticky payment-method storage (already partial via GT Squad
  tokenisation; needs auth.write capability for saved cards).
- Customer-facing UI: "Subscribe" toggle next to "Add to cart"
  on grocery-category PDPs only. Choose interval. Pick recipient
  if "Send to my mum" is wired. Active subscriptions list at
  `/account/subscriptions` with pause / skip-next-shipment /
  cancel actions.
- Loyalty hook: 5–10% discount on subscribed items (Continental
  Rewards perk for Silver+ tiers).
- Pre-charge notification: SMS 48 hours before charge so customer
  can skip / pause if needed. Reduces involuntary churn.

**Trigger to promote:** After "Send to my mum" + Continental
Rewards both ship. The three together form the diaspora
retention engine.

Added: 2026-05-12

---

## Gift cards / Wallet top-up

**Status:** Deferred — diaspora-adjacent. Smaller scope than the
trio above but pairs with all three.

**Why it matters:** Diaspora customers want to send money home but
in a brand-safe, controlled way. "Mum, here is GBP 100 of
Afrizonemart credit, spend it on what you need" is a more
emotionally comfortable gift than "here is GBP 100 on your card,
don't waste it." Pre-collected revenue too — we hold the float
until the recipient spends.

**What it needs (rough scope):**
- New `Wallet` Prisma model per User (balance NGN, balance USD,
  balance other if multi-currency). Holds account credit.
- New `WalletTransaction` ledger model — type (gift_card_received,
  gift_card_purchased, order_payment, refund_credit, etc.), amount,
  causeOrderId, createdAt, immutable rows.
- Gift card purchase flow at `/gifts` — pick amount, recipient
  details, optional gift note. Issues a unique redemption code.
- Recipient redeems via `/redeem/<code>` (or pre-redeemed on their
  account if recipient already exists in the contacts book).
- Wallet balance applied automatically at checkout, before
  payment-method charge.
- Diaspora-side: option to "auto-top-up" a recipient's wallet
  monthly (recurring gift card, similar to subscriptions).

**Trigger to promote:** Closer-to-launch — build after the core
diaspora trio so we have natural pickup. Or build earlier as a
standalone if we want a wedge-product to test the diaspora
hypothesis cheaply (a gift card needs less infra than full
"Send to my mum").

Added: 2026-05-12

---

## WhatsApp catalog + ordering bot

**Status:** Deferred — pending decision on whether to build in-house
or use a third-party (Wati, Twilio Studio, MessageBird, etc.).

**Why it matters:** Most African e-commerce eventually has to meet
customers inside WhatsApp because that's where their attention
already is. A WhatsApp bot that consumes our existing API endpoints
lets first-time customers browse, ask questions, add to cart, and
pay all without leaving the chat. Removes the "go to a website"
friction that kills first-purchase conversion for less
tech-comfortable customers.

**What it needs (rough scope):**
- WhatsApp Business API access — Cloud API (Meta direct) or via a
  BSP (Twilio/MessageBird/Wati). Cloud API is cheaper at scale;
  BSPs are faster to bootstrap.
- Bot framework — could be Claude + tool-use, or a more
  conventional state-machine. Claude API lets us handle messy
  natural-language queries ("show me rice under 5k", "anything
  cheaper than the one Auntie bought last week") gracefully.
- Reuse the existing storefront API. Bot is just another client.
  Cart state may need a phone-number-keyed guest cart on the API
  side so the bot doesn't need full auth.
- Payment via GT Squad's WhatsApp-friendly link/checkout (or our
  storefront's hosted checkout link as a fallback).
- Order updates pushed back to the same WhatsApp thread —
  "Shipped", "Out for delivery", "Delivered" as messages.
- WhatsApp template messages for transactional + marketing (with
  opt-in, per Meta policy).

**Trigger to promote:** Promote when (a) we want to expand into a
new market where the website has low traction but WhatsApp usage
is universal (Kenya, Tanzania, Ghana are likely candidates), OR
(b) post-purchase analytics show that customers shared product
links on WhatsApp at high rates — meaning WhatsApp is already
where they shop, we just don't have a presence there.

Added: 2026-05-12

---

## Group deal unlocks (Pinduoduo-style)

**Status:** Deferred.

**Why it matters:** Africa's social shopping behaviour is real —
customers WhatsApp each other "have you seen this?" all day. A
mechanic that says "if 8 more people buy this rice today, the
price drops 12% for everyone" turns that informal sharing into a
distribution engine. Pinduoduo built a $200B company on this; no
African marketplace has tried it seriously.

**What it needs (rough scope):**
- New `GroupDeal` Prisma model — productId, originalPrice,
  groupPrice, minMembers, startsAt, endsAt, status (open/closed/
  fulfilled/cancelled).
- `GroupDealParticipant` — userId, joinedAt, paidAt (held in
  authorisation until the deal closes; only captured if the
  threshold hits).
- Customer-facing PDP integration: "Join the group, lock in
  N4,500 — 6 more buyers needed by 8pm". Shareable link.
- Hourly cron checks deals: if threshold reached at deal end,
  capture all auth'd payments + place orders. If not, release
  the auth'd holds.
- Admin: create group deals from the products admin, monitor
  active deals dashboard.
- Trust handling: only fulfil if seller can actually supply the
  volume — coordinate with inventory.

**Trigger to promote:** Build when we have (a) the bandwidth to
operate group-deal logistics (inventory planning is harder), AND
(b) sellers willing to offer real discounts at volume. Could be
piloted with one supplier-partnered SKU as a test.

Added: 2026-05-12

---

## Referral with real reward

**Status:** Deferred — hard dependency on Continental Rewards
(both schema + UI) since the referral payout lives in the
loyalty ledger.

**Why it matters:** Cheapest, most-honest growth lever. "Refer a
friend, both of you get N3k off your next N10k order" beats every
paid acquisition channel for a marketplace whose customer base
already talks to each other constantly on WhatsApp. Compound
growth at near-zero CAC.

**What it needs (rough scope):**
- Each User gets a unique referral code (`AFRI-<userId-suffix>`)
  shown at `/account/refer`.
- Sharing UI: pre-filled WhatsApp / SMS / email templates with
  the user's code and a personalised landing page.
- Landing page at `/r/<code>` — applies the code to the new
  user's account at signup.
- On the new user's first qualifying order (>= N10k, completed,
  not refunded), credit the loyalty ledger of BOTH the referrer
  and the new user with N3k worth of points.
- Anti-abuse: same-device, same-payment-card, same-shipping-
  address heuristics flag obvious self-referrals for review.
- Tiered cap: each user can refer up to 25 paying friends; above
  that, payouts pause (most genuine referrers won't hit this).
- Admin dashboard at `/admin/referrals` — top referrers, payout
  totals, suspected abuse flags.

**Trigger to promote:** Promote in lockstep with Continental
Rewards (the wallet/ledger is the same plumbing). Don't ship
before Rewards exists — paying out referrals without a place
to store the balance is messy.

Added: 2026-05-12

---

## Meet-the-maker — story per product

**Status:** Deferred.

**Why it matters:** Pan-African is our differentiation. "This shea
butter is from a women's cooperative in Tamale, Ghana — here is
the 30-second video of how it is made" turns a commodity grocery
into a trust signal and a brand moment. Particularly for diaspora,
this converts "I am buying groceries" into "I am supporting Africa"
— and "supporting Africa" comes with willingness to pay a premium
that "buying groceries" doesn't.

**What it needs (rough scope):**
- New `ProductStory` Prisma model — productId, videoUrl (R2),
  videoPosterUrl, captionText, makerName, makerLocationCountry +
  city, durationSeconds (<= 60), createdAt.
- Or simpler: extend `Product.attributes` JSON with a `story`
  block — pragmatic v1 since we don't need analytics on stories
  yet.
- Admin: a "Story" tab on the product edit page. Upload video
  (R2, sniffed for video MIME), enter caption + maker name +
  location. Interns can upload but only admin approves (similar
  to the existing intern queue).
- Storefront: render the story below the product gallery on PDPs
  as a small video card. Tap to expand fullscreen.
- Stories also surface in the "Today on Afrizonemart" tray (see
  next entry).
- Video budget: keep <= 30 seconds, <= 8MB per story to avoid
  bandwidth costs. Compress on upload.

**Trigger to promote:** Build when we have >= 20 products with
genuine maker stories ready to record. Below 20 the feature
looks empty; above 20 it starts to feel like real editorial.
The seller-onboarding flow once multi-vendor lands is a natural
moment to ask for story content as part of product setup.

Added: 2026-05-12

---

## Today on Afrizonemart — daily stories tray

**Status:** Deferred — depends on the Meet-the-maker content
engine existing first (otherwise stories tray has nothing to
show).

**Why it matters:** IG-stories-style daily content tray on the
homepage. New arrivals, deals of the day, seller spotlights,
recipe of the week, maker stories. Creates a daily check-in
habit — customers open the site to "see what's new today" the
same way they open Instagram. Sticky.

**What it needs (rough scope):**
- New `DailyStory` Prisma model — title, coverImageUrl (R2 or
  derived from product image), type (product / seller / recipe /
  deal / story-of-the-maker / curator-pick), linkTarget,
  scheduledAt, expiresAt, displayOrder, isActive.
- Admin: `/admin/daily-stories` curation page. Drag-and-drop
  ordering, scheduling, expiry. Auto-expire after 24 hours
  unless extended.
- Storefront: horizontal scrollable tray at the top of the
  homepage (mobile) / right rail of the homepage (desktop).
  Each story is a circular avatar with the cover image and a
  short label. Tap to open fullscreen, swipe to next.
- Reuse CMS page builder for the fullscreen story content
  (rich text + image + product link).
- Engagement: heart / share / save buttons on each story.

**Trigger to promote:** After meet-the-maker stories exist
(>= 20 products) so the tray has substance. Or earlier as a pure
"deals of the day" surface if we want to test the format with
just promotional content.

Added: 2026-05-12

---

## Local-language UI toggle

**Status:** Deferred — biggest scope of this batch, deepest moat.

**Why it matters:** Yoruba, Hausa, Igbo, Swahili, Pidgin (and
later Amharic, French for francophone Africa, Arabic for North
Africa). Even partial coverage — UI strings, not product copy —
opens entire markets that competitors don't serve. The
translation work is tedious but the moat lasts forever once
shipped, because catching up costs every competitor the same
multi-month effort.

**What it needs (rough scope):**
- i18n framework — `next-intl` or `next-i18next`. `next-intl` is
  cleaner with App Router.
- Translation file structure under `/src/messages/<locale>.json`.
  Start with English as the canonical and build outward.
- Language switcher in the header next to currency / country.
  Persists choice to a cookie.
- Translate the **UI shell first** — navigation, buttons, form
  labels, error messages. Product names and descriptions stay
  in their original language; that's a per-product / per-seller
  problem to solve later.
- Locale order to prioritise: Pidgin -> Yoruba -> Hausa -> Swahili
  -> Igbo. Pidgin first because it's the lingua-franca of
  Nigerian online culture and translation is closer to English.
- Pluralisation + interpolation handled by next-intl's ICU
  message format.
- Accept translation contributions from staff — a private Crowdin
  or Tolgee instance might be worth setting up if we want to
  scale beyond the first two languages.
- Right-to-left support (for Arabic later) — Tailwind has RTL
  utilities; build accommodating CSS now even if we don't ship
  RTL on day one.

**Trigger to promote:** Promote when (a) we are ready to enter a
specific market where English is a real barrier (Tanzania for
Swahili is the most obvious), OR (b) when a Nigerian-focused
Pidgin push is part of a marketing campaign. Don't try to ship
all five languages at once — pick one, ship, gather feedback,
add the next.

Added: 2026-05-12

---

## Price-drop / back-in-stock alerts

**Status:** Deferred — small scope, high leverage, should ship
relatively early.

**Why it matters:** Industry-standard but disproportionately
effective in price-sensitive markets where customers genuinely
wait for sales. Wishlist items that drop in price OR come back
in stock send a push/SMS notification. Two-day build,
consistently lifts repeat-order rate ~15-25% across e-commerce
benchmarks.

**What it needs (rough scope):**
- New `PriceAlert` Prisma model — userId, productId,
  triggerPrice (notify when price <= this), createdAt,
  notifiedAt (nullable), status (active/triggered/expired).
- Customer-facing UI: a small bell icon next to the price on
  PDPs. Tap -> input target price OR accept "any price drop".
  Saves an alert. Also: a "Notify when back in stock" link
  shown on OOS products.
- The existing `applyPriceChange` audit-aware helper (price
  management workstream PR 1) becomes the trigger point. After
  every successful price write, fire an event
  `product.price_changed` with old/new price. Subscriber
  module checks active alerts for that product, notifies the
  matching users.
- Stock-restored events: emit `product.in_stock` when inventory
  flips from 0 to >0 (already partially in place; finish the
  emit if needed). Same subscriber pattern.
- Notification channels: email (Resend already wired), SMS
  (Twilio already wired), in-app notification.
- One-tap "Stop alerting me" link in every notification email.
  Required for unsubscribe compliance.
- Admin: simple `/admin/price-alerts` for inspection +
  manual-trigger for a specific product if needed.

**Trigger to promote:** Build relatively early — small scope,
real lift, leans on infra (events + notifications + applyPriceChange)
that already exists. Could ship in a single PR week.

Added: 2026-05-12

---

## Birthday / occasion gifting reminders

**Status:** Deferred — pairs naturally with "Send to my mum".

**Why it matters:** Once a customer has saved family members
as recipients (per "Send to my mum"), adding birthdays to those
records unlocks a calendar of timely repeat-purchase triggers.
Push: "Mum's birthday in 7 days — last year you sent her ankara
fabric, want to send something similar?" One-tap re-purchase.
Compounds the diaspora retention engine.

**What it needs (rough scope):**
- Add `birthday`, `weddingAnniversary`, other key dates (optional
  JSON) to the `Recipient` model from "Send to my mum".
- Daily cron at 9am customer-local-time — find recipients whose
  occasion is in 7/3/1 days from now. Notify the buyer.
- Notification template: "[Auntie]'s birthday in 7 days. Last
  year you sent: [order link]. Want to send something this year?"
  with a "Reorder" CTA + a "Pick something else" CTA.
- Editable reminder cadence per customer (turn off if annoying).
- "Holiday" reminders too — Christmas, Eid, Easter, school
  resumption — all configurable globally rather than per-recipient.
- Order page integration: after placing a gift order, suggest
  "Add [recipient]'s birthday so I can remind you next year".

**Trigger to promote:** Promote after "Send to my mum" has been
in production for 4+ weeks so we have a meaningful recipient
database to remind against. Without recipients, this is just
a generic calendar tool.

Added: 2026-05-12

---

## One-tap re-order from history

**Status:** Deferred — trivially small scope, real conversion lift.

**Why it matters:** Most grocery-staples buyers buy the same things
every month. Today they have to manually re-find each product, re-
add to cart, re-confirm address. A "Buy again" button on each past
order pre-fills the cart with the same items at current prices and
drops the customer straight to checkout. ~1 day of work, lifts
repeat-order rate significantly for staples.

**What it needs (rough scope):**
- New API endpoint: `POST /api/orders/:id/reorder` that takes the
  order's `OrderItem`s, looks up the current product prices and
  availability, returns a `CartItem[]` shape ready to push into
  the cart store.
- Handle edge cases: product discontinued (skip + flag), price
  changed (use new price, surface a note), out of stock (add to
  cart but show a banner).
- Storefront: "Buy again" button on each past-order card in
  `/account/orders`. Tap -> adds items to cart -> routes to
  `/cart` with a toast "Added 4 items from order AZM-XXXX
  (1 item unavailable)".
- Also a more prominent "Re-order your usuals" tile on the
  account dashboard, showing the most-frequently-ordered items
  across the user's history (top 5 by purchase count) as a
  "one-tap pick from these" carousel.

**Trigger to promote:** Promote whenever — it's a small build with
clear ROI. Probably ships right after the diaspora trio when
attention is on retention features anyway. Or earlier if
month-over-month retention metrics show a clear drop-off after
first purchase.

Added: 2026-05-12
