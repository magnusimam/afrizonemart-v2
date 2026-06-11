# Afrizonemart Wrap — Implementation Tracker

Living doc for the annual personalised retrospective customers receive
each December — the same way Spotify ships Wrapped and YouTube
Music ships Recap, but framed around what's uniquely
Afrizonemart-shaped (cultural moments, who you sent gifts to,
which countries' makers you supported).

Single source of truth. When something changes — a card
concept lands, the schema evolves, the drop date shifts — edit
this file in the same commit so future-us doesn't re-derive from
chat history.

Last updated: 2026-06-08

---

## 1. Vision

A yearly digital experience released in early December
(target: **Dec 1, 2026**). Each eligible customer receives a
personalised, swipeable deck of cards that celebrates their
year on Afrizonemart and is designed to be shared.

### Why this works for us (and what NOT to copy from Spotify)

Spotify Wrapped works because music is identity. Listening is
play, not spend. Vanity stats are positive. Friends seeing your
top artist on Instagram → free brand advertising.

Shopping is different. The wrong framing turns a wrap into an
anxiety stat ("you spent ₦450k this year"). Cards that copy
"your top 5 products" miss what's actually meaningful about
Afrizonemart purchases — most are cultural or relational acts,
not consumption-flexes.

What's uniquely ours:

- **Diaspora users** send care packages to family across borders
  — this is high-emotional-stake shopping. Stories about who
  you supported and where you sent love are genuinely
  share-worthy.
- **African-made-good marketplace** — orders are from real small
  businesses. "Your purchases supported 18 African small
  businesses this year" reframes spend as impact.
- **Cultural calendar** — our shopping volume spikes around Eid,
  Independence Day, Christmas, traditional weddings. We can
  show users their year as a cultural rhythm.
- **54 African countries** — we have unique geographic
  storytelling Amazon / Shein / Temu literally cannot tell
  (their catalogs aren't organised this way).
- **Continental Rewards** — our loyalty programme is a real
  differentiator. Tier reveal + coin earnings give status flex
  without spend flex.

### What we deliberately leave out

- **Total spend in currency.** Feels punitive. Some users will
  feel bad seeing it. Replace with "your favourite categories"
  or "your top brands" framings.
- **Number of returns.** Same reason.
- **Compete-with-friends ladders.** Too aggressive for a
  shopping context. Spotify can compare listening minutes;
  shopping comparisons feel different.
- **Order frequency.** Would incentivise wrong behaviour —
  users gaming a "you ordered 50 times!" badge by splitting
  orders.

---

## 2. The card concepts

The deck is 7-9 cards in a swipeable, Stories-style format
(9:16 vertical). Each is independently shareable to Instagram /
WhatsApp / X with one tap. Animated transitions between cards.

Below are the v1 card concepts. Each has the framing logic plus
a rough mockup. Designer + copywriter pass before launch will
polish typography + animation.

### Card 1 — The "Connector" / Personality

Opens the deck. Slots the user into one of four
personality types based on their shopping pattern.

| Type | When |
|---|---|
| **Connector** | 40%+ of orders ship to a country other than the user's country (diaspora gifting) |
| **Patriot** | 70%+ of orders origin from a single country |
| **Explorer** | Orders from 4+ different origin countries |
| **Curator** | Default — none of the above; smaller but specific catalog of items |

Mockup:

```
┌────────────────────────────────────┐
│ AFRIZONEMART WRAP 2026             │
│                                    │
│         You are a                  │
│      ╔═══════════╗                 │
│      ║ CONNECTOR ║                 │
│      ╚═══════════╝                 │
│                                    │
│ You sent 12 packages across        │
│ 4 countries to people you love.    │
│                                    │
│ That's more than 87% of            │
│ Afrizonemart shoppers this year.   │
│                                    │
│            🌍 ➡ 💛                 │
└────────────────────────────────────┘
```

### Card 2 — The Continent on Your Doorstep

Stats by country.

```
┌────────────────────────────────────┐
│ This year you shopped from         │
│                                    │
│       7 African countries          │
│                                    │
│   🇳🇬 🇬🇭 🇰🇪 🇿🇦 🇨🇮 🇨🇲 🇪🇹       │
│                                    │
│ Top 3:                             │
│  ● Nigeria   ████████  47%         │
│  ● Ghana     ████      22%         │
│  ● Kenya     ███       14%         │
│                                    │
│ (Animated map fill behind text)    │
└────────────────────────────────────┘
```

### Card 3 — Your Cultural Year

Surfaces the rhythm of the year — when you shopped most and
the cultural moments that drove it.

```
┌────────────────────────────────────┐
│ Your busiest moments               │
│                                    │
│  Eid week           4 orders       │
│  Independence Day   3 orders       │
│  Christmas          7 orders       │
│                                    │
│ Your quietest month: April         │
│ Your most-active day: Dec 22       │
│                                    │
│   Jan ▁▁▂▃▂▃▄▄▅▆██▆               │
│   Dec                              │
└────────────────────────────────────┘
```

### Card 4 — You Supported

Reframes spend as impact. The killer card for the conscious-
consumer segment of the diaspora.

```
┌────────────────────────────────────┐
│ Your orders supported              │
│                                    │
│        18 small businesses         │
│        across Africa               │
│                                    │
│ Including:                         │
│  • A women's collective in Lagos   │
│  • A Ghanaian skincare maker       │
│  • A Kenyan tea cooperative        │
│                                    │
│ Thank you for shopping local 🌱    │
└────────────────────────────────────┘
```

### Card 5 — Top Categories

Lightweight stats card. Categories ranked, top one highlighted.

```
┌────────────────────────────────────┐
│ Your top category this year        │
│                                    │
│      ╔══════════════════╗          │
│      ║ Baby & Children  ║          │
│      ╚══════════════════╝          │
│                                    │
│ 36% of your orders                 │
│                                    │
│ Runners-up:                        │
│  2. Beauty & Personal Care   24%   │
│  3. Books                    17%   │
└────────────────────────────────────┘
```

### Card 6 — Continental Rewards highlight reel

Tier reveal + coin economy stats. Status flex without spend
flex.

```
┌────────────────────────────────────┐
│ You earned                         │
│                                    │
│       ✨ 4,200 Coins ✨           │
│                                    │
│  Top 15% of all Afrizonemart       │
│  shoppers this year                │
│                                    │
│  Your tier:  ╔═══════╗             │
│              ║ GOLD  ║             │
│              ╚═══════╝             │
│                                    │
│ Redeemed: ₦8,400 off your orders   │
└────────────────────────────────────┘
```

### Card 7 — Discoveries

Surfaces 3 products the customer bought that later trended /
sold out / got top reviews. Frames the customer as taste-maker.

```
┌────────────────────────────────────┐
│ You discovered some bangers        │
│                                    │
│  [thumb]  Ankara Maxi Wrap         │
│           Bought Feb, top-rated    │
│           in your wardrobe now     │
│                                    │
│  [thumb]  Tom Brown Cereal         │
│           Bought Apr, sold out     │
│           twice since              │
│                                    │
│  [thumb]  Hand-woven Basket        │
│           Bought Jul, gifted       │
│           and loved                │
└────────────────────────────────────┘
```

### Card 8 — Looking Ahead

Soft pitch for the year ahead. Optional — depends on whether
ops want to push specific categories / events.

```
┌────────────────────────────────────┐
│ Save the date 🗓️                  │
│                                    │
│  Mar 23 — Easter package window    │
│  Apr 28 — Eid                      │
│  Oct 1  — Nigerian Independence    │
│  Dec 25 — Christmas                │
│                                    │
│  We've already got 200+ new        │
│  African makers waiting for you.   │
│                                    │
│         [ Continue shopping ]      │
└────────────────────────────────────┘
```

### Card 9 — Share

Final card.

```
┌────────────────────────────────────┐
│ Thanks for an amazing year ❤️      │
│                                    │
│  Share your wrap                   │
│                                    │
│  📱 Instagram Story                │
│  💬 WhatsApp                       │
│  𝕏  Twitter                       │
│  💾 Save image                     │
│                                    │
│  AFRIZONEMART WRAP 2026 ©          │
└────────────────────────────────────┘
```

---

## 3. Eligibility + edge cases

**Minimum threshold**: customer must have **≥ 3 orders** in the
year to receive a wrap. Below that, the deck would feel hollow.

**Below threshold**: instead of an empty wrap, show:

```
┌────────────────────────────────────┐
│ Your Afrizonemart Wrap unlocks at  │
│  3 orders this year.               │
│                                    │
│ You're at 2 — 1 more order this    │
│ year and your full 2026 wrap       │
│ goes live on Dec 1.                │
│                                    │
│   [ Continue shopping ]            │
└────────────────────────────────────┘
```

This is itself a small conversion lever — the wrap teases users
into one more order.

**Deleted accounts**: wraps that were already published before
deletion stay accessible via their share URL. After deletion the
user can no longer regenerate; the public version remains for
the recipient (already shared on Instagram, etc.). Account
deletion service zeros the user-tying fields on the snapshot.

**Returns**: a refunded order still counts toward the year's
stats (it represents customer interest + the small business was
already supported, even if the customer later returned).

**Cancelled orders**: do NOT count.

---

## 4. Tech architecture

### 4.1 New schema

```prisma
model WrappedSnapshot {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  /// Year this snapshot represents — e.g. 2026.
  year            Int
  /// JSON blob with all the computed stats. Card design changes
  /// don't require re-aggregation; the deck re-renders from
  /// `stats` on every view.
  stats           Json
  /// When the snapshot was last computed. Daily cron updates.
  computedAt      DateTime @default(now())
  /// Null until the wrap is "published" on Dec 1. Users only
  /// see the wrap when this is set. Anticipation matters; we
  /// freeze + publish on Dec 1 via the publish cron.
  publishedAt     DateTime?
  /// Admin can hide a user's wrap (PII concern, support
  /// request, etc.). When false, /api/wrap/me returns 404.
  visible         Boolean  @default(true)

  @@unique([userId, year])
  @@index([year, publishedAt])
}
```

The `stats` JSON shape (versioned, so deck design can evolve):

```typescript
interface WrappedStatsV1 {
  version: 1;
  // ── Identity / personality ─────────────────────────────────
  personality: 'CONNECTOR' | 'PATRIOT' | 'EXPLORER' | 'CURATOR';
  personalityReason: string;
  // ── Volume ─────────────────────────────────────────────────
  totalOrders: number;
  totalProducts: number;
  uniqueCategoriesCount: number;
  uniqueCountriesCount: number;
  // ── Geography ──────────────────────────────────────────────
  /// Customer's resolved home country (from their addresses).
  homeCountry: string | null;
  topOriginCountries: Array<{
    code: string;
    name: string;
    orderCount: number;
    sharePct: number;
  }>;
  // ── Diaspora / care packages ───────────────────────────────
  /// Orders shipped to a country other than the user's home.
  carePackagesCount: number;
  carePackageDestinations: string[];  // ISO codes
  // ── Categories ─────────────────────────────────────────────
  topCategories: Array<{
    slug: string;
    name: string;
    orderCount: number;
    sharePct: number;
  }>;
  // ── Cultural moments ───────────────────────────────────────
  cultural: {
    eidWeekOrders: number;
    independenceDayWeekOrders: number;  // Oct 1 ±3 days for NG; configurable
    christmasWeekOrders: number;
    busiestMonth: { month: number; orders: number };
    quietestMonth: { month: number; orders: number };
    monthlyOrderCounts: number[]; // length 12
  };
  // ── Impact ─────────────────────────────────────────────────
  /// Number of unique sellers the customer bought from. Today
  /// we don't have a seller_id on Order — see §6.1.
  smallBusinessesSupported: number;
  /// Top 3 sellers by orderCount, for the "Including..." quote.
  topSellers: Array<{
    sellerId: string;
    name: string;
    location: string;
  }>;
  // ── Loyalty ────────────────────────────────────────────────
  loyalty: {
    coinsEarned: number;
    coinsRedeemedNgn: number;
    finalTier: 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    percentileRank: number;  // 0-100
  };
  // ── Discoveries ────────────────────────────────────────────
  /// 3 products the customer bought that later trended /
  /// became bestsellers / got top reviews. Surfaces them as
  /// "you were early to..."
  discoveries: Array<{
    productSlug: string;
    productName: string;
    productImage: string | null;
    why: string;  // copy explaining why it's a discovery
  }>;
}
```

Migration: `20260608140000_wrapped_snapshot`.

### 4.2 Aggregation

`src/modules/wrap/aggregation.ts`:

```typescript
/**
 * Compute the full WrappedStats for one user for one year.
 *
 * Idempotent — safe to call repeatedly. The daily cron upserts
 * into WrappedSnapshot.
 */
export async function computeUserWrap(
  userId: string,
  year: number,
): Promise<WrappedStatsV1 | null> {
  // Loads all of the customer's orders for the year, joins to
  // products, categories, sellers, loyalty transactions, runs
  // the math. Returns null if the customer has < 3 orders.
}
```

### 4.3 Cron

`src/modules/wrap/cron.ts`:

```typescript
/**
 * Two crons:
 *
 *   1. **Daily incremental** — recomputes snapshots for users
 *      who placed an order in the last 24h OR who already have
 *      a snapshot this year. Runs at 03:00 GMT. ~5 min to run
 *      at launch volume, scales linearly.
 *
 *   2. **Annual publish** — on Dec 1 at 09:00 GMT (lunchtime
 *      Lagos, morning London, evening Sydney — covers diaspora
 *      time zones), sets publishedAt = now for every snapshot
 *      where the user has ≥ 3 orders. Sends the email + push
 *      campaign as a downstream subscriber to the same trigger.
 */
export function startWrapAggregationCron(): void;
export function startWrapPublishCron(): void;
```

### 4.4 Endpoints

```
GET /api/wrap/me?year=2026
  Auth: required.
  Returns 200 with a discriminated `status` (NOT 404 — a pre-drop
  visit is an expected state, not an error; 404s would spam Sentry):
    { status: 'ready';    publishedAt; stats }   // published + visible
    { status: 'pending';  dropAt }               // computed/eligible, awaiting Dec 1, or ops-hidden
    { status: 'locked';   ordersCount; minOrders } // below 3-order threshold
    { status: 'optedOut' }                       // wrapOptOut on
  (Implemented in PR 2: src/modules/wrap/me.service.ts.)

GET /api/wrap/preview?year=2026&userId=<user>
  Auth: admin only.
  Returns: the stats even if not published. Used by ops to QA
  before the Dec 1 drop.

POST /api/admin/wrap/:id/hide
  Auth: admin only.
  Body: { hidden: boolean, reason?: string }
  Flips WrappedSnapshot.visible. Used when a customer requests
  their wrap be hidden, or when ops finds a data issue.
```

### 4.5 Image generation

The shareable image-per-card uses the existing Satori pipeline
already wired for `share-as-image` (see
`project_share_as_image_v3`). Each card has a JSX template that
renders to a 1080×1920 PNG.

`/api/wrap/me/card/:cardKey.png` — public, signed-URL-equivalent
based on a hash of (userId, year, cardKey, snapshotHash). Cached
on R2 + Cloudflare for 30d.

### 4.6 Frontend deck

**Web** (afrizonemart-v2): `/wrapped/[year]` route.

- Auth gate; 401 → in-page "sign in to see your wrap" prompt
  (link to /login?redirect=/wrapped/<year>).
- Fetches `/api/wrap/me?year=2026`, branches on `status`:
  - `locked` → "unlock at 3 orders, you're at N" teaser.
  - `pending` → "drops Dec 1" anticipation screen + live countdown.
  - `optedOut` → re-enable hint → /account.
  - `ready` → renders the `WrapDeck` (shared with admin preview) +
    background music (admin-managed) + Share.
- Share: PR 4 ships URL share via Web Share API (clipboard fallback);
  per-card Satori PNGs are PR 3.
- Built in PR 4: `src/app/wrapped/[year]/page.tsx` (+ `/wrapped`
  redirect to current year). Top-level route → full-screen, no shop
  chrome.

**Mobile** (afrizonemart-mobile): `WrapScreen`.

- Same flow. Modal route (`presentation: 'modal'`).
- Native Share API for save / Instagram / WhatsApp.

---

## 5. Drop campaign (Dec 1)

Triggered by the publish cron on Dec 1, 09:00 GMT. Downstream
subscribers:

- **Email** to every user with a published wrap:
  > Subject: Your Afrizonemart Wrap 2026 is here 🎁

  Body summarises 2-3 stats (e.g. "you supported 18 African
  makers — see the full story"), CTA links to `/wrapped/2026`.

- **Push notification** to mobile:
  > Title: Your 2026 Wrap is ready
  > Body: 12 packages, 4 countries, 18 makers. See your year.

- **In-app banner** for 1 week on home + account screens.
- **WhatsApp** (optional, future) — once Meta verification
  clears, send the wrap teaser via WhatsApp too.

Re-engagement waves:
- Day 3: push to users who haven't opened their wrap yet
- Day 7: email reminder to those still unopened
- Day 14: campaign ends

---

## 6. Open decisions + gaps

### 6.1 Seller attribution

Today `Order` doesn't carry a seller id (we don't run a
multi-vendor marketplace yet — all products are first-party).
"You supported X small businesses" only works once products are
attributed to specific makers.

**Two paths**:

a) Add a `makerId` / `brandId` to Product, derived from existing
   brand data (we have `brand` strings on products today; cluster
   them into a `Maker` table with location). Wrap counts unique
   makers in the order's items.

b) Treat brand strings as the maker proxy for v1 — count unique
   non-null `brand` values across the year's orders.

Recommendation: **(b)** for v1. (a) is the right long-term move
once we run actual seller onboarding (overlaps with the
SUPPLIER_PORTAL_TRACKER workstream).

### 6.2 "Discoveries" card data source

The card needs "this product later trended / sold out / got top
reviews." Today we have:

- `ProductView` (dwell-time view log) — we can compute "trended"
  as "view count surged after this user's purchase".
- `Review` (with rating) — "got top reviews" = avg ≥ 4.5 after
  customer's purchase.
- Stock movement — would need order-level inventory tracking
  (not in scope today; defer).

V1 approach: pick top 3 products from the customer's year where
`Product.rating` ≥ 4.5 AND `Product.reviewCount` ≥ 10. Frame as
"crowd favourites you backed early." Skip card entirely if the
customer has zero qualifying products.

### 6.3 Seller wrap (sister feature)

Sellers on Afrizonemart would benefit from their own wrap:

> *Your shop reached customers in **9 African countries** this
> year. You shipped **142 orders** across **47 cities**.*

This is **free marketing material**. Sellers share it to attract
more customers to their store, and it strengthens their loyalty
to Afrizonemart.

Status: parked. Revisit once §6.1 (seller attribution) is
resolved. Likely Q1 2027.

### 6.4 Year-over-year storytelling

In 2027 we can compare 2026 vs 2027: "You shopped from one more
country than last year." That's a card-three multiplier in
emotional weight. For 2026 (first year), n/a.

### 6.5 Privacy + NDPR

The user is viewing their own data — they're consenting by
opening the page. **Sharing** requires their explicit tap (no
auto-post). The Privacy Policy needs a one-line update before
launch:

> "We compile an annual personalised retrospective of your
> activity ('Afrizonemart Wrap'). You can opt out of receiving
> a wrap from /account/settings."

A `Settings.wrapOptOut` flag goes on User. Wrap aggregation
skips opted-out users. Default off (= opted in).

---

## 7. Timeline

| Phase | Window | Deliverable |
|---|---|---|
| **0. Start recording** | NOW (2026-06-08) | Schema + aggregation cron + admin preview endpoint. Snapshots accumulate daily from this point. |
| **1. Design pass** | Sep 2026 | Designer turns ASCII mockups into real visual deck. Iterate on card concepts. |
| **2. Frontend build** | Oct 2026 | Web `/wrapped/[year]` + mobile `WrapScreen` + image generation pipeline. |
| **3. Internal QA** | Mid Nov 2026 | Internal team previews their own real wraps via admin endpoint. Polish + bug-fix. |
| **4. Drop** | Dec 1, 2026, 09:00 GMT | Publish cron fires. Email + push campaigns go out. Frontend route flips live for users with publishedAt set. |
| **5. Re-engagement** | Dec 8 / Dec 15 | Reminder waves to users who haven't opened. |
| **6. Wind-down** | Jan 15, 2027 | Drop banner removed. Wrap stays viewable via direct URL year-round. |

**The critical move TODAY**: start the daily aggregation cron
running on prod NOW so that by Dec 1, we have a full year's
worth of incrementally-computed snapshots. If we wait until
November, the cron has to bulk-recompute every eligible user in
one batch (slower, more expensive, riskier).

---

## 8. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Low-volume users get a sad wrap | 3-order minimum; below shows "unlock at 3" teaser |
| Users feel surveilled | Frame as celebration; opt-out toggle in settings; no spend totals; sharing always explicit |
| Production load on Dec 1 — millions of image renders | Pre-render in November as part of QA pass; cache on R2 |
| Account deletion before Dec 1 — does the user still get a wrap? | No — account deletion zeros snapshot identity fields; wrap is for current customers |
| Card design becomes dated next year | `stats` JSON is decoupled from card templates; redesign yearly without re-aggregation |
| Wrong personality classification feels off | Personality is the loudest card; double-check the thresholds with real data during QA |
| Wrong "small businesses supported" number | §6.1 is the open gap; brand-string proxy is acceptable for v1 |

---

## 9. Status log

| Date | Event |
|---|---|
| 2026-06-08 | Doc created. Magnus + Claude aligned on framing (cultural + relational, not vanity stats). 9 card concepts drafted. Seller-wrap parked as sister feature pending §6.1 seller attribution. |
| 2026-06-08 | PR 1 shipped: `WrappedSnapshot` schema + migration applied to prod; `computeUserWrap` aggregation + daily cron + annual publish cron registered; admin preview / recompute / publish / hide endpoints under `/api/admin/wrap`. |
| 2026-06-10 | **Wrap admin console + live demo** shipped: `/admin/wrap` index (snapshot counts by year, 9-card data dictionary, user-ID preview), `/admin/wrap/demo` interactive demo (4 persona archetypes, tweakable knobs), shared `WrapDeck` 9-card visual. Adds `POST /api/admin/wrap/mock-preview` + `GET /api/admin/wrap/stats`. PR 4 still needed for production customer-facing renderer. |
| 2026-06-11 | **PR 1.5 API backfill + UI polish**: rebuilt the never-committed `mock-preview`/`stats` endpoints (api #58); white logo mark on every deck card (v2 #115); admin-managed **background music** — audio upload + `content.wrap.backgroundMusic` slot + `/admin/wrap` panel + deck playback (api #59, v2 #116). |
| 2026-06-11 | **PR 2 shipped** (api #60, deployed): customer `GET /api/wrap/me` — 200 discriminated `status` (ready/pending/locked/optedOut), not 404. New `/api/wrap` router; `me.service.ts`. |
| 2026-06-11 | **PR 4 shipped** (v2): `/wrapped/[year]` customer page — full-screen, all 4 states + sign-in prompt, reuses `WrapDeck` + music, URL share. Per-card PNG share still pending (PR 3). |

---

## 10. PR-by-PR implementation order

When greenlit, execute in this order:

1. **PR 1 (api)** — Schema migration for WrappedSnapshot.
   `prisma migrate deploy` on Railway. Aggregation logic
   (`computeUserWrap`). Daily aggregation cron registered at
   server boot. Admin preview endpoint
   (`GET /api/wrap/preview`). Status: **kicked off in this
   session.**
2. **PR 2 (api)** — Customer endpoint `GET /api/wrap/me`.
   Hide / unhide admin endpoint. wrapOptOut user flag.
3. **PR 3 (api)** — Image generation pipeline for the 9 cards
   via Satori. Cache layer on R2.
4. **PR 4 (v2)** — `/wrapped/[year]` route with the swipeable
   deck, share buttons, "unlock at 3" UI.
5. **PR 5 (mobile)** — WrapScreen modal route, native share
   handoff.
6. **PR 6 (api + comms)** — Annual publish cron for Dec 1 +
   email template + push subscriber. WhatsApp drop deferred
   to once Meta verification clears.
7. **PR 7 (designer)** — Visual design pass + animation. Not
   engineering, scheduled with designer in Sep.
8. **PR 8 (v2 + mobile)** — Wrap opt-out toggle in
   `/account/settings` + mobile profile. Settings.wrapOptOut
   flag.

Each engineering PR is one half-day to one day. Total ~3-4 weeks
of focused work spread across Jul-Nov, with the data quietly
accumulating in the background from PR 1 onwards.
