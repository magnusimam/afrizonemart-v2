# Afrizonemart 2.0 — Architecture Implementation Tracker

> Living document. Tick each checkbox as we implement. Under every item we'll
> log a plain-English summary of **what we actually did, when, and where the
> code lives** so future-you can find it without hunting.
>
> Sources:
> - `Afrizonemart_2.0_ScalableArchitecture_Apr2026_10EngineeringPrinciples.docx`
> - `Afrizonemart_2.0_ClaudeBuildGuide_v1.1_Apr2026_BrandUpdated (1).docx`
>
> Status legend: `[ ]` not started · `[~]` partially done · `[x]` done

---

## Where we stand right now (snapshot)

We've built the **frontend UI** end-to-end with mock data — homepage, product
detail, cart, full checkout flow (shipping → payment → success), account
section, shop/category/search/country pages, auth pages.

**As of 2026-04-25**: the **API project is bootstrapped** at
`../afrizonemart-api/` with Express + TypeScript + Prisma + PostgreSQL,
Winston, Sentry, the event bus, the error handler, and the first module
(products) end-to-end. Type-check passes. The frontend still uses mock data;
the next push wires the two together.

**As of 2026-04-26**: live Railway Postgres provisioned (project
`afrizonemart-dev`), schema migrated (init + auth), seeded (9 categories +
44 products). **Frontend Groceries section + product detail page now read
from the API** (server component fetches `/api/products/:slug` for detail;
TanStack Query hooks for the homepage grid). **Auth module is live**:
`POST /api/auth/{register,login,refresh,logout}` and `GET /api/auth/me`,
with JWT access + refresh, bcrypt password hashing, and refresh-token-hash
revocation. Process-level crash safety net added after a transient Railway
proxy blip killed the API mid-session — `asyncHandler` wrapper on every
route plus `unhandledRejection`/`uncaughtException` listeners in
`server.ts`. Frontend auth wiring is the next push.

---

## Active workstreams (queued 2026-04-26)

The four workstreams below are committed for the current push, in order.
Each one updates its proper Principle / Rule / Phase home as it lands and
gets ticked off here.

### 🔴 TOP PRIORITY — CTO operator tasks

38. **[~] Shipping & delivery cost algorithm** _(queued 2026-05-07)_.

    **Why**: existing `ShippingZone` + `ShippingRate` are flat-fee
    per-country only. No weight axis, no sub-country geography
    (Lagos and a remote Northern town pay the same), no carrier
    integration. CTO wants a system where weight + destination
    drive the price, with room for live carrier quotes (GIG, DHL,
    Sendy, Kwik) later.

    **Locked design choices**:
    - Real `weightKg` per product (admin enters once at create time;
      nullable so existing products don't break — fallback default
      0.5 kg when missing).
    - Country + flagship-city zones (Lagos first, others added as
      logistics partners go live). `ShippingZone.cities String[]`
      — empty = whole country, non-empty = sub-country zone.
    - Single shipping rate per cart for v1 (split shipping per
      supplier deferred to Phase 3).
    - Carrier provider registry mirrors the payment-gateway pattern.
      Manual provider ships in Phase 1; GIG → DHL → Sendy → Kwik
      added in Phase 2 as separate provider files.

    **Phase 1 — Manual zones × weight tiers (this push)**:
    - **Schema**: `Product.weightKg Float?`,
      `ShippingZone.cities String[]`,
      `ShippingRate.{minWeightKg, maxWeightKg, etaDaysMin, etaDaysMax}`.
      Each rate row is a *weight bracket* (e.g. "Lagos Standard
      0-1kg ₦1,500", "Lagos Standard 1-5kg ₦2,500"). Cart's total
      weight picks the bracket; multiple bracket sets per zone
      cover Standard / Express tiers.
    - **Provider interface** (`shipping/providers/types.ts`):
      `quote(ctx) → ShippingQuote[]` where `ctx` is destination +
      cart items. Drop-in shape for GIG/DHL/etc. later.
    - **Manual provider** (`shipping/providers/manual.ts`): zone
      lookup by `country + city`, then bracket lookup by total
      weight, then `freeAboveAmount` override on subtotal. Always
      returns at least one quote (catches all the way up to the
      `isDefault` "Rest of world" zone). This is the floor that
      always works.
    - **Quote service** (`shipping/quote.service.ts`): walks active
      providers in priority order, concatenates quotes. Phase 1
      only has manual; the walk is the seam Phase 2 plugs into.
    - **Public endpoint**: `POST /api/shipping/quote` —
      `{ destination, items[] }` → `{ quotes[] }`.
    - **Cart integration**: cart line items already carry
      productId + qty. Compute total weight by joining product
      weights server-side; expose `cart.weightKg` on the existing
      cart response so checkout can show "Cart total: 3.2 kg".
    - **Admin UI**:
      - `/admin/shipping` form gains: country list, **city list**,
        weight bracket inputs per rate row, ETA range (min/max days).
      - `/admin/products` form gains a single `weightKg` input next
        to price.
    - **Order**: `Order.shippingRateId` already exists; selected
      quote's rate id stays. Add `Order.shippingProvider` (string,
      defaults to `'manual'`) so Phase 2 can attribute orders to
      different carriers.

    **Phase 2 — Carrier provider registry (deferred)**:
    - `ShippingProviderConfig` table mirroring `PaymentGatewayConfig`
      (provider, isActive, priority, credentials Json).
    - One provider file per carrier: `gig-logistics.ts`, `dhl.ts`,
      `sendy.ts`, `kwik.ts`. Each implements `quote(ctx)` against
      the carrier's rate API.
    - Quote service walks active providers; manual stays last as
      the "always works" fallback when carrier APIs fail/timeout.
    - Order rows tag the provider used so fulfilment knows which
      carrier to actually book.

    **Phase 3 — Split shipping per supplier (deferred)**:
    - Move shipping from `Order` to a new `OrderShipment` (one row
      per supplier in the order). Sum carrier quotes. Schema-level
      change; gated on AZM actually fulfilling multi-supplier carts
      as separate parcels.

    Will mark `[x]` and log result on close.

37. **[x] Shelf Manager (admin-controlled product shelves)** _(landed 2026-05-07)_.

    **Why**: CTO audit confirmed no shelf renders mock product data (every
    shelf is API-fed via the placement system), but two gaps remained:
    (a) the **number of rows** rendered per shelf was hardcoded into each
    component (`limit={6}`), so the admin couldn't change "show 1 row" vs
    "show 3 rows" without a code edit; (b) curating a shelf required
    opening each individual product and ticking the placement on the
    product form — there was no single screen that lets an editor say
    "these 12 products go on the For Her shelf in this order."

    **Goal**: a `/admin/shelves` console where an editor picks a shelf
    (homepage_featured, shelf_groceries, shelf_for_her, etc.), searches
    the product catalog, drags the chosen products into an ordered list,
    sets rows × columns, optionally constrains each pick to a country
    subset (so a single shelf can deliberately mix products from
    different countries), and saves. Followed by extending the
    page-builder `product-grid` section with the same picker + a
    `mode: 'placement' | 'manual' | 'filter'` so any new shelf on a CMS
    page gets the same controls without touching code.

    **Shipped (Phase B — admin shelf manager)**:
    - **Schema**: new `Shelf` Prisma model
      (`afrizonemart-api/prisma/schema.prisma:639-666`), one row per
      placement key, with `title`, `subtitle`, `rows`, `cols`,
      `enabled`. Migration at
      `afrizonemart-api/prisma/migrations/20260507120000_shelves/`.
      Per-product membership stays in `ProductPlacement`.
    - **API — `shelves` module**
      (`afrizonemart-api/src/modules/shelves/`): public
      `GET /api/shelves/:key` returns `{ shelf, items }` with
      country scoping; admin `GET /admin/shelves`,
      `GET/PUT /admin/shelves/:key`,
      `PUT /admin/shelves/:key/products` for batch save.
    - **API — products endpoint**: `listProductsQuerySchema` now
      accepts `ids` (CSV or repeated). Repository early-returns the
      products in input order so manually-curated grids render in the
      saved sequence.
    - **Idempotent seeder** (`seedDefaultShelves`) runs on every API
      boot — writes a `Shelf` row for each registry placement key with
      `rows: 1, cols: 6, enabled: true` if missing.
    - **Storefront**: `useShelf(key, country)` hook +
      `lib/api/shelves.ts` client. `PlacementShelf` and
      `PlacementOrFallbackGrid` now read `rows × cols`, `title`,
      `subtitle`, and `enabled` from the shelf config; cap items to
      `rows × cols`; render nothing when disabled. Existing call
      sites keep working — props are honoured as fallback.
    - **Admin UI**: `/admin/shelves` list grouped by registry group
      with product counts and live/hidden badges; detail page at
      `/admin/shelves/[key]` with title/subtitle/rows/cols/enabled
      editor, product picker (debounced search against
      `/api/admin/products`), reorder with up/down arrows, per-product
      country chips, optional show-from / hide-after schedule. Saves
      shelf settings + product list in parallel. Sidebar entry
      "Shelves" added under `products.write` capability.

    **Cross-country mixing**: shipped via the existing
    `ProductPlacement.countries[]` field. A single shelf can carry a
    Nigerian, a Kenyan, and a Ghanaian product simultaneously; per-row
    country chips in the admin let an editor decide whether a given
    pick is global (empty chips) or country-scoped.

    **Empty-category rule**: confirmed by audit — every storefront
    product container is API-fed (no hardcoded product arrays). If a
    placement / category returns zero products, `PlacementShelf`
    returns null and `PlacementOrFallbackGrid` renders the
    "Nothing here yet — check back soon." line. No mock fallback.

    **Phase A — page-builder `product-grid` section extension**:
    deferred. The `Page`/`PageSection`/`PageRevision` Prisma models
    exist (lines 902-1008) but no Express module, no storefront
    renderer, and no `/admin/site-pages` UI. Only `cms/` (legacy
    `CmsPage` + `PageBlocks.tsx`) is wired. Picking up Phase A
    requires the page-builder system itself to land first.

37. **[~] Shelf Manager phase A — page-builder product picker** _(deferred 2026-05-07)_.

    Goal was to extend the page-builder `product-grid` section with
    `mode: 'placement' | 'manual' | 'filter'`, `productIds[]`,
    `rows`, `cols`, `countries[]`, and a product picker reused from
    `/admin/shelves`. Blocked: the page-builder module
    (`afrizonemart-api/src/modules/pages/`) and storefront
    `PageRenderer`/section components don't exist on disk despite
    being recorded as shipped on 2026-05-03 — only the schema models
    are present. Reopen once the page-builder code lands.

36. **[x] Page-builder CMS (Phase 1 + draft/publish + scheduling) and full Blog system** _(2026-05-03)_ — done.

    **Why**: CTO wanted a content management system so non-engineers
    can edit any page on the site (homepage, category pages, landing
    pages) without touching code — change images, headlines, container
    accents, number of product rows per shelf, drag sections to reorder,
    add new sections, hide sections temporarily, and target sections by
    country or schedule. Plus a full blog with SEO indexing.

    **Schema** (`afrizonemart-api/prisma/schema.prisma`):
    - `Page` — slug + title + publishedAt
    - `PageSection` — typed sections (`type` discriminator, `position`,
      `headline`, `subheadline`, `accentColor`, `config Json`,
      `draftConfig Json` for future draft semantics, `startsAt`,
      `endsAt`, `countries[]`)
    - `PageRevision` — snapshot of the entire section list per publish.
      Last 50 retained per page.
    - `BlogPost` — slug, title, excerpt, content (HTML), heroImage +
      alt, author snapshot, status (DRAFT/PUBLISHED/SCHEDULED),
      publishedAt, full SEO meta overrides, tags[], readingTimeMin
    - `MediaAsset` — placeholder for the deferred image library

    Schema applied via `prisma db push` to both dev and prod.

    **API — pages module** (`src/modules/pages/`):
    - `GET /api/site/:slug` — public, returns the latest revision
      snapshot filtered by visibility window + country (geo cookie)
    - `/api/admin/site-pages/*` — full admin CRUD: pages, sections,
      reorder, publish, list revisions, revert
    - 9 section types with zod-validated config schemas in
      `section-types.ts`: hero, product-grid, category-shelf,
      image-banner, rich-text, africa-map, newsletter, trust-bar,
      quotation-form
    - Public reads from latest **revision snapshot** rather than
      live PageSection rows — gives true draft/publish: admin edits
      to PageSection are invisible until they click Publish (which
      writes a fresh snapshot)

    **API — blog module** (`src/modules/blog/`):
    - `GET /api/blog`, `GET /api/blog/:slug`, `GET /api/blog/tags`
    - Admin CRUD with status transitions (DRAFT/PUBLISHED/SCHEDULED)
    - Cron (`startScheduledBlogCron`, 60s tick) flips SCHEDULED →
      PUBLISHED when the time arrives
    - Auto-computed reading time (200 wpm)

    **Storefront — page builder**:
    - `<PageRenderer slug="..." />` (`src/components/page-builder/`)
      fetches `/api/site/:slug` and dispatches each section to its
      registered renderer. Each section wrapped in `SafeBoundary` so
      a single bad config can't take down the whole page.
    - 9 `Builder*` section renderers under
      `src/components/page-builder/sections/` mirror the section types
    - `app/page.tsx` (homepage) replaced with
      `<PageRenderer slug="home" fallback={<HomeFallback />} />` — the
      hardcoded layout is the fallback when the home page hasn't been
      published. Once seeded + published, the builder takes over.

    **Storefront — blog**:
    - `/blog` — paginated list with tag filter chips + breadcrumb +
      Metadata API (canonical, OG, Twitter)
    - `/blog/[slug]` — post detail with hero image, breadcrumb, body
      HTML render, related posts, full SEO meta, **Article JSON-LD**
      for Google Discover + rich result eligibility
    - `/blog/rss.xml` — RSS 2.0 feed (1h cache) for syndication
    - Sitemap (`app/sitemap.ts`) extended to include `/blog` index
      + every published post

    **Admin — site builder UI** (`/admin/site-pages`):
    - List of pages with create-new + status badges
    - Builder page: section list with up/down reorder, visibility
      toggle, delete, click-to-edit
    - Editor pane: per-type config editor (`SectionEditor.tsx`
      switches on type), accent color presets + custom hex,
      headline/subheadline overrides
    - Visibility & targeting: Show from / Hide after datetime
      pickers + ISO-2 country codes
    - Publish button + publish note + revision history with
      one-click revert

    **Admin — blog UI** (`/admin/blog`):
    - List with status filter + search, status badges
    - `/admin/blog/new` and `/admin/blog/[id]` share `<BlogPostForm>`
    - Editor: title (auto-derives slug), excerpt, hero image upload,
      HTML body with live preview toggle, author, tags, full SEO
      panel (meta title/desc/OG image), status + scheduled-publish
      datetime, "Save & publish now" shortcut
    - Word count + reading time live in the editor

    **Initial home-page seed**
    (`afrizonemart-api/scripts/seed-home-page.ts`):
    Idempotent — creates the "home" page with 9 sections that mirror
    the existing hardcoded layout (hero with 4 slides, groceries grid,
    deals, customer favourites / new arrivals, beauty for-her, home,
    books, trust bar, newsletter). Publishes immediately + writes
    initial revision. Already run against prod DB.

    **AdminSidebar**: new "Site Builder" + "Blog" links. Existing
    "Pages" route renamed to "Pages (legacy)" — distinct from the
    new builder; will be retired in a future cleanup.

    **Mount paths** (avoiding the legacy `cmsRoutes` at `/api/pages`):
    - Public new page-builder: `/api/site/:slug`
    - Admin new page-builder: `/api/admin/site-pages/*`
    - Public blog: `/api/blog`
    - Admin blog: `/api/admin/blog`

    **Deferred to future sessions**:
    - Image library with required alt text (`MediaAsset` model
      already in schema, just no UI yet)
    - Section templates (clone-as-template / save-as-template)
    - Mobile preview toggle in the builder
    - Audit-log surface for who-edited-what-when (existing audit
      module captures it, just no UI surface)
    - True draft preview — admin currently can't see their unpublished
      edits as they'll appear on the storefront. Workaround: the
      builder UI itself is a structured representation
    - TipTap/ProseMirror rich-text editor (currently HTML textarea
      with live-preview toggle)
    - Per-product placement config UI for the `placement`
      product-source kind (the API already supports it via the
      placements module)

35. **[x] Dedicated admin sign-in UI + admin user re-seeded** _(2026-05-01)_ — done.

    **Symptoms reported**: customer login worked but landed admins
    in `/admin` from a marketing-flavoured page; "Google sign-in
    button is missing"; "admin login isn't working."

    **Root causes**:
    - Prod DB had the admin user but the original seed password was
      forgotten. `Invalid email or password` was the API responding
      correctly. Reset via direct DB write through the Railway
      public proxy URL (`shuttle.proxy.rlwy.net:25514`).
    - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is unset in Vercel env, so
      `GoogleSignInButton` short-circuits to `return null`. Same on
      Railway side (`GOOGLE_CLIENT_ID` unset). Out of scope until
      Magnus creates an OAuth Client in Google Cloud Console.
    - There was no separate admin sign-in surface — admins shared
      `/login` with customers.

    **Built**: `app/(admin-auth)/admin/login/page.tsx`. Distinct
    route group so the `RequireAdmin` guard doesn't bounce
    visitors into a redirect loop (the (admin) layout would
    otherwise wrap any `/admin/*` URL). Visual treatment:
    full-screen navy gradient, white-on-navy form, amber CTA,
    shield icon, "restricted area" subtitle. No alt sign-in
    methods (Google/phone are customer-facing concerns). No
    "create account" link.

    **Behaviour**:
    - Already-authed admins are redirected straight to `/admin`
      (or the `?returnUrl` if it points inside `/admin`) — refresh
      doesn't kick you out.
    - A successful sign-in for a non-ADMIN account is rejected
      here: the freshly-issued session is cleared and the form
      shows "This account is not an admin. Use the customer
      sign-in at /login." Avoids leaving a half-authed customer
      with admin-flow expectations.
    - `RequireAdmin.tsx` now redirects unauthenticated visitors
      to `/admin/login?returnUrl=…` instead of `/login`. Keeps
      admin flow self-contained.
    - `(admin-auth)/layout.tsx` sets
      `robots: { index: false, follow: false }` so search engines
      never index the admin sign-in (no point inviting
      credential-stuffing).

    **Followups**:
    - Google sign-in wiring once Magnus provides the OAuth Client
      ID (frontend and backend env both need it; same value).
    - `/legal/terms` 404 spotted in browser console — separate
      placeholder page in the footer that was never built. Add
      a stub or remove the footer link.

34. **[x] Bulk product actions in admin** _(2026-05-01)_ — done.

    **Why**: CTO wanted to apply changes to many products at once
    rather than clicking row-by-row, especially before/after a CSV
    import sweep.

    **API**: new `POST /api/admin/products/bulk` with body
    `{ ids: string[] (1–500), action: { kind: 'delete' | 'set-in-stock' (+ value: bool) | 'set-category' (+ categorySlug: string|null) } }`.
    Implementation in `products/admin.service.ts` →
    `adminBulkProductAction`. Returns `{ affected, skipped: [{id, reason}] }`.

    **Partial-success semantics for `delete`**: products with order
    history (`OrderItem.productId` references) are skipped server-
    side rather than failing the whole call — same rule as the
    single-delete path. The toast tells the admin how many went
    through and shows the first reason. Cart items + reviews are
    cleaned up in a transaction before the actual `deleteMany`.

    **UI** (`/admin/products/page.tsx`):
    - Per-row checkbox + tri-state "select all on this page" header
      checkbox (uses `indeterminate` when some-but-not-all visible
      rows are selected).
    - Selection persists across pagination + filter changes so
      admins can sweep across many pages.
    - Sticky navy action bar appears the moment >0 are selected:
      "Mark in stock", "Mark out of stock", "Move to…"
      (dropdown with the full 2-level category tree, indented),
      "Delete", and "Clear".
    - Delete uses `ConfirmDialog` with explicit copy about the
      order-history skip behaviour.
    - On success, selection clears and the table reloads. On any
      `skipped` rows the toast switches to info-tone and surfaces
      the first reason.

    **Why a custom action bar instead of a `<select>` of actions**:
    discoverability + tap targets — admins doing bulk ops on a
    laptop or tablet want one click per intent, not click → choose
    → click "Apply".

33. **[x] Subcategories + self-healing CSV import** _(2026-05-01)_ — done.

    **Why**: CTO was about to upload products via CSV with a
    `subcategory` column that didn't map to anything in the schema,
    plus wanted the CSV to never get blocked by "category doesn't
    exist yet" or "field not in product form" errors.

    **Schema** (`afrizonemart-api/prisma/schema.prisma`):
    `Category` gains `parentId String?` self-relation
    (`@relation("CategoryTree")`, `onDelete: SetNull`) and an index
    on `parentId`. Migration file
    `prisma/migrations/20260501120000_category_parent/migration.sql`
    captures the SQL; DB is synced via `prisma db push` since this
    project never baselined `_prisma_migrations` (kept consistent
    with prior history). Category slugs remain globally unique so
    storefront URLs stay unambiguous.

    **API CSV import** (`products/admin.bulk.ts`):
    - New `subcategorySlug` column. Auto-creates the subcategory
      under the row's `categorySlug` parent if missing. The
      product's `categoryId` always points at the leaf
      (subcategory if present, else top-level) — Shopify/WooCommerce
      pattern. Errors raised when:
        - `subcategorySlug` set but `categorySlug` empty (sub needs parent),
        - the named subcategory slug already exists under a *different*
          parent (silent mis-assign protection — common WordPress trap).
    - **Unknown columns** stash into
      `attributes.customAttributes.<colname>` on the product. Empty
      values skipped (sparse spreadsheets don't wipe data). On
      UPDATE the importer merges new keys over existing
      customAttributes without touching the rest of attributes
      (bundles/features/specs/about) — preserves hand-edited
      content.
    - Result type now includes `unknownColumns: string[]` so the
      dialog can surface "you uploaded a `weight` column we didn't
      recognise — saved into customAttributes."

    **Categories module**:
    - `admin.service.ts` enforces max depth 2 (no grand-children),
      blocks moving a category that has children, blocks deleting
      a category with subcategories nested under it.
    - Public list endpoint (`categories/routes.ts`) now returns a
      tree (top-level + nested children) for the storefront's
      navigation. Product counts are per-node only — not rolled up
      from descendants — so empty subcategories can be hidden at
      render time without lying about the parent count.

    **Admin UI**:
    - `/admin/categories` rewritten as a tree view with
      collapse/expand handles, `+ Sub` action on top-level rows,
      inline subcategory draft form. Sub rows visually offset and
      tagged with a "sub" pill.
    - `ProductForm.tsx` Organisation section now a 2-step picker:
      Category (top-level) → Subcategory (children of that
      category). Picking a parent clears any previously-chosen
      sub. Sub select hidden when no children exist; hint text
      points admin to /admin/categories.
    - `ImportCsvDialog.tsx` help block updated:
        - lists `subcategorySlug` and the parent-required rule,
        - explains the unknown-columns stash + that empty values
          don't wipe.
      After import, the dialog renders a yellow "Unrecognised
      columns saved as custom attributes" panel with each column
      name as a chip + a pointer to /admin/custom-fields for
      promotion.

    **Storefront**:
    - New nested route
      `/shop/[category]/[subcategory]/page.tsx` resolves the pair
      from the public categories tree; 404s when the child
      doesn't actually belong to the named parent (no
      `/shop/books/fresh-fruits` confusion). Breadcrumb shows
      Home → Shop → Parent → Sub. Still uses the shared
      mock-product placeholder grid pending the broader
      "/shop/[category] pages still on mocks" migration tracked
      in Followups.

    **Followups added**:
    - `/shop/[category]` and `/shop/[category]/[subcategory]`
      both still render mock products. Migrate to
      `useProducts({category: leafSlug})` once the followups
      list catches up — single change covers both routes.
    - Header nav has no submenu UI yet; subcategories aren't
      discoverable through the top-bar dropdown until that lands.

    **CSV template** now ships with `subcategorySlug` as a
    column and four example rows including one that auto-creates
    both category + subcategory (`furniture` + `living-room`).

32. **[x] Apex domain cutover — afrizonemart.com goes live on Vercel** _(2026-05-01)_ — done.

    Old WordPress is fully retired; v2 now serves on the apex.

    **Symptom**: DNS for `afrizonemart.com` resolved to `76.76.21.21`
    (Vercel's apex IP per the original DEPLOY.md), and Vercel showed
    the domain attached + aliased to a Ready production deployment,
    but `https://afrizonemart.com:443` refused all TCP connections.
    `afrizonemart.vercel.app` worked. Classic "DNS correct, Vercel
    config correct, no TLS" pattern.

    **Diagnosis** (via Vercel API
    `/v6/domains/afrizonemart.com/config`):
    - `aValues: ["76.76.21.21"]`
    - `recommendedIPv4: rank 1 = ["216.198.79.1", "64.29.17.1"]`,
      rank 2 = `["76.76.21.21"]`
    - `ipStatus: "optional-change"`, `misconfigured: false`,
      `verified: true`

    Vercel **deprecated `76.76.21.21`** in 2026 and migrated apex
    traffic to a new IP pair. The old IP is still listed as rank 2
    (so `misconfigured` reports `false` — silent footgun) but in
    practice no longer accepts traffic, which means Vercel's HTTP-01
    cert challenge can't reach the domain → no cert issued → 443
    refuses every connection.

    **Fix** (Cloudflare DNS, via API):
    - Updated apex A record `afrizonemart.com` from `76.76.21.21`
      → `216.198.79.1` (proxy off)
    - Added second apex A record `afrizonemart.com → 64.29.17.1`
      (proxy off)
    - `www` CNAME `cname.vercel-dns.com` left as-is (still rank 2,
      still works)
    - Cert issued within seconds; `https://afrizonemart.com` →
      200 OK, `https://www.afrizonemart.com` → 308 redirect to apex.

    **Second issue uncovered during the cutover**: someone (or
    something) had flipped `api.afrizonemart.com` from gray cloud to
    orange cloud the day before, which made every API request go
    through Cloudflare's WAF and return `403 Forbidden`. Restored
    `proxied: false` so traffic goes direct to Railway's Fastly edge
    via CNAME `wcvxy749.up.railway.app`. CORS preflight from
    `https://afrizonemart.com` now returns 204 with the right
    `access-control-allow-origin`.

    **Railway env updates**:
    - `WEB_URL=https://afrizonemart.com` (was
      `https://afrizonemart.vercel.app`)
    - `CORS_ORIGINS=https://afrizonemart.com,https://www.afrizonemart.com,https://afrizonemart.vercel.app`
      (kept vercel.app as fallback for QA)
    - API auto-redeployed on env change.

    **Doc updates**: `DEPLOY.md` step 5.6 rewritten to use the new
    IP pair, flagging the silent `misconfigured: false` footgun and
    that the orange cloud breaks HTTP-01 renewal so it must stay
    gray on the apex.

    **Lesson for the file**: when Vercel's `domains config` API
    reports `misconfigured: false` with `ipStatus: "optional-change"`,
    treat it as a hard misconfiguration. The current `aValues` may
    be on a deprecated rank-2 entry that no longer accepts traffic.

31. **[ ] Submit sitemap.xml + sitemap-images.xml to Google Search Console** _(queued 2026-04-29 — TOP PRIORITY)_.

    The eight-layer SEO pass (item #27) is shipped, but **Google
    won't crawl us at scale until the sitemaps are submitted in
    Search Console**. Without this step the indexing-eligible pages
    stay near-invisible for the first few weeks of launch.

    **Steps Magnus needs to do** (one-time, ~10 minutes):

    1. Go to https://search.google.com/search-console
    2. **Add property** → enter `https://afrizonemart.vercel.app`
       (or `https://afrizonemart.com` once the apex DNS is cut over —
       see project memory `production_deploy`).
    3. Verify ownership. Easiest: pick the **HTML tag** method. Copy
       the `<meta name="google-site-verification" …>` token Google
       shows you and tell Claude — it goes into `app/layout.tsx`'s
       `metadata.verification.google` field. Redeploy and click Verify
       in GSC. Alternative: **DNS TXT** record on Cloudflare (already
       managing afrizonemart.com DNS).
    4. Once verified, in the GSC sidebar pick **Sitemaps** and add:
       - `sitemap.xml`
       - `sitemap-images.xml`
    5. Both should report **Success** within a few minutes. From
       there:
       - Google starts crawling every product, category, and CMS page.
       - Image-Search ranking activates for product photos.
       - Coverage and Performance reports populate within ~48 hours.

    **Bonus tasks while in GSC** (each takes < 60 seconds):
    - **Bing Webmaster Tools** — same sitemaps, mirror submission at
      https://www.bing.com/webmasters. Picks up Yahoo + DuckDuckGo
      indirectly.
    - **Google Merchant Center** — link the same property and
      auto-feed product data via the Product JSON-LD already on every
      PDP. Eligible for free Shopping listings.
    - **Google Business Profile** (if you set up a physical Lagos
      address) — links the brand to a verified business entity.

    **What to watch in the first 7 days**:
    - GSC → Coverage → "Indexed" should climb from ~0 to ~80% of
      submitted URLs within a week.
    - GSC → Performance → impressions for branded queries
      ("afrizonemart") should appear within 48 hours; product-specific
      queries within 2 weeks.
    - Sentry → no spike in 404s on `/sitemap.xml` or
      `/sitemap-images.xml` (means Google is fetching them OK).

    **Why this is top priority over #29 (more gateways) and #30
    (more mobile polish)**: those compound from launch. GSC
    submission compounds from *the day Google first crawls us* — every
    day delayed is a day of lost organic-search reach.



1. **[x] Auth hardening** _(2026-04-26)_ — done.
   - **API**: `cookie-parser` mounted; `auth/controller.ts` sets/reads/
     clears `azm_refresh` httpOnly cookie (Path=`/api/auth`,
     SameSite=`Lax` in dev / `None;Secure` in prod, MaxAge 60 days).
     Login/register/refresh responses no longer include `refreshToken`
     in the JSON body — only `user` + `accessToken`. The refresh
     endpoint reads exclusively from the cookie; missing cookie → 401.
     `refreshBodySchema` removed.
   - **Frontend**: `authStore` drops `refreshToken` from state and from
     the persisted shape via `partialize`; previous-session refresh
     tokens in localStorage become inert. `lib/api/auth.ts` now sends
     `credentials: 'include'` on every call so the cookie ships.
     New `lib/api/client.ts` (`apiFetchAuthed`) attaches the access
     token from the store and on a 401 calls `refresh()` once before
     retrying. If refresh fails the store is cleared and the 401
     bubbles to the caller.
   - Verified with curl: login returns Set-Cookie, refresh-with-cookie
     issues new pair, refresh-without-cookie returns 401.
2. **[x] Migrate remaining homepage product sections to the API**
   _(2026-04-26)_ — done.
   - New shared `src/components/product/ProductGridFromQuery.tsx` does
     the skeleton/error/card-render dance once. Each section is now a
     thin chrome wrapper around it (3-4 line body each).
   - **Migrated**: ProductsSection (Groceries), DealsSection (filtered
     by `onSale=true`, computes discount % from comparePrice),
     FavouritesSection (`sort=newest, limit=24`), FemaleProductsSection
     (`category=beauty`, pink button variant), PurchaseBigSection
     (`category=interior-decor`), BooksSection (`category=books`).
   - **API change**: added `onSale: 'true'|'false'` filter to
     `listProductsQuerySchema` + `repository.ts` (`comparePrice not null`
     when true).
   - **Frontend types**: `ListProductsParams.onSale` added; URL
     serialiser handles the new param.
   - **Verified**: `GET /api/products?onSale=true` returns 6 rows, all
     with valid comparePrice. Updates Rule B1 → `[x]`.
3. **[x] Schema-driven product detail (Principle #4 milestone)**
   _(2026-04-26)_ — done.
   - **Schema**: `Product` gains `shortDescription`, `ingredients`,
     `discountPercent`, `attributes Json @default("{}")`. New `Review`
     model (id, productId, authorName, authorCountry, rating, title,
     body, verified, timestamps) with cascade delete. `ProductImage`
     side table deferred — `images String[]` is fine until R2 lands.
     Migration `20260426190010_product_detail`.
   - **Seed**: rewritten with `defaultAttributes(p)` generator that
     scales bundle pricing off the unit price so all 44 products get
     sensible bundles/features/specs/about content. Maya keeps its
     bespoke template + 4 anchor reviews.
   - **Frontend**: `ApiProduct` type extended with `attributes`,
     `discountPercent`, `shortDescription`, `ingredients`, optional
     `reviews[]`. `loadProductDetail` rewritten as a pure-API mapper
     (no overlay), with relative-date helper for review timestamps.
   - **Bonus**: Prisma transient-error retry extension landed too
     (`prisma.$extends({ query: { $allOperations } })`) — auto-retries
     P1001/P1002/P1008/P1017 with exponential backoff (200ms, 400ms,
     up to 2 retries). This unblocked testing on Railway proxy blips
     and closes the third Followup. Updates Principle #4 → `[x]`.
   - **Verified**: 5 random product pages all return 200 with real
     bundles, features, specs, breadcrumb, and (where seeded)
     reviews.
30. **[ ] Mobile view pass — every page** _(queued 2026-04-29)_.

    Most surfaces are responsive but were not specifically audited on
    mobile. Need to walk through every page at iPhone-12-mini width
    (375px) and tablet width (768px), tighten any horizontal-scroll
    bleed, large-text wraps, touch-target sizes (≥44px), and fix the
    Hero / AfricaMap / category dropdown / cart / checkout / PDP
    layouts where collapsed grids look cramped.

29. **[ ] Payment gateway expansion — Paystack + Flutterwave + optional Squad public key** _(queued 2026-04-29)_.

    Today only Squad and Stub are registered in
    `payments/registry.ts`. The admin form auto-renders any provider
    we register, so adding a new one is one file + one registry entry.

    - Build `paystack-gateway.ts` (init, verify, webhook signature)
      and add to `PROVIDER_FACTORIES`.
    - Build `flutterwave-gateway.ts` similarly.
    - Optionally add a `publicKey` (text, not required) field to the
      Squad provider definition for future inline-widget support.
      Today we use Squad's redirect flow which doesn't need it.
    - Each adapter ~150 lines mirroring `gtsquad-gateway.ts`.

    **Webhook URL for Squad** (record for ops):
    `https://api.afrizonemart.com/api/payments/webhook`. Already wired
    via `paymentRoutes.post('/webhook', webhookHandler)` with
    HMAC-SHA512 signature verification on the raw body.

28. **[x] Product upload workflow audit + bulk CSV polish** _(2026-04-29)_ — done.

    **The 12 CSV columns** (PDP-aligned, 1:1 with what the public
    product page reads):
    1. `slug` _(optional — auto-generated from `name` if blank)_ — URL identifier, e.g. `maya-himalaya-facial-scrub`
    2. `name` _(required)_ — display title shown on cards + PDP
    3. `brand` _(optional)_ — manufacturer / line / artisan name
    4. `price` _(required)_ — selling price in NGN integer
    5. `comparePrice` _(optional)_ — strike-through "was" price; if higher than `price`, discount % is auto-computed
    6. `categorySlug` _(optional, auto-creates if unknown)_ — e.g. `beauty`, `groceries`, `fashion`
    7. `origin` _(optional)_ — ISO-2 country code (e.g. `NG`, `KE`, `ZA`); used for the flag on cards + the country chapter on `/new-arrivals`
    8. `inStock` _(optional, defaults true)_ — `true|false|yes|no|1|0`
    9. `shortDescription` _(optional)_ — one-line tagline shown on PDP under the name
    10. `description` _(optional)_ — the long-form copy in the Description accordion
    11. `ingredients` _(optional)_ — text shown in the Ingredients accordion (when set, that accordion section appears)
    12. `images` _(optional)_ — `|`-separated list of image URLs; can be left blank and attached per-product after import

    Computed automatically and not exposed as columns:
    - `discountPercent` — derived from `price` vs `comparePrice`
    - `attributes` JSON (bundles, features, specifications, aboutTitle, aboutBody, aboutImage) — auto-defaulted on CREATE, preserved on UPDATE so a CSV refresh of pricing/copy never wipes hand-tuned content. Editable per-product later via the admin form.

    **Audit findings**: the foundation was already solid —
    - `<ImportCsvDialog>` already surfaces per-row errors (not just
      console-logs) with row number + slug + message.
    - `BulkUploadResult` returns `{total, created, updated, skipped,
      errors, results[]}` — exactly the shape needed for UI.
    - Existing rows update by slug; hand-edited `attributes` (bundles,
      features, specs, about) are preserved on UPDATE so a CSV refresh
      of pricing/copy doesn't wipe carefully tuned content.
    - Discount % auto-computed from price/comparePrice.
    - Sensible auto-defaults applied to `attributes` only on CREATE.

    **Gaps fixed today**:
    - `slug` is now optional — auto-generated from `name` via a
      80-char-max lower-kebab slugify.
    - `categorySlug` is now auto-created when unknown — admin doesn't
      need to pre-create categories before importing. Reuses the same
      newly-minted row across rows in the same import. Renaming via
      `/admin/categories` post-import is a one-line edit.
    - In-dialog help block (`<details>` accordion) explains the
      workflow up-front — required vs optional fields, slug behaviour,
      category behaviour, image attach pattern, update-by-slug
      semantics.
    - Required-columns hint in the upload zone updated from
      "slug, name, price, categorySlug" to "name, price · Optional
      slug, brand, categorySlug, …".
    - `BULK_TEMPLATE_CSV` now ships 4 example rows demonstrating: full
      row, slug-auto, category-auto-created, minimal/out-of-stock.

    **The full workflow** the CTO asked for:
    1. Admin builds a spreadsheet of products (Excel / Google Sheets)
       with the 12 columns. Only `name` + `price` are required.
    2. Export as CSV, upload via `/admin/products` → "Import CSV".
    3. Errors (if any) shown per-row in the dialog — admin fixes the
       offending rows in the source sheet and re-imports.
    4. After import, admin opens each new product's edit page and
       attaches images via `<ImageUploader>` (drag-drop or pick → R2
       upload → URL stored on the row). The product is now live with
       full PDP rendering: bundles/features/specs/about all
       auto-defaulted, hand-tunable from the same edit page later.

    **Verified**: edit page handles a CSV-imported row with no images
    correctly (gallery falls back to a Package icon placeholder; admin
    can drop in images and save).

    Spec from CTO: "create a table with all product information
    fields, upload, takes effect immediately and perfectly synced.
    The only manual step should be attaching their respective images."

    **What works today**:
    - `/admin/products/new` form covers all 13 product fields
      (name, slug, brand, shortDescription, description, ingredients,
      price, comparePrice, origin, inStock, category, images,
      attributes JSON, custom fields, placements).
    - `<ImageUploader>` drag-drop, multi-image, R2-backed.
    - `<ImportCsvDialog>` exists for bulk import.
    - Per-product custom fields render dynamically from the
      `CustomFieldDef` registry.

    **What needs verification + fixing**:
    - CSV header mapping covers every column the public PDP reads
      (name, slug, brand, shortDescription, longDescription,
      ingredients, price, comparePrice, origin, inStock,
      categorySlug, attributes — features/specs/bundles/about).
    - Auto-slug-from-name when slug column is empty.
    - Auto-create-category when `categorySlug` is unknown (CTO
      previously OK'd this for the WordPress import).
    - Post-import "attach images" pass — admin opens each row, uses
      `<ImageUploader>` to add R2 images. Verify the edit page
      handles a row that was created via CSV with no images.
    - Surface CSV import errors in the UI (today they only log to
      console).
    - Document the workflow in a one-pager admin can read.

27. **[x] SEO indexability — full coverage** _(2026-04-29)_ — done.

    Eight-layer SEO pass shipped. Every page, every product, every
    image, every CMS-authored content piece is now discoverable +
    indexable.

    **Layer 1 — Site identity foundation (`src/lib/seo.ts`)**:
    - `SITE_URL`, `SITE_NAME`, `SITE_TAGLINE`, `SITE_DEFAULT_TITLE`,
      `SITE_DEFAULT_DESCRIPTION`, `SITE_DEFAULT_OG_IMAGE`,
      `SITE_TWITTER` — single source of truth for every meta tag.
    - `absUrl(path)` — path → absolute URL helper.
    - `metaDescription(input, fallback)` — strips HTML, collapses
      whitespace, clamps to 155 chars (Google's display threshold).
    - `productImageAlt(product)` — builds enriched alt text.

    **Layer 2 — Site-wide JSON-LD
    (`src/components/seo/SiteJsonLd.tsx`)**:
    Mounted in `<head>` of root layout. Emits two `@graph` entries:
    - `Organization` — name, logo, description, social `sameAs`,
      contact point with multilingual `availableLanguage`.
    - `WebSite` — includes a `SearchAction` so Google shows a
      sitelinks search box for the brand in SERP.

    **Layer 3 — Root metadata
    (`src/app/layout.tsx`)** — full Next 14 Metadata API:
    - `metadataBase` (so relative OG URLs resolve correctly)
    - `title.template` — `%s | Afrizonemart` appended to every
      per-page title automatically
    - `keywords`, `applicationName`, `authors`, `referrer`,
      `formatDetection`
    - `alternates.canonical` + `alternates.languages.en`
    - `openGraph` (type, locale, siteName, image 1200×630)
    - `twitter` (summary_large_image card, site/creator handles)
    - `robots` with explicit `googleBot` directives
      (max-snippet, max-image-preview=large, max-video-preview)
    - `icons` (favicon + apple-touch)

    **Layer 4 — Product detail page
    (`src/app/(shop)/product/[slug]/page.tsx`)**:
    - `generateMetadata` returns title, description (cleaned via
      `metaDescription`), canonical, OG (with first product image as
      og:image), Twitter Card.
    - JSON-LD upgraded to a `@graph` with TWO entries:
      - `Product` — name, brand, description, image[], sku, category,
        countryOfOrigin, aggregateRating, offers (priceCurrency, price,
        availability, itemCondition, **seller**)
      - `BreadcrumbList` — Home → Category → Product (Google shows
        breadcrumb chips in SERP when present)
    - 404 (notFound) returns `robots: { index: false }` so dead
      product slugs don't pollute the index.

    **Layer 5 — Image alt enrichment
    (`src/lib/products.ts → imagesFromApi`)**:
    Every product gallery image now has alt text in the form
    `{name} — by {brand} — {category} from {origin} — Afrizonemart`.
    First image gets the full alt; subsequent images append
    `— view N` so each is uniquely identifiable in image search.

    **Layer 6 — Category pages
    (`src/app/(shop)/shop/[category]/page.tsx`)**:
    `generateMetadata` per category — title, unique description,
    canonical (`/shop/<slug>`), OG, Twitter Card. Falls back to a
    sensible humanized name + generic description for unknown
    categories.

    **Layer 7 — Standalone-page metadata**:
    Added `layout.tsx` with `metadata` exports to client-only pages
    that previously had no SEO:
    - `/new-arrivals` — "New Arrivals — Latest African-Made Products"
    - `/deals` — "Today's Deals — Discounts on African-Made Products"
    - `/search` — "Search Products" (indexable landing, query
      strings ignored to avoid SERP-bloat)
    - `/p/[...slug]` (CMS pages) — title from CMS row, description
      from `metaDescription` field, OG `type: article`, canonical
    - `/special-discount`, `/continental-rewards`,
      `/shop/automobile` — already had metadata; left as-is.

    **Layer 8 — Dynamic sitemaps + robots**:
    - `src/app/sitemap.ts` — enumerates static pages, **every
      category** (live from `/api/categories`), **every product**
      (paginates `/api/products`, safety-capped at 10,000), **every
      published CMS page** (live from new `GET /api/pages` public
      endpoint added today), and country-shop pages. `lastModified`
      uses each row's `updatedAt` so Google knows what's fresh.
    - `src/app/sitemap-images.xml/route.ts` — separate Google
      image-sitemap with `<image:image>` entries for every product
      image, including `<image:title>` and `<image:caption>` with
      enriched copy (name + brand + category + origin + brand).
      Lifts ranking in Google Image Search.
    - `src/app/robots.ts` — references **both** sitemaps,
      disallows transactional surfaces (admin, account, api,
      checkout, cart, login, register, forgot/reset-password).

    **API change (Railway-deployed)**:
    - New public endpoint `GET /api/pages` returns every published
      CMS page (slug, title, metaDescription, publishedAt, updatedAt)
      with `Cache-Control: public, max-age=300, swr=3600`. Lets the
      sitemap enumerate authored content without admin auth.

    **What this earns us**:
    - Every product detail page is discoverable, indexable, and
      shows in SERP with breadcrumb chips, price, rating stars (when
      reviews exist), and availability badge.
    - Every product image has SEO-rich alt text and lives in a
      Google-compatible image sitemap → eligible for Google Image
      Search ranking.
    - Brand searches surface a sitelinks search box in SERP via the
      WebSite + SearchAction JSON-LD.
    - Share previews (WhatsApp, Facebook, Twitter, LinkedIn) render
      properly via Open Graph + Twitter Card meta on every shareable
      page.
    - CMS pages (admin-authored) auto-appear in the sitemap on the
      next request without any manual step.



    Spec from CTO: "every product page, every web page, every slug,
    every content (titles, descriptions, images) must be indexable.
    Searches for products and product images should surface
    Afrizonemart."

    **What we have**:
    - Per-product `<title>` and `<meta description>` via
      `generateMetadata` on product/[slug].
    - Schema.org Product JSON-LD on PDP (price, brand, rating,
      availability, image).
    - Basic `app/sitemap.ts` (static URLs only).
    - `app/robots.ts`.
    - Image alt text = product name on the gallery.

    **What's missing**:
    1. **Dynamic sitemap** — sitemap.ts queries `/api/products` and
       enumerates every product URL with `lastmod`. Same for
       categories and CMS pages.
    2. **Image sitemap** (`/sitemap-images.xml`) — every product image
       gets an entry per Google's image-sitemap spec.
    3. **Open Graph + Twitter Card meta** on every PDP, category,
       and CMS page (so WhatsApp / FB / Twitter share previews look
       right).
    4. **Canonical URL** on every page (avoids duplicate-content
       penalties when search params or country variants land users on
       the same product).
    5. **BreadcrumbList JSON-LD** alongside Product JSON-LD on PDP
       (Google shows breadcrumb chips in SERP when present).
    6. **Enriched image alt text** — extend from product name to
       include category + brand + origin: e.g. "Maya Himalaya Facial
       Scrub — Beauty product from Nigeria — Afrizonemart". Lifts
       Google Image Search ranking.
    7. **Per-category unique copy** — Google penalises template-only
       category pages. Add a CMS-editable hero blurb per category.
    8. **`robots.txt`** updated to reference both the URL sitemap
       and the image sitemap.

    **Updates Principle #1 (API-first)** indirectly — the public
    products endpoint becomes the source of truth for sitemap
    generation, so no separate manifest file to maintain.

23. **[ ] Squad multi-currency contract — charge customers in their local currency (CRITICAL post-launch)** _(queued 2026-04-28)_.

    **Context**: For v1 launch we ship **display-only** currency
    localization — KES/GHS/USD/etc. shown next to every NGN price via
    the FX module (Phase 11), checkout still charges in NGN. That keeps
    the Squad sandbox flow working today but means a Kenyan shopper
    sees "≈ KSh 18,400" then watches their card get debited in naira
    with FX markup from their bank. Acceptable for the first week,
    not a long-term experience.

    **The fix is contractual, not just code**:
    1. Email Squad account manager: request multi-currency settlement
       enabled on the merchant account. Squad supports NGN + USD + GBP
       natively; KES/GHS/ZAR via partner banks.
    2. Once approved, Squad will issue a new set of API keys per
       currency (or one key with currency override permission — TBD
       on their side).
    3. Update `PaymentGatewayConfig` rows: one row per currency, each
       with its own `credentials.secretKey` + `currencies: ['KES']`
       etc. The registry already supports this — `activeGateway()`
       resolves by currency, so adding a KES gateway is just a new
       admin row. **No code change needed in `payments/registry.ts`.**
    4. Frontend `<DisplayPrice>` flips from "display-only" to "real":
       the cart sends the user's selected currency, checkout creates
       the Squad init in that currency, the customer's card is debited
       in their actual local currency. We settle to our NGN account
       via Squad's settlement engine (their FX, not the customer's
       bank's).

    **Why soonest, not now**: launching today on display-only is fine
    because the registry was built for this exact swap. The contract
    change is the gating item, not the code. Ship the contract email
    Monday after launch, expect 5-10 business days for Squad approval,
    then a one-day implementation push.

    **Affects Principle #2 (provider-pluggable)**: validates that the
    architecture choice was right — the rebuild from "Paystack
    hardcoded" to "registry of providers per currency" pays off the
    moment we want to charge in a second currency.

22. **[ ] Operator follow-ups — wire Sentry + PostHog (~10 min total)** _(queued 2026-04-28)_.

    Both libraries are **already installed and scaffolded** in the
    frontend (see Phase Audit.6 + Audit.7). They activate the moment the
    relevant env var is set on Vercel — zero code work required from us.

    **Why this matters**:
    - Without **Sentry**, the next "Application error: a server-side
      exception" will surface to users with a digest hash and we'll
      have nothing to debug it with. The most recent prod incident
      (the post-import product-detail crash) took 15 min to track down
      with curl + grep — would have been 30 seconds with Sentry.
    - Without **PostHog**, we're flying blind on conversion. We can't
      tell which product cards get clicked, which CTAs convert, where
      the checkout funnel leaks, or whether a feature flag rollout
      moved the metric. Every other measurement-driven decision waits
      on this.

    **Sentry setup (5 min)**:
    1. Create project at https://sentry.io → platform Next.js → name
       `afrizonemart-frontend`.
    2. Copy DSN.
    3. Vercel → project → Settings → Environment Variables → set
       `NEXT_PUBLIC_SENTRY_DSN=<DSN>` for production + preview + dev.
    4. Optional: also set `SENTRY_DSN` on the same project for
       server-component / route-handler errors (same DSN value).
    5. Redeploy. `sentry.client.config.ts` and `sentry.server.config.ts`
       auto-init when the env var is present.

    **PostHog setup (5 min)**:
    1. Create org at https://posthog.com (EU or US cloud — pick one).
    2. Settings → Project API Keys → copy the **Project API Key**
       (starts with `phc_`).
    3. Vercel env vars (all three environments):
       - `NEXT_PUBLIC_POSTHOG_KEY=phc_…`
       - `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`
         (or `https://us.i.posthog.com`)
    4. Redeploy. `<AnalyticsProvider>` (already mounted in
       `app/layout.tsx`) auto-tracks `$pageview` on every SPA nav.

    **Custom events to wire next** (small follow-up tickets after
    PostHog is live — 30 min each):
    - `sign_up { method: 'email' | 'google' | 'phone' }` in auth flows
    - `add_to_cart { productId, value }` in `cartStore.addItem`
    - `begin_checkout { value }` on /checkout step 1
    - `purchase { orderId, value, currency }` on /checkout/success
    - `identifyUser(userId, { email, role })` immediately after sign-in

    **Updates Principle #10 (Observability) → `[x]`** the moment Sentry
    is wired (currently `[~]` because frontend has no Sentry).

21. **[~] Phase 10 — Self-service platform** _(queued 2026-04-27)_.

    **The thesis**: every dev task should become a registry + UI. We
    have the bones (event bus, modules, schema-driven products); now we
    build the admin tooling that lets non-devs author features.

    **Six sub-workstreams**, independently shippable, ordered by
    biggest "stop pinging the dev" return:

    - **10.1 Custom Field Registry** _(landed 2026-04-27)_.
      Schema: `CustomFieldDef` + `CustomFieldScope` + `CustomFieldType`
      enums (10 types: TEXT, LONGTEXT, NUMBER, BOOLEAN, URL, VIDEO,
      IMAGE, SELECT, JSON, RICHTEXT). Module
      `src/modules/custom-fields/{schema,service,controller,routes,
      admin.routes}.ts`. Admin CRUD at `/api/admin/custom-fields`,
      public read at `/api/custom-fields/:scope`. Service-side caching
      (30s TTL). `validateAndNormalizeAttributes` runs on every product
      create/update and merges validated custom-field values onto the
      existing `attributes` JSON without disturbing legacy keys
      (bundles/features/specs/about). Frontend admin at
      `/admin/custom-fields` with create/edit/delete + scope tabs
      (PRODUCT/ORDER/USER). `<DynamicFieldInput>` renders the right
      input control per type in `ProductForm`. `<DynamicFieldDisplay>`
      + `<DynamicFieldList>` on storefront product page renders the
      right output (YouTube/Vimeo iframe for VIDEO, `<img>` for IMAGE,
      `<a>` for URL, etc.). Sidebar entry "Custom Fields" added.

      _Validates the platform pattern_: registry table + provider/type
      handler + admin UI + dynamic renderer. The same shape ships
      10.3 (email blocks) and 10.6 (page builder).

    - **10.2 Pluggable payment gateway registry** _(landed 2026-04-27)_.
      Schema: `PaymentGatewayConfig` (provider, label, environment,
      isActive, priority, currencies, credentials Json, metadata Json).
      Code-side **provider registry** in `payments/registry.ts`:
      `PROVIDER_FACTORIES` maps `'squad' | 'stub' | …` to a
      `ProviderDefinition` describing display name, currencies,
      credential field schema, and a `build()` factory. The admin form
      auto-renders credential inputs from `def.credentialFields` —
      adding a new provider type is one new file + one registry entry.
      Refactored existing `GtSquadGateway` and `StubGateway` to take
      config from constructor instead of env. `payments/service.ts`
      now resolves the active gateway via DB rows (priority + currency)
      with env-based Squad as a legacy fallback. `activeGateways()`
      returns the full active list; webhook handler walks them so
      multiple providers can share one webhook URL. Public read at
      `GET /api/payments/gateways?currency=NGN`. Admin CRUD at
      `/api/admin/payment-gateways/*` with credential redaction
      (passwords show as `••••<last4>`). Admin UI at
      `/admin/payment-gateways` with a provider dropdown that
      auto-renders the right credential fields.

      _Validates the platform pattern_: registry table + provider
      registry + admin UI. Adding Paystack, Flutterwave, Stripe, M-Pesa
      is now one ~150-line file in `payments/<provider>-gateway.ts` +
      one entry in `PROVIDER_FACTORIES`.

    - **10.3 Email template editor** _(landed 2026-04-27)_.
      Schema: `EmailTemplate` keyed by event type (`order.confirmed`,
      `user.welcome`, …) with subject + JSON block tree.
      `templates/render-blocks.tsx` walks the tree and renders each
      block (heading, sub-heading, paragraph, button, image, info-card,
      item-list, divider, spacer) using the existing `EmailLayout`
      primitives. `BLOCK_PALETTE` drives the admin block menu so
      adding a new block type is one switch case + one palette entry.
      `interpolate()` substitutes `{variable}` tokens at render time
      (supports `{a.b.c}` dotted paths). `template-resolver.ts`
      resolves DB → element with the existing TSX as fallback;
      `sendEmail` checks the resolver first when caller passes
      `variables`. Admin at `/admin/email-templates` lists templates
      and lets you initialise any of 8 known events.
      `/admin/email-templates/[id]` is the editor: 2-pane layout
      (block editor left, live iframe preview right), block palette,
      reorder/remove buttons, "send test" button that ships a real
      email via Resend with sample variables. System templates can be
      toggled inactive (falls back to TSX) but not deleted.

    - **10.4 Feature flags** _(landed 2026-04-27)_.
      Schema: `FeatureFlag` (key, name, description, defaultValue,
      targetingRules Json, isActive). Module
      `src/modules/feature-flags/{service,routes,admin.routes}.ts`.
      Engine evaluates rules in order — first match wins; supports
      `userId`, `userRole`, `country`, `rolloutPercent` matchers.
      `rolloutPercent` uses SHA-256 sticky bucketing on (flagKey,
      userId) so the same user always lands in the same bucket.
      Public batch read at `GET /api/flags?keys=a,b,c` with
      `optionalAuth` so anon users still get defaults. Frontend
      `useFlag('key')` hook batches multiple calls and caches per
      session. Admin at `/admin/feature-flags` with create/edit
      dialog: "Always on for ADMIN" toggle + rollout slider +
      master kill switch (isActive). 10s in-process cache invalidated
      on any mutation. **Updates Principle #2 → `[x]`.**

    - **10.5 Generic Rules Engine** _(landed 2026-04-27)_.
      Schema: `BusinessRule` (scope, key, name, isActive, priority,
      conditions Json, actions Json). Tiny matcher DSL with $eq, $ne,
      $gt, $gte, $lt, $lte, $in, $any, $all and dotted-path field
      access (`cart.subtotal`, `user.tier`). `evaluate(scope, ctx)`
      returns matching rules in priority order;
      `evaluateActions(scope, ctx)` returns the merged actions map.
      Admin at `/admin/business-rules` with scope tabs (cart, order,
      fulfilment, discount, fraud, loyalty), JSON editors for
      conditions + actions, sample-payload starters per scope, and a
      `/evaluate` endpoint to test rules against a context. 15s
      in-process cache invalidated on every mutation.
      Migration of hardcoded `ALLOWED_TRANSITIONS` and free-shipping
      logic is post-launch — engine + admin are live now.
      **Updates Principle #3 → `[x]`.**

    - **10.6 CMS / Page Builder** _(landed 2026-04-27)_.
      Schema: `CmsPage` (slug unique, title, metaDescription, blocks
      Json, isPublished, publishedAt). Public read at
      `GET /api/pages/:slug` (only published rows); admin CRUD at
      `/api/admin/pages`. Frontend catch-all route at `/p/[...slug]`
      fetches and renders. Block renderer in
      `components/cms/PageBlocks.tsx` supports hero, rich-text,
      banner, image, image-grid, cta, divider, spacer — same
      pattern as the email block library, adding a new block type
      is one switch case + one palette entry. Admin at `/admin/pages`
      with create-and-edit modal; `/admin/pages/[id]` is the
      2-pane editor (block editor left, **live preview right** that
      renders the actual block components, not an iframe — instant
      WYSIWYG).

    **Order rationale**: 10.1 first because it's the smallest scope and
    directly answers Magnus's YouTube-embed example; the registry +
    dynamic-renderer pattern then generalises to the email editor (10.3)
    and CMS (10.6).

20. **[x] Phase 9 — Production deploy readiness** _(landed 2026-04-26)_.

    **Shipped**:
    - **R2 storage adapter** — replaced the placeholder. `R2Storage`
      uses `@aws-sdk/client-s3` against
      `https://<account-id>.r2.cloudflarestorage.com`, sets a 1-year
      immutable `Cache-Control` on every put, and returns
      `<R2_PUBLIC_URL_BASE>/<key>` as the URL. Service-layer factory
      throws on missing R2_* vars when `UPLOADS_BACKEND=r2`. New env
      vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
      `R2_BUCKET`, `R2_PUBLIC_URL_BASE`.
    - **Railway deploy config** (`railway.toml`) — fixed: now uses
      `npm ci` for reproducible installs and runs `npx prisma migrate
      deploy && node dist/server.js` (the previous start command
      called `npm run prisma:migrate deploy`, which would have run
      `prisma migrate dev` and failed in CI).
    - **Frontend image hosts** — `next.config.mjs` `remotePatterns`
      extended for `images.afrizonemart.com`, `*.r2.dev` (testing
      fallback), and `api.afrizonemart.com/uploads/**` (legacy seed
      assets).
    - **Deploy runbook** — `DEPLOY.md` at frontend root: step-by-step
      for Cloudflare R2 bucket + custom domain, Railway project +
      Postgres + env vars, Vercel project + DNS, Squad webhook flip,
      Resend domain check, post-deploy smoke tests, rollback steps.

    **Magnus's part** (everything else is code-side done):
    - Provision Cloudflare R2 bucket + API token + custom domain.
    - Create Railway project, paste env vars, deploy.
    - Create Vercel project, set `NEXT_PUBLIC_API_URL`, point DNS.
    - Flip Squad webhook URL from `test.com/webhook` to prod.
    - Run post-deploy smoke tests (1–7 in `DEPLOY.md` §7).

    **Updates Principle #8 → `[x]`** (vercel/railway configs +
    runbook documented).

19. **[x] Phase 8 — Notifications + transactional emails** _(landed 2026-04-26)_.

    **Shipped**:
    - `Notification` + `PasswordResetToken` models migrated.
    - `EmailProvider` interface; `ConsoleEmailProvider` (local dev,
      logs to stdout) and `ResendEmailProvider` (selected when
      `RESEND_API_KEY` is set).
    - Shared React Email layout (`templates/_layout.tsx`) with navy
      header, amber stripe, Raleway primitives (Heading, SubHeading,
      Paragraph, Button, InfoCard, Row).
    - 8 templates: OrderConfirmed, PaymentReceived, OrderShipped,
      OrderDelivered, OrderCancelled, RefundIssued, Welcome,
      PasswordReset.
    - `notifications/dispatcher.ts` subscribes to `order.placed`,
      `order.paid`, `order.shipped`, `order.delivered`,
      `order.cancelled`, `order.refunded`, `user.registered`,
      `password.reset_requested` — every send logs a Notification
      row (SENT or FAILED, never throws back to caller).
    - `adminUpdateStatus` now emits `order.shipped` and
      `order.delivered` events on those transitions.
    - Forgot-password flow wired end-to-end:
      `POST /api/auth/forgot-password` (always 204, anti-enum) →
      hashed token in `PasswordResetToken` → email →
      `POST /api/auth/reset-password` (validates, rotates
      passwordHash, revokes refresh tokens + sibling tokens). New
      `/reset-password?token=...` page on frontend.
    - Admin `/admin/notifications` page: filter by status / type /
      recipient, resend button (creates a fresh Notification row).
    - Sidebar entry "Notifications" added.
    - Settings registry got a new `notifications` group:
      `from_name`, `from_email`, `reply_to`, `send_welcome`.

    **Deferred**: SMS / push channels (schema is ready), per-user
    notification preferences, true bounce/complaint webhooks from
    Resend, template marketplace UI for editing email copy from admin.

    **Old Phase 8 spec for reference:**


    Customers currently get zero emails after paying — fixing that.
    Also unblocks the long-deferred forgot-password flow.

    **Stack**:
    - **Resend** as the email provider (free tier, deliverability,
      Africa-friendly, React Email native). `RESEND_API_KEY` env;
      falls back to a `ConsoleEmailProvider` that just logs to
      terminal when no key is configured (so local dev doesn't
      need keys).
    - **React Email** (`@react-email/components` +
      `@react-email/render`) for templates — JSX → email-safe HTML
      with inline styles + table layouts. One shared brand layout
      (navy header / amber CTAs / Raleway-styled headings /
      footer with social + unsubscribe).

    **Schema**:
    - `Notification` (id, userId?, channel ['email'|'sms'|'push'],
      type, recipient, subject, status [PENDING/SENT/FAILED],
      providerMessageId, error, createdAt, sentAt) — log every
      send for audit + admin replay.
    - `PasswordResetToken` (id, userId, tokenHash, expiresAt,
      usedAt) — for forgot-password.

    **Email templates (8 to start)**:
    1. **Order confirmed** — receipt with line items, totals,
       shipping address, "Track order" CTA.
    2. **Payment received** — payment confirmation with reference.
    3. **Order shipped** — tracking number if any, ETA, carrier.
    4. **Order delivered** — review request CTA.
    5. **Order cancelled** — reason, refund timeline if any.
    6. **Refund issued** — amount, reason, settlement window.
    7. **Welcome** — fired on `user.registered`, intro to the
       platform.
    8. **Password reset** — one-time link with 30-min expiry.

    Adding new email types = one TSX file + one event subscriber.

    **Event subscribers** (eventBus → email):
    - `order.placed` → Order confirmed
    - `order.paid` → Payment received
    - `order.shipped` → Order shipped (when status flips to SHIPPED)
    - `order.cancelled` → Order cancelled
    - `order.refunded` → Refund issued
    - `user.registered` → Welcome

    **Forgot-password flow**:
    - `POST /api/auth/password-reset/request { email }` — always
      returns 200 (don't leak account existence); creates token if
      email exists; queues Password reset email.
    - `POST /api/auth/password-reset/confirm { token, password }`
      — verifies token (not expired, not used), updates passwordHash,
      marks token used.
    - Frontend: existing `/forgot-password` page wires to the
      request endpoint; new `/reset-password?token=…` page handles
      the confirm step.

    **Admin Notification log**: `/admin/notifications` — paginated
    list of every send (recipient, type, status, error, sent-at)
    with a "Resend" button per row. Filters by type + status.

    Deferred: SMS / WhatsApp / push channels (need Twilio /
    Africa's Talking integration), email click + open tracking,
    customer-managed unsubscribe preferences, scheduled sends
    (e.g. abandoned cart 24h after).

18. **[x] Phase 7.1 — Squad gateway adapter** _(2026-04-26)_ — done.
    Built against the live docs at https://docs.squadco.com.
    - **Env**: `SQUAD_SECRET_KEY` + `SQUAD_ENVIRONMENT`
      (`sandbox` | `live`), both optional. When both set,
      `activeGateway()` returns the real `GtSquadGateway`;
      otherwise stays on the stub for local dev. Boot logs
      `payments.gateway_selected` so you can confirm which one is
      live. New `API_PUBLIC_URL` env defaults to
      `http://localhost:4000`.
    - **Raw body capture**: `express.json({ verify })` stashes the
      unmodified bytes on `req.rawBody`. Webhook controller passes
      them straight to `parseWebhook` — re-stringifying would
      break the signature.
    - **GtSquadGateway**:
      - `init` → POST `/transaction/initiate` with **amount × 100**
        (Squad uses kobo / cents), customer email + name,
        callback_url, currency (NGN/USD), payment_channels =
        ['card','bank','ussd','transfer'], merchant-supplied
        `transaction_ref` = `${orderNumber}-{rand}` so it's
        readable in Squad's dashboard. Returns
        `{ gatewayRef: transaction_ref, checkoutUrl: data.checkout_url }`.
      - `parseWebhook` → recomputes
        `HMAC-SHA512(secret, rawBody).toUpperCase()` and compares
        to `x-squad-encrypted-body`. Maps Squad's
        `transaction_status` ('Success' / 'Failed' / 'Abandoned' /
        'Pending') to our outcome (SUCCEEDED / FAILED / IGNORED-
        non-terminal).
      - `verify` → GET `/transaction/verify/{ref}` for the polling
        fallback the success page uses while the webhook is in
        flight.
    - Sandbox / live URLs hardcoded:
      `https://sandbox-api-d.squadco.com` and
      `https://api-d.squadco.com` per the docs.
    - **To activate Squad**: set `SQUAD_SECRET_KEY=sandbox_sk_…`
      + `SQUAD_ENVIRONMENT=sandbox` in `.env` and restart the API.
      No code changes — same `PaymentGateway` contract; the
      checkout / success / admin paths all keep working.

17. **[~] Phase 7 — Payments (stub gateway live, GT Squad adapter pending keys)** _(2026-04-26)_.
    Closes the "orders stuck PENDING_PAYMENT forever" gap end-to-end
    via a swappable gateway abstraction. Local dev uses a stub
    gateway that mimics the redirect-and-callback dance; swapping in
    GT Squad once Magnus shares API docs + keys is a single-file
    change.

    - **Schema**: new `Payment` model (orderId, gateway, gatewayRef
      unique, amount, currency, status enum [INITIATED / SUCCEEDED
      / FAILED / REVERSED], checkoutUrl, rawPayload Json, settledAt,
      timestamps). `PaymentMethod` enum gains `GTSQUAD`. Order has
      back-relation `payments[]`. Migration `payments`.
    - **API**: `modules/payments/*` with abstract `PaymentGateway`
      interface (init / parseWebhook / verify), `StubGateway`
      implementation (redirects to a built-in HTML page that
      auto-completes after 1.5s with a signed webhook), placeholder
      `GtSquadGateway` (throws "not implemented yet"). Endpoints:
      `POST /api/payments/init`, `POST /api/payments/webhook`
      (public, signature-auth'd), `GET /api/payments/verify/:ref`
      (auth + polling fallback), `GET /api/payments/stub-checkout/:ref`
      (dev-only HTML page). Webhook outcomes idempotently flip
      `Order.status=PAID`, log an OrderEvent, emit `order.paid`,
      and write an audit row. **Bonus**: added a 5-attempt connect
      retry to `connectDatabase` so server boot survives Railway
      proxy hiccups.
    - **Frontend**: `lib/api/payments.ts` (init + verify). Checkout
      payment page detects gateway-needing methods (card / mobile
      money / USSD / crypto) and redirects to the gateway's
      `checkoutUrl` after placing the order; bank transfer + COD
      skip the redirect. Success page polls `getOrder` every 2s
      for up to 30s, showing a "Verifying payment…" amber banner
      while pending and a red banner if it fails.
    - **Verified end-to-end**: PENDING_PAYMENT order →
      `/api/payments/init` returned `stub_…` ref + checkoutUrl →
      simulated webhook → order flipped to PAID, payment row
      stored, `order.paid` event emitted, audit row written.
    - **Status flag `[~]`** because the GT Squad adapter is a
      placeholder — the contract is in place, the swap is one
      class. Phase 7.1 will land it once Magnus provides:
      (1) API docs for init + verify, (2) test + live keys,
      (3) webhook signature scheme.

16. **[x] Admin Phase 5.1 — Webhook hardening** _(2026-04-26)_ — done.
    Closes the most painful current gap: orders are placed but
    stuck PENDING_PAYMENT forever. After this push, customers can
    actually pay and the platform takes real money.

    **Schema**: `Order.paymentMethod` enum widened (PAYSTACK
    misnamed → keep + add `GTSQUAD`); `Payment` model
    (id, orderId, gateway, gatewayRef, amount, currency, status
    [INITIATED / SUCCEEDED / FAILED / REVERSED], rawPayload Json,
    createdAt, settledAt). Migration `payments`.

    **API**: new `modules/payments/*` —
    - `POST /api/payments/init { orderId }` — auth, validates order
      ownership + status=PENDING_PAYMENT, calls GT Squad's init
      endpoint with `Order.total` + `Order.currency`, persists a
      `Payment` row in INITIATED, returns `{ checkoutUrl, reference }`.
    - `POST /api/payments/webhook` — public, verifies GT Squad
      signature header, idempotently moves matching `Payment` →
      SUCCEEDED/FAILED + flips `Order.status` to PAID, emits
      `order.paid` (which webhooks already pick up).
    - `GET /api/payments/verify/:reference` — auth fallback for
      polling when the webhook is delayed.

    **Frontend**: checkout payment page handles GTSQUAD selection
    by initing a payment + redirecting to `checkoutUrl`; on return
    success page polls `verify` until status flips. Admin order
    detail surfaces the linked Payment row.

    **Settings**: add `payments.gtsquad.public_key`,
    `payments.gtsquad.secret_key`, `payments.gtsquad.webhook_secret`,
    `payments.gtsquad.environment` (test|live) to the registry — so
    keys are admin-editable, not just env-only.

    **Stub mode**: until Magnus shares GT Squad keys / API docs,
    ship a "stub" gateway that mimics the redirect-and-callback
    dance so the whole flow works locally. When real keys land,
    swap the stub for the real adapter — same `PaymentGateway`
    interface, identical contract.

16. **[x] Admin Phase 5.1 — Webhook hardening** _(2026-04-26)_ — done.
    - **Retries**: failed deliveries (statusCode≥400 or transport
      error) get queued for up to 3 retries with exponential backoff
      (1m → 5m → 30m). A `retry-pending` `WebhookDelivery` row
      tracks `nextAttemptAt` + `attempts`. A small in-process
      worker scans on a 30s interval.
    - **Replay button**: admin can re-fire any past delivery from
      `/admin/webhooks/[id]` (creates a new delivery row with
      `attempts=1` keeping the original payload).
    - **Secret handling**: rotate-secret button on edit dialog.
      Reveal-once UX preserved (current behaviour already only
      shows the prefix in the list view + eye-toggle in detail).
      Hashing-at-rest is logged as a separate followup.

15. **[x] Admin Phase 6 — Reports** _(2026-04-26)_ — done.
    - **API**: 4 endpoints in `modules/reports/admin.*` —
      `/sales` (day/week/month buckets, cancelled excluded, returns
      gross + refunded + net), `/top-products` (revenue-sorted from
      OrderItem), `/top-customers` (Prisma `groupBy` on Order),
      `/low-stock` (products with inStock=false; per-SKU quantities
      land with the future Inventory module).
    - **Frontend**: `/admin/reports` with 7d/30d/90d/YTD preset
      group + day/week/month granularity dropdown, 4 KPI cards
      (Net revenue with gross/refunded breakdown, Orders, Buying
      customers, Out of stock with red glyph), Sales-over-time
      table with proportional CSS bars, Top products + Top
      customers two-column ranked lists, Low-stock 2-column grid.
      Sidebar Reports pill flipped Soon → live.
    - **Verified end-to-end**: with the 3 test orders + 1 partial
      refund accumulated during this session, sales report returns
      ₦15125 gross / ₦500 refunded / ₦14625 net, top-products
      ranks Tastic Rice 5kg / Malta / Big Bites, top-customers
      shows Magnus's two accounts, low-stock returns the 3 OOS
      items.
    - Deferred: tax/VAT report (no tax handling yet), cohort
      retention, view → purchase funnel, scheduled email reports,
      Recharts upgrade for proper line charts.

14. **[x] Admin Phase 5 — Settings + Audit + Webhooks (MVP)** _(2026-04-26)_ — done.
    _(queued 2026-04-26)_. Three closely-related ops surfaces in
    one push at MVP scope.

    **Schema**:
    - `Setting` (key unique, value Json, updatedByUserId, timestamps).
    - `AuditLog` (actorUserId, actorEmail snapshot, entityType,
      entityId, action, changes Json, createdAt).
    - `Webhook` (name, url, events[], secret, isActive, timestamps).
    - `WebhookDelivery` (webhookId, eventType, payload, statusCode,
      responseBody, attempts, succeededAt, failedAt, createdAt).

    **Settings**:
    - Key/value with a typed `SETTINGS_REGISTRY` (key → type +
      label + group) so the UI renders the right input per setting
      and we never lose track of what's stored.
    - Initial keys: store name, store address, store contact email,
      currency default, low-stock threshold, free-shipping
      threshold (replaces the constant), order-prefix, etc.
    - `GET /api/admin/settings` returns all + registry.
    - `PUT /api/admin/settings` upserts one or many.

    **Audit log**:
    - `logAudit(actor, action, entity, changes)` helper. Wire into
      orders status-change + refunds + staff create/update + coupon
      create/update for v1 — retrofit the rest as we touch each
      surface.
    - `GET /api/admin/audit-log` with filters (actor, entity,
      action, date range).

    **Webhooks**:
    - Admin CRUD for webhook subscriptions.
    - `WebhookDispatcher` subscribes to the in-process `eventBus`
      and POSTs the payload to every matching webhook URL with an
      `X-Afrizonemart-Signature` HMAC-SHA256 header (using the
      stored secret). Per-delivery row in `WebhookDelivery`. v1
      fires once and records the result; retries land later.
    - `GET /api/admin/webhooks/:id/deliveries` for the log view.

    **Frontend**: `/admin/settings` tabbed page, `/admin/audit`
    paginated list with filters, `/admin/webhooks` list + form +
    per-webhook delivery log. Sidebar Settings pill flipped Soon →
    live; new Audit Log pill.

    Deferred: webhook delivery retries with exponential backoff,
    settings versioning / rollback, audit-log export, signed-URL
    download of deliveries.

13. **[x] Admin Phase 4.1 — Storefront wiring for Discounts + Shipping**
    _(2026-04-26)_ — done. Phase 4 admin tools now actually power
    the storefront.
    - **Schema**: `Cart.couponId` (nullable FK with onDelete=SetNull)
      added so an applied coupon survives cart edits. Migration
      `cart_coupon`.
    - **API**: new `coupons/evaluator.ts` (shared between cart apply
      and place-order; validates code/active/window/min subtotal/
      max uses/per-customer cap and computes the discount; pure
      `computeDiscount` helper for re-shaping). `cart/service.ts`
      gains `applyCouponToCart` + `removeCouponFromCart`; cart view
      now returns `couponCode + couponDiscount + couponFreeShipping`
      (re-computed against current subtotal on every read so
      changing items rebases the discount). `POST/DELETE
      /api/cart/coupon` mounted. New `shipping` module with
      `GET /api/shipping/rates?country=XX` + `computeShippingCost`
      helper (zone match → default-zone fallback → empty rates).
      `placeOrder` extended: takes `shippingRateId` (else default
      rate for matched zone), re-evaluates the coupon at order time
      (auto-clears if it now fails), applies free-shipping override,
      atomically creates `CouponRedemption` + increments
      `Coupon.usageCount`, snapshots `couponCode` + `couponDiscount`
      + `shippingRateId` on the order. Transaction timeout bumped to
      30s to play nicely with the Prisma transient-retry extension.
    - **Frontend**: `lib/api/cart.ts` adds `applyCartCoupon` /
      `removeCartCoupon`. New `lib/api/shipping.ts`
      (`fetchShippingRates`, `effectiveShippingPrice` helper).
      `CartCouponForm` rewritten to call the API directly with
      Apply/Remove + inline error display. `OrderSummary` rewritten
      to render the real coupon discount + free-shipping pill +
      "calculated at checkout" placeholder. Cart page subscribes to
      the server cart so adding/removing items re-validates the
      coupon. `ShippingRatePicker` (new) auto-selects the default
      rate for the ship-to country, shows free-above hints, marks a
      threshold-unlocked rate green. Checkout shipping page swaps
      the static `DeliveryMethodSelector` for it. `checkoutStore`
      gains `shippingRateId`. Payment page fetches the server cart
      to incorporate coupon discount + the picked rate's effective
      price into the displayed Total, then forwards
      `shippingRateId` to `placeOrder`. Admin order detail shows the
      coupon line in red between Subtotal and Shipping when
      `couponDiscount > 0`.
    - **Verified end-to-end**: zone (Nigeria, default catch-all) +
      rate (Standard ₦1500 free-above-₦10k) + coupon `LAUNCH10`
      (10%) created via admin API. Cart of ₦2750 → apply LAUNCH10
      → server returns `couponDiscount=275`. Place-order with
      `shippingRateId` → order `AZM-MOGBFOYN-C096DB` with
      subtotal=2750, ship=1500, coupon=LAUNCH10, discount=275,
      total=3975. `LAUNCH10.usageCount` correctly incremented to 1.
      All 4 storefront + admin pages compile + render 200.
    - Bug fixed during the push: original 5s transaction timeout
      collided with the Prisma retry-on-blip extension when retrying
      ops inside the txn, killing the transaction mid-flight.
      Bumped to 30s with a 5s maxWait — testable on Railway's
      flaky proxy.

12. **[x] Admin Phase 4 — Discounts + Shipping (admin half)**
    _(2026-04-26)_ — done. Storefront wiring (cart coupon input +
    checkout rate picker + place-order integration) is broken out
    as **Phase 4.1** below.

    - **Schema**: `Coupon` (PERCENT_CART / FIXED_CART /
      FREE_SHIPPING with conditional value validation in Zod
      `superRefine`; uppercase code; min subtotal; max uses; per-
      customer cap; active window; denormalized `usageCount`).
      `CouponRedemption` (couponId, userId, orderId, amountDiscounted)
      for per-customer cap enforcement + audit. `ShippingZone`
      (name, ISO-2 countries[], isDefault catch-all). `ShippingRate`
      (zoneId, name, priceAmount, freeAboveAmount threshold,
      isDefault). `Order` gains `couponCode`, `couponDiscount`,
      `shippingRateId` (nullable for legacy orders). Migration
      `discounts_shipping`.
    - **API**: `modules/coupons/admin.*` — CRUD with conditional
      value validation, type-aware value clamping (changing type
      wipes the old value field), refusal to delete coupons that
      have redemptions on file. `modules/shipping/admin.*` — zones
      CRUD with single-default enforcement (`updateMany` clears
      other defaults atomically), rates CRUD nested under zone with
      same single-default-rate guarantee per zone, refusal to
      un-default a zone with no countries.
    - **Frontend**: `/admin/coupons` list + create / edit modal
      with type-conditional fields (percent vs fixed vs free
      shipping), windowed activation (datetime-local pickers),
      per-customer + total caps, delete with redemption guard.
      `/admin/shipping` two-column layout: zones list on the left
      with default badge + countries, selected zone's rates on the
      right with default badge + free-above hint. Inline create /
      edit for both via shared `Modal` + `DialogFooter` helpers.
      Sidebar Discounts pill flipped Soon → live; new Shipping
      item added with truck icon.
    - **Verified end-to-end**: PERCENT_CART coupon `LAUNCH10` (10%
      off, min ₦1000, max 100 uses) created with code uppercased;
      FREE_SHIPPING coupon `SHIPFREE` created; PERCENT_CART
      without valuePercent rejected with explicit Zod error
      pointing at `valuePercent`; Nigeria zone (`NG`) + Rest-of-
      World catch-all (default, isDefault=true) created with
      single-default invariant honoured; two rates added under
      Nigeria (Express ₦3000, Standard ₦1500 free-above ₦10k
      default); list returns zones with rates eagerly included.
    - **Deferred to Phase 4.1**: cart coupon `POST /api/cart/coupon`
      validation + apply, `DELETE /api/cart/coupon` remove,
      `GET /api/shipping/rates?country=NG` for storefront,
      `placeOrder` integration (snapshots discount + uses chosen
      rate + atomically increments `usageCount` + creates
      `CouponRedemption`), cart-page coupon UI, checkout shipping
      rate picker, discount line in admin order detail.
    - **Deferred from Phase 4 entirely**: WEIGHT_BASED rate type,
      product/category-scoped coupons, BOGO + tiered discounts,
      coupon stacking rules, address-validation against shipping
      countries.

11. **[x] Admin Phase 3.1 — Staff & Permissions** _(2026-04-26)_ — done.
    - **Permissions model**: shared `lib/permissions.ts` (mirrored
      between API + frontend until we extract a workspace package)
      defines 13 capabilities across 6 domains (Orders / Catalog /
      People / Media / Settings / Reports). `ROLE_CAPABILITIES`
      bundle: CUSTOMER 0, SELLER 4 (orders.read, products.read,
      products.write, uploads.write), ADMIN all 13. Per-user
      overrides deferred.
    - **API**: new `modules/customers/admin.staff.*` (sibling files
      to keep customers vs staff concepts separate inside the same
      module). `GET /api/admin/staff` (lists role IN SELLER+ADMIN).
      `POST /api/admin/staff` (creates user directly with bcrypt-
      hashed password; refuses CUSTOMER role; refuses if email
      exists with 409 + suggestion to promote via customer detail).
      `GET /api/admin/staff/permissions` returns the full matrix as
      JSON so the UI is rendered from a single source of truth.
    - **Frontend**: new `/admin/staff` page with two main panels —
      a Staff Members list (avatar / name / email / role / added
      date / Manage link to customer detail) and a Roles &
      Permissions matrix (3 role summary cards + a domain-grouped
      matrix table with check / minus glyphs per role × capability).
      `AddStaffDialog` modal handles email + name + role (SELLER /
      ADMIN) + initial password with show/hide toggle. Sidebar
      gains a "Staff & Roles" item with a shield icon.
    - **Verified end-to-end**: staff list returned 1 (Magnus),
      matrix returned 13 caps × 3 roles (0/4/13), creating
      ops@afrizonemart.com worked, duplicate-email returned 409
      with a helpful "promote via customer detail" message,
      CUSTOMER role rejected at the Zod layer with the explicit
      enum error.
    - Deferred: invite via email link (waits on notifications/email
    module), per-user capability overrides, capability-by-region
    (e.g. "country manager for NG only").

10. **[x] Admin Phase 3 — Customers** _(2026-04-26)_ — done.
    - **API**: new `modules/customers/admin.*` (kept separate from
      `auth/` since auth is concerned with credentials/sessions and
      customers is concerned with people). `GET /api/admin/customers`
      (q + role + sort=newest|oldest|name-asc|spend-desc, paginated;
      one Prisma `groupBy` aggregates `orderCount` + `totalSpent` +
      `lastOrderAt` for the whole page slice in a single query —
      cancelled orders excluded, refundedTotal subtracted). `GET /:id`
      returns same shape plus 10 most recent orders. `PATCH /:id`
      updates name + role with a **last-admin guard** that refuses
      self-demotion if you're the only ADMIN.
    - **Frontend**: `/admin/customers` paginated list (avatar circle,
      name + email, role badge, joined date, order count, lifetime
      value, last-order date) with q search, role filter, and sort
      dropdown (Newest / Name A–Z / Top spenders).
      `/admin/customers/[id]` profile + lifetime stats trio (orders /
      LTV / last order) + 10 recent orders linking to admin order
      detail + editable Profile (name + role) with save-disabled
      until dirty + read-only Account block (email + joined + ID).
      Sidebar Customers pill flipped Soon → live.
    - **Verified end-to-end**: list returns 3 users with computed
      stats (Magnus 1 order ₦2950, the customer-checkout user 1
      order ₦7700 net of the test refund); detail returns 1 recent
      order; self-demote-last-admin correctly rejected with the
      explicit message; name update worked + restored.
    - Deferred: address book editing (waits on Address model from
      Phase 4), customer-private notes (will reuse OrderEvent
      pattern at the user level — likely lands with Phase 5
      audit/notes), forced password reset / impersonation tools.

9. **[x] Admin Phase 2 — Orders ops** _(2026-04-26)_ — done.
   - **Schema**: new `OrderEvent` model (id, orderId, type enum
     [STATUS_CHANGED / NOTE / PAYMENT_RECEIVED / SHIPMENT_UPDATED /
     REFUND_RECORDED / CANCELLED], payload Json, actorUserId,
     isCustomerVisible, createdAt) and `Refund` model (id, orderId,
     amount, reason, status enum [RECORDED / SETTLED / FAILED],
     gatewayRef, createdByUserId, timestamps). `Order` gains
     `cancelledAt` + `refundedTotal` (computed mirror, kept in sync
     by the service layer). Migration `20260426210355_order_ops`.
   - **API**: admin orders endpoints inside `modules/orders/admin.*`.
     `GET /api/admin/orders` (status / `q` / date-range filters,
     paginated, includes user + items count). `GET /:id` (full
     detail with items + events + refunds + user). `PATCH /:id/status`
     enforces a legal-transition table (PENDING_PAYMENT →
     PAID/CANCELLED; PAID → FULFILLING/CANCELLED/REFUNDED; etc.) and
     auto-logs an OrderEvent. `POST /:id/notes` (text +
     isCustomerVisible). `POST /:id/refunds` validates amount ≤
     remaining refundable, updates `refundedTotal`, flips status to
     REFUNDED if fully refunded, emits `order.refunded`. New event
     bus types: `order.refunded`, `order.note_added`. All five
     endpoints verified with curl.
   - **Frontend**: `/admin/orders` paginated list (search by order
     number / customer name / email; status filter; columns
     orderNumber + customer + status pill + items count + total
     [with refund subtitle when applicable] + ship-to). New
     `OrderStatusPill` component for consistent status colors.
     `/admin/orders/[id]` detail: 8/4 column split — left side has
     items table with subtotal/shipping/total/refunded/net, the full
     activity timeline (status changes, notes private/customer,
     refunds), and a note composer with a "visible to customer"
     toggle. Right side has a status changer (filtered to legal
     transitions), refund button (showing remaining refundable),
     customer info, shipping address with country lookup, payment
     method + ref. Refund dialog enforces the remaining cap. Sidebar
     Orders pill flipped Soon → live.
   - **Verified end-to-end**: PENDING_PAYMENT → PAID worked; illegal
     PAID → DELIVERED rejected with the explicit allowed list;
     private note added; partial refund of 500/8200 recorded with
     activity timeline showing 3 events; over-refund of 999999
     correctly rejected.
   - Deferred: bulk edit on orders, packing slip / invoice PDF,
     tracking-number capture + carrier dropdown, customer-facing
     email notifications, gateway-actual refund execution (waits on
     payments module / GT Squad).

8. **[x] Admin Phase 1.2 — Image uploads (platform-wide API)**
   _(2026-04-26)_ — done.
   - **API**: new `modules/uploads/` module with a pluggable storage
     interface (`UploadStorage`). `LocalDiskStorage` writes to
     `UPLOADS_LOCAL_DIR` and returns
     `${UPLOADS_PUBLIC_URL_BASE}/{key}` URLs; `R2Storage` is a
     placeholder (S3-compatible client wires in once Magnus
     provisions R2). Backend selected via `UPLOADS_BACKEND=local|r2`.
     `POST /api/uploads` accepts multipart with `file` field and
     `?folder=` query (whitelist: products / categories / about /
     reviews / sellers / misc). Multer uses memory storage; JPEG /
     PNG / WEBP / AVIF / GIF allowed up to `UPLOADS_MAX_BYTES`
     (default 8MB). Multer errors translated to 400 (was 500).
     Generated key `{folder}/{cuid2}.{ext}`. Returns
     `{ url, key, contentType, size, originalName }`. Currently
     gated to `requireAuth + requireRole('ADMIN')` — easy to add
     SELLER / CUSTOMER role-folders later. helmet's CORP relaxed to
     cross-origin so the storefront (port 3000) can render images
     served by the API (port 4000).
   - **Frontend**: `lib/api/uploads.ts` posts FormData with the auth
     bearer; `components/admin/ImageUploader.tsx` is a single
     component that handles BOTH multi-image (gallery) and single-
     image (about) modes — drag-drop + click-to-pick, thumb grid
     with delete buttons, reorder arrows in multi mode, "Primary"
     pill on the first image, inline error display, animated
     uploading indicator. ProductForm's URL textarea and
     AttributesEditor's aboutImage URL input both swapped to it.
     `next.config.mjs` `images.remotePatterns` updated to allow
     `http://localhost:4000/uploads/**` in dev (R2 public host adds
     when provisioned).
   - **Audit confirmation**: every field the public product page
     renders is now editable in admin. The only remaining
     non-editable surface is the per-product `shipping` text
     (currently a constant) — queued as a Followup, see below.
   - **Verified end-to-end**: real PNG upload returns
     `http://localhost:4000/uploads/products/{cuid}.png`, image
     fetch back returns 200/image/png; non-image returns
     `{"code":"BAD_REQUEST","message":"Only image uploads are
     allowed"}` with HTTP 400; unauth returns 401.

7. **[x] Admin Phase 1.1 — Structured attribute editor + CSV bulk upload**
   _(2026-04-26)_ — done.
   - **A. Structured attribute editor**: new `AttributesEditor`
     component with collapsible Bundles / Features / Specifications /
     Variants / About subsections, each as a repeater (add / remove
     rows). Features get an icon dropdown of the 7 supported
     `LucideIcon` keys. Variants is single-row (Type, comma-separated
     Options, Default dropdown). About has 3 inputs (title, body,
     image URL). A "Raw JSON" tab with parse-validate-apply remains
     available as the power-user escape hatch. ProductForm swapped
     to use it.
   - **B. CSV bulk upload**: `POST /api/admin/products/bulk-upload`
     accepts JSON `{ csv }` (no multer — client reads file as text
     and posts it; server body limit bumped to 8mb). Uses `papaparse`
     with header rows + greedy empty-line skip. Validates each row,
     upserts by slug, returns `{ total, created, updated, skipped,
     errors, results[] }`. Existing products keep their `attributes`
     on update (so a CSV pricing/copy refresh doesn't blow away
     hand-tuned bundles); new products get the same default
     attributes generator the seed uses. Pipe-separated URLs in the
     `images` column. `GET /api/admin/products/bulk-template`
     returns a downloadable example CSV with correct headers.
   - **Frontend**: `ImportCsvDialog` mounted from a new "Import CSV"
     button on `/admin/products`; file picker, download-template
     link, result-summary panel with per-row error list (truncated
     at 25 rows). On success the products list refetches.
   - **Verified end-to-end**: template downloads as text/csv with
     correct first line; bulk upload of a 3-row CSV correctly
     created 1, updated 1 (Big Bites price 150 → 175 → restored),
     and reported 1 error (unknown categorySlug) with row number.

6. **[x] Admin Phase 1 — Catalog editing** _(2026-04-26)_ — done.
   - **API**: admin endpoints follow the "inside the domain module"
     pattern. `modules/products/admin.{schema,service,controller,
     routes}.ts` (list with q/category/inStock/sort + pagination,
     get, create, update partial, delete with order-FK guard +
     cart/review cascade). New `modules/categories/admin.*` (CRUD
     with FK guard — refuses delete if any product uses the
     category). New `modules/reviews/admin.*` (list with product/
     rating/verified filters; PATCH to toggle verified or edit
     fields, with auto product.rating + reviewCount recompute on
     change; delete with the same recompute). All composed in
     `modules/admin/routes.ts` and mounted at `app.use('/api/admin',
     adminRouter)` with `requireAuth + requireRole('ADMIN')`
     applied once at the router level.
   - **Frontend primitives**: `AdminPageHeader`, `ConfirmDialog`,
     `Toast` + `ToastViewport` (Zustand-backed, auto-dismiss 4s),
     `DataTable<T>` (typed columns, loading state, empty state,
     pagination footer). Mounted ToastViewport in the (admin)
     layout.
   - **Frontend pages**: `/admin/products` (search + category filter
     + stock filter + paginated table + delete with confirm),
     `/admin/products/new` and `/admin/products/[id]/edit` sharing
     the new `ProductForm` component (basics + copy + attributes
     JSON editor + pricing + inventory + organisation + images,
     with sticky save bar), `/admin/categories` (inline create + row
     edit + delete with FK-aware error), `/admin/reviews` (filters
     + verify-toggle + delete).
   - **Sidebar wiring**: Products, Categories, Reviews pills flipped
     from Soon → live; Orders/Customers/Discounts/Reports/Settings
     remain placeholders for their respective phases.
   - **Verified end-to-end**: API curl confirms admin role gate
     (ADMIN 200, CUSTOMER 403, unauth 401), products/categories/
     reviews list correctly with counts and joins. All 5 admin
     pages compile + serve 200.
   - **Deferred to later phases**: bulk edit, image upload (waits on
     R2), structured attribute-editor UI (current JSON textarea is
     functional), customer-facing review submission flow, single-
     product review subtab (admin reviews list is global for now).

5. **[x] Admin dashboard — Phase 0 Foundation** _(2026-04-26)_ — done.
   - Mirror choice locked: **Shopify UX + WooCommerce feature parity +
     Medusa structural pattern**. Lives inside the existing Next app at
     `src/app/(admin)/`. Admin API endpoints will live INSIDE each
     domain module as `admin.controller.ts` + `admin.routes.ts`,
     mounted under one auth gate (pattern documented for Phase 1).
   - **API**: `src/middleware/require-role.ts` exports
     `requireRole('ADMIN' | 'SELLER' | …)`; pair with `requireAuth`.
     Throws 403 with the standard error envelope on mismatch.
   - **CLI**: `scripts/make-admin.ts` + `npm run make-admin -- <email>
     [ROLE]`. Promotes/demotes by email. Defaults to ADMIN. Validates
     role enum. magnus@afrizonemart.com promoted CUSTOMER → ADMIN as
     the first admin.
   - **Frontend**: `src/components/admin/RequireAdmin.tsx` (auth +
     role gate; non-admin authed users get bounced to /account).
     `src/components/admin/AdminSidebar.tsx` (Shopify-style dark navy
     sidebar with Home/Orders/Products/Categories/Customers/
     Discounts/Reports/Audit/Settings nav, "Soon" pills on the not-
     yet-built items, user pill + logout at the bottom).
     `src/app/(admin)/layout.tsx` wraps the sidebar around children.
     `src/app/(admin)/admin/page.tsx` renders the placeholder
     dashboard with stat cards (— values), a Roadmap panel showing
     all 8 phases with the current/next highlighted, and a "what's
     gated, what's open" panel.
   - **Login redirect**: `(auth)/login/page.tsx` checks
     `result.user.role === 'ADMIN'` after login and pushes to
     `/admin` instead of `/account`. `?returnUrl=` still wins if set.
   - **Verified**: type-check clean both sides; `/admin` returns 200
     with the RequireAdmin gate placeholder for unauth/non-admin
     users.
   - Subsequent phases (1 Catalog → 2 Orders Ops → 3 Customers →
     4 Discounts+Shipping → 5 Settings+Audit+Webhooks → 6 Reports →
     7 Feature flags + Rules engine, plus an eventual 8 SELLER
     multi-vendor sub-admin) each get their own Active workstream
     entry as we open them.

4. **[x] Cart sync + Orders module** _(2026-04-26)_ — done.
   - **Schema**: `Cart` (1:1 user), `CartItem` (unique cartId+productId,
     refs Product for live pricing), `Order` (snapshot money +
     shipping), `OrderItem` (snapshot productSlug/Name/Image/UnitPrice
     so historical orders are stable across catalog edits). Enums
     `OrderStatus` and `PaymentMethod`. Migrations `commerce` +
     `commerce_relations`.
   - **Cart module**: `GET /api/cart`, `PUT /api/cart` (replace,
     validates productIds exist), `DELETE /api/cart`. Emits
     `cart.updated`. Service shapes lines with live product data.
   - **Orders module**: `POST /api/orders` snapshots cart inside a
     `prisma.$transaction` (creates order + items, clears cart),
     enforces in-stock, computes shipping cost (free over ₦10k, else
     ₦1500), generates a short `AZM-…` order number, emits
     `order.placed`. `GET /api/orders` lists user's orders newest
     first. `GET /api/orders/:id` returns one (404 if not the user's).
   - **Frontend**: `lib/api/cart.ts` and `lib/api/orders.ts` both use
     the new authed fetcher (auto-refreshes access token on 401).
     `cartStore` gains a `setItems` action for server hydration.
     `CartSyncProvider` is mounted in the root layout — on sign-in it
     pulls the server cart (or pushes a guest cart up if the server is
     empty), and on every local cart mutation it PUTs back the new
     items debounced 400ms. Checkout payment page replaces its mock
     order generator with `placeOrder({ shipping, paymentMethod })`
     and maps the 6 frontend `PaymentMethodId`s to the 3 API enum
     values; failed orders show an inline error and don't clear the
     cart. `(shop)/checkout/layout.tsx` gates checkout with
     `RequireAuth`. `/account/orders` and `/account/orders/[id]`
     rewritten as client components reading real orders + shipping.
   - **Verified end-to-end**: empty cart → PUT 2 items
     (Big Bites x3 + Malta x2) → place order → subtotal ₦1450 +
     ship ₦1500 = ₦2950, items snapshotted with prices, cart auto-
     cleared, `GET /api/orders` returns the new `AZM-…` order. All 4
     gated frontend pages render 200 with the RequireAuth gate.
   - Updates Phase 2 + Phase 3.

---

## Post-launch principles audit (2026-04-27)

After Phase 9 (production deploy), here is an honest scoring of all 10
principles based on the running production system, not the design intent.

| # | Principle | Status | One-line verdict |
|---|---|---|---|
| 1 | API-First Design | **[x]** | Frontend (storefront + admin) is a pure consumer; every action goes through `/api/*`. |
| 2 | Feature Flags | **[ ]** | Not built. Admin Settings cover config toggles, but no per-user/per-cohort rollout system. |
| 3 | Rules Engine | **[~]** | Pricing/shipping/coupons/free-shipping thresholds are admin-editable data; order status transitions are still in code. |
| 4 | Schema-Driven Design | **[x]** | `Product.attributes Json` + admin attribute editor lets us add product types (electronics, books, perishables) without migrations. |
| 5 | Event-Driven Architecture | **[x]** | 11 typed events; 8 modules subscribe; new features (notifications, webhooks, audit) added zero edits to checkout code. |
| 6 | Separation of Concerns | **[x]** | UI ↔ business ↔ data are three layers. API enforces `routes → controller → service → repository` per module. |
| 7 | Domain-Driven Design | **[x]** | 18 domain modules, every folder is a business concept. |
| 8 | Infrastructure as Code | **[x]** | `railway.toml`, `prisma/migrations/`, env-var manifest in `DEPLOY.md`, R2 + DNS documented. |
| 9 | Modular Architecture | **[x]** | 18 modules, no module imports another's `service.ts`; cross-module talks through eventBus. |
| 10 | Observability by Default | **[~]** | API has Winston JSON + Sentry hooks + per-request logs. Frontend has neither yet; no metrics/tracing layer. |

**Score: 7 ½ / 10 — `[x]`, 2 `[~]`, 1 `[ ]`.**

The three gaps (#2 feature flags, #3 fuller rules engine, #10 frontend
observability) are **post-launch work, not blockers**. The platform can
expand in every direction it was designed for: new product types, new
event subscribers, new modules, new countries, new front-end clients —
all without touching existing code.

### Per-principle evidence

**#1 API-First** — Storefront pages call `/api/products`, `/api/cart`,
`/api/orders`, `/api/auth`, `/api/payments`, `/api/uploads`. Admin
console calls `/api/admin/*` (12 admin sub-routers). The Next.js
frontend has zero direct DB queries. A mobile app dropping in tomorrow
would consume the exact same endpoints.

**#2 Feature Flags** — Honest gap. Closest we have is the admin
`SETTINGS_REGISTRY` (general/inventory/shipping/orders/notifications/
advanced groups) which lets staff toggle things like
`inventory.hide_out_of_stock` or `notifications.send_welcome` from the
UI. But there is no notion of "show new checkout to 1% of users" or
"kill-switch this feature for one customer." That requires a
`FeatureFlag` model + per-user evaluation — designed but not built.

**#3 Rules Engine** — Partial. Data-driven today: shipping zones &
rates (`/admin/shipping`), coupons & redemptions (`/admin/coupons`),
free-shipping thresholds, order number prefix, low-stock threshold.
Still in code: order status transition matrix
(`admin.service.ts ALLOWED_TRANSITIONS`), refund eligibility logic,
cancellation rules. A real rules engine (DSL or `if-then-else` data
table evaluated at runtime) is post-launch.

**#4 Schema-Driven** — `Product.attributes Json @default("{}")` plus
the structured-attribute admin editor (Phase 1.1) means a new product
type is a config change. Bundles, features, specifications, variants,
about-section content all live in `attributes`. No code change needed
to onboard "electronics with warranty + voltage" or
"perishables with expiry + allergens".

**#5 Event-Driven** — 11 typed events in `EventMap` (`order.placed`,
`order.paid`, `order.shipped`, `order.delivered`, `order.cancelled`,
`order.refunded`, `order.note_added`, `user.registered`,
`user.logged_in`, `cart.updated`, `product.viewed`,
`password.reset_requested`). 8 modules emit, 4 subscribe (notifications
dispatcher, webhooks dispatcher, audit log will land here). Adding the
welcome email, the audit log, and the Squad webhook all happened
**without touching `orders/service.ts`**.

**#6 Separation of Concerns** — Hard rule: `controller.ts` only
touches `req`/`res`, `service.ts` only touches business logic +
events, `repository.ts` only touches Prisma. Frontend mirrors:
`pages` → `components` → `lib/api` → API.

**#7 DDD** — Module folders: `auth, cart, categories, coupons,
customers, audit, health, notifications, orders, payments, products,
reports, reviews, settings, shipping, uploads, webhooks, admin`.
Frontend folders: `account, admin, auth, cart, checkout, layout,
product, sections, shop`. Zero technical-named folders like
`handlers/` or `processors/`.

**#8 IaC** — `railway.toml` (build + healthcheck + restart policy),
`prisma/schema.prisma` + `prisma/migrations/` (versioned schema),
`DEPLOY.md` (full step-by-step runbook with R2 + Vercel + Cloudflare
DNS), env vars on Railway/Vercel as the source of truth, no secrets
in code. `.gitignore` properly anchored after the bug we hit. Vercel
auto-detects Next.js (no `vercel.json` needed).

**#9 Modular** — Every cross-module communication is via the event
bus. `notifications/dispatcher.ts` subscribes to events from `auth`,
`orders`, `payments`, but does **not** import their service files.
Killing one module (e.g. `notifications`) doesn't take down checkout.

**#10 Observability** — API: Winston JSON logger
(`src/infra/logger.ts`), Sentry hook
(`src/infra/sentry.ts` — DSN currently empty in prod, ready to wire),
per-request log middleware with `requestId` correlation, `errorHandler`
funnels everything through one envelope. Frontend has no Sentry yet
and no client-side request tracing — explicit follow-up. No
OpenTelemetry / Prometheus yet (premature for current scale).

### What this audit changes in the tracker
- **#1 API-First** → `[~]` → `[x]`
- **#5 Event-Driven** → `[~]` → `[x]`
- **#6 Separation of Concerns** → `[~]` → `[x]`
- **#3 Rules Engine** → `[ ]` → `[~]` (partial via Settings + Coupons + Shipping)
- **#2 Feature Flags** stays `[ ]` — explicit post-launch
- **#10 Observability** stays `[~]` — frontend Sentry + metrics post-launch

### Code-level rules (Part B) — also re-audited
- **B1 API-First (code level)** → `[x]` — every section is API-driven now (was `[~]` when only Groceries was wired).
- **B5 Event-Driven Side Effects** → `[x]` — notifications, audit, webhooks all subscribe to events instead of patching origin code.
- **B8 Error and Loading States** → `[x]` — every async boundary has a loading + error state (verified during deploy smoke test).
- **B10 Observability (code level)** → `[~]` — server side complete, client side pending.

---

## Part A — 10 Scalable Architecture Principles
*(from `Afrizonemart_2.0_ScalableArchitecture_Apr2026_10EngineeringPrinciples.docx`)*

These are **system-level** principles. They shape how the whole platform is
organised so it can grow without breaking.

---

### 1. [x] API-First Design

**What it means**: Every core function (orders, payments, products, cart, etc.)
lives behind an API. The website, future mobile app, WhatsApp bot, and partner
integrations all consume the same endpoints — no duplicated logic.

**Why it matters**: Launching a mobile app or selling via WhatsApp later costs
days, not months — because the brain is already separate from the face.

**Implementation log**:
- **2026-04-25 — API project bootstrapped** at `../afrizonemart-api/`. Express
  + TypeScript + Prisma + PostgreSQL. First module (`products`) is fully
  built end-to-end with the canonical layering: `routes → controller →
  service → repository`. Endpoints `GET /api/products` (list, filterable by
  category/origin/q/inStock/sort) and `GET /api/products/:slug` (single, with
  `product.viewed` event emitted) are live and type-checked. Health endpoint
  `GET /api/health` checks DB connectivity. Status `[~]` not `[x]` because
  the Next.js frontend still uses mock data — actual integration is the
  next push.

---

### 2. [x] Feature Flags _(landed 2026-04-27 in Phase 10.4)_

**What it means**: Every feature can be turned on/off from a database row
without deploying code. Roll out to 1% first, kill instantly if it breaks.

**Why it matters**: A/B tests, gradual rollouts, instant kill-switch when
something explodes — without engineers touching the code.

**Implementation log**:
- _(empty)_

---

### 3. [x] Rules Engine _(landed 2026-04-27 in Phase 10.5; engine + admin live, migration of legacy hardcoded rules ongoing)_

**What it means**: Pricing, shipping thresholds, discount logic, surge rules,
loyalty points, regional pricing — all stored as configurable data, edited
from the admin dashboard. Not hardcoded in the application.

**Why it matters**: The business team changes the free-shipping threshold from
₦10k to ₦15k in 30 seconds without filing an engineering ticket.

**Implementation log**:
- _(empty)_

---

### 4. [x] Schema-Driven Design (audited 2026-04-27)

**What it means**: Product attributes are flexible. A clothing item has
size/colour, a food item has expiry/allergens, an electronics item has
warranty/voltage — without schema migrations.

**Why it matters**: Onboarding a new product type (or complying with a new
regulation in a new country) is a configuration change, not a code change.

**Implementation log**:
- _(empty — we currently have a fixed `Product` interface in
  `src/types/index.ts` and a fixed Prisma `Product` model. The flexible
  attribute layer (a `Json` column on Product, plus an admin to manage
  attribute keys) lands during the next iteration of the products module.)_
- **2026-04-26 — followup queued**: the product detail page (`/product/[slug]`)
  needs **rich content fields** the API doesn't yet model: `bundles`,
  `features`, `specifications`, `aboutTitle/aboutBody/aboutImage`,
  `reviews`, `variants`, `discountPercent`, `shortDescription`,
  `longDescription`, `ingredients`, multi-image gallery. Today these are
  hardcoded for one product in `src/lib/products.ts`. Temporary fix
  (2026-04-26) is an **API + static defaults overlay** in the page so
  every seeded product renders without 404s while reusing the existing
  rich content as fallback. **Proper fix (later session)**: extend Prisma
  schema with these fields (likely a mix of dedicated columns for
  `shortDescription`/`longDescription`/`ingredients`/`discountPercent`
  and a `Json` `attributes` column for `bundles`/`features`/`specs`/
  `variants`; reviews get their own `Review` model; images get a
  `ProductImage` side table once we have R2 set up). Update seed to
  populate this for every product. Once that lands, the overlay layer
  can be deleted and the page reads purely from the API. **This is the
  Schema-Driven Design milestone — it cannot be marked `[x]` until done.**

---

### 5. [x] Event-Driven Architecture (audited 2026-04-27)

**What it means**: When `order.placed` fires, every interested service
(payment, email, inventory, supplier-notification, loyalty, analytics)
subscribes independently. Adding a new feature = subscribe to an event, never
touch the existing checkout code.

**Why it matters**: New features stop being scary. Old features stop breaking
when new ones are added.

**Implementation log**:
- **2026-04-25** — In-process event bus built at
  `afrizonemart-api/src/infra/eventBus.ts`. Typed event map (`order.placed`,
  `order.paid`, `order.shipped`, `product.viewed`, `cart.updated`) means
  emit/subscribe are both autocompleted and type-checked. First emit point
  is in `modules/products/service.ts` — `getProductBySlug` emits
  `product.viewed` so a future analytics or recently-viewed module can
  subscribe without touching the products code. Marked `[~]` because we have
  the bus and one publisher, but no real consumers (notifications,
  analytics, inventory) yet — those land with their respective modules.
- **2026-04-26** — Auth module added two more publishers:
  `user.registered` (on successful register) and `user.logged_in` (on
  successful login). Still no consumers — welcome emails, login
  notifications, and audit log will subscribe when those modules land.

---

### 6. [x] Separation of Concerns (audited 2026-04-27)

**What it means**: UI, business logic, and data are three completely separate
layers that talk through defined interfaces.

**Why it matters**: A full UI redesign in 2027 requires zero backend changes;
a payment-logic refactor requires zero UI changes.

**Implementation log**:
- **2026-04-25** — On the frontend side, this is already in good shape. UI
  components in `src/components/**` don't contain business logic — they call
  cart/checkout stores or (eventually) APIs and render the result. Cart
  arithmetic lives in `src/stores/cartStore.ts` selectors. Currency formatting
  lives in `src/lib/format.ts`. Country lookup is in `src/lib/countries.ts`.
- **2026-04-25 (API)** — On the API side, every module enforces three
  layers: `controller.ts` (HTTP only — no Prisma), `service.ts` (business
  logic + event emits — no req/res), `repository.ts` (Prisma only — no
  HTTP). The API README codifies this as a hard rule. The two halves now
  talk via `/api/...` URLs. Status stays `[~]` until the frontend actually
  calls the API (instead of using mocks) — that flip happens in the next
  push.

---

### 7. [x] Domain-Driven Design

**What it means**: Folders, files, functions, and tables are named after
business concepts (products, orders, customers, sellers, payments, reviews,
notifications, search, analytics, logistics, categories, cart, auth,
wishlist) — not technical names like `handlers/` or `processors/`.

**Why it matters**: A new dev understands the codebase in hours; product
people and engineers speak the same language.

**Implementation log**:
- **2026-04-25** — Frontend folders already follow DDD:
  - `src/components/{cart, checkout, account, auth, category, layout, product,
    sections, shop}/` — every folder is a domain concept.
  - `src/app/(shop)/{cart, checkout, account, product, search, shop}/` and
    `src/app/(auth)/{login, register, forgot-password}/` — same on the route
    side.
  - `src/lib/{countries, products, mock-data, checkout-data, format,
    api}.ts` — domain-named utility files.
  - `src/stores/{cartStore, checkoutStore}.ts` — domain stores.
- **2026-04-25 (API)** — API mirrors the same pattern:
  `afrizonemart-api/src/modules/{health, products}/` to start, with
  `{orders, payments, customers, sellers, notifications, search, reviews,
  ...}` as additional folders coming with their respective modules. Each
  module is its own self-contained mini-app with the same 5-file shape
  (`*.schema.ts`, `repository.ts`, `service.ts`, `controller.ts`,
  `routes.ts`). Documented in the API README. **Flipped to `[x]` because
  both ends now follow DDD identically.**

---

### 8. [x] Infrastructure as Code

**What it means**: `vercel.json`, `railway.json`, env-var manifests, database
provisioning — all in Git. Spinning up a staging copy or duplicating the stack
in a new country is a `git clone` + a script.

**Why it matters**: Geographic expansion (Afrizonemart Ghana, Kenya, etc.)
becomes a config duplication, not a project.

**Hosting stack — decided 2026-04-25:**

```
                ┌──────────────────────────┐
                │       Cloudflare         │   DNS · CDN · DDoS · SSL · WAF
                │   (afrizonemart.com)     │   Free tier sufficient at launch
                └────┬──────────────┬──────┘
                     │              │
                     ▼              ▼
            ┌──────────────┐  ┌──────────────────┐
            │   Vercel     │  │    Railway       │
            │ Next.js      │──▶ Node + Express   │
            │ frontend     │  │ + Prisma         │
            └──────────────┘  │ + PostgreSQL     │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Cloudflare R2    │  Product images
                              │ (object store)   │  Zero egress fees
                              └──────────────────┘
```

| Layer | Provider | Why |
|---|---|---|
| Frontend hosting | **Vercel** | Built for Next.js; free tier generous; preview URLs per branch |
| API + Postgres | **Railway** | Runs Express + Prisma directly; zero ops; built-in Postgres + backups; ~$5-20/mo |
| Object storage | **Cloudflare R2** | **Zero egress fees** — critical because e-commerce serves millions of product images. AWS S3's $0.09/GB egress would balloon to thousands/month. |
| CDN · DNS · DDoS · SSL · WAF | **Cloudflare** | PoPs in Lagos, Nairobi, Cape Town, Cairo, Accra → ~40-80ms latency from major African cities. Free DDoS protection. Single pane for DNS. |

**Why not AWS?** Three reasons specific to Afrizonemart:
1. **Egress fees on S3 ($0.09/GB) would punish a pan-African image-heavy site.** Cloudflare R2 charges $0 egress.
2. **AWS has no region inside any of our key African markets** (closest are Cape Town for ZA, Frankfurt/Dublin for everyone else). Cloudflare has PoPs *inside* Lagos, Nairobi, Cape Town, Cairo, and Accra.
3. **Operational complexity** (IAM, VPCs, security groups, Route 53) is a tax we don't need at launch. Railway + Cloudflare is two dashboards we can fully operate as a small team.

**What still needs writing as actual code:**
- [x] Next.js frontend deploy config — Vercel auto-detects, no `vercel.json` needed; env-var manifest documented in `DEPLOY.md` §4.
- [x] `railway.toml` for the API project (build & start commands, healthcheck path, restart policy) — fixed in Phase 9 to use `npx prisma migrate deploy`.
- [x] Prisma schema + migrations directory under `prisma/` in the API repo
- [x] R2 bucket provisioning documented in `DEPLOY.md` §1 (manual Cloudflare dashboard steps; full Terraform deferred — overkill for one bucket).
- [x] DNS records documented in `DEPLOY.md` §2 (Railway custom domain) and §4 (Vercel apex + www).

**Implementation log**:
- **2026-04-25 — Hosting stack agreed**: Vercel + Railway + Cloudflare
  (R2 + edge). AWS explicitly skipped at launch.
- **2026-04-25 — First IaC files written**:
  `afrizonemart-api/railway.toml` (build/start commands, healthcheck
  `/api/health`, restart-on-failure policy) and
  `afrizonemart-api/prisma/schema.prisma` (initial Postgres schema with
  Product + Category models). Both checked into Git. `.env.example`
  committed as the documented contract for required env vars (DATABASE_URL,
  JWT_SECRET, SENTRY_DSN, etc.).

---

### 9. [x] Modular Architecture

**What it means**: The platform is broken into self-contained modules
(products, orders, payments, sellers, notifications, reviews, promotions,
analytics, admin, search, logistics) with well-defined interfaces between
them. Teams can ship in parallel without colliding.

**Why it matters**: Different teams move at different speeds; one module
breaking doesn't take the whole platform down.

**Implementation log**:
- **2026-04-25** — Frontend modularity is solid (see Principle #7 above).
  Each section component is self-contained and reusable; ProductCard,
  CategoryCard, OrderTracker, etc. are all independent and composable.
- **2026-04-25 (API)** — Module independence enforced architecturally.
  Each module under `afrizonemart-api/src/modules/<name>/` is self-contained
  with its own routes, controller, service, repository, and Zod schemas.
  A module **must not** import another module's service file directly —
  cross-module communication uses the event bus (`eventBus.emit/on`). The
  API README codifies this rule. **Flipped to `[x]`.**

---

### 10. [~] Observability by Default

**What it means**: Structured logs (Winston JSON), error tracking (Sentry),
metrics, and traces are wired in from the very first endpoint. We never guess
why a customer's payment failed; we look it up in 30 seconds.

**Why it matters**: Customer support resolves issues in minutes instead of
hours; fraud is detected from real signal, not gut feel.

**Implementation log**:
- **2026-04-25 (API side)** — Three observability primitives wired in
  before the first endpoint was written:
  - **Winston JSON logger** (`src/infra/logger.ts`) — production emits
    structured JSON ready for Logtail / Better Stack / Datadog. Dev emits
    coloured human-readable lines.
  - **Sentry** (`src/infra/sentry.ts`) — initialised at startup if
    `SENTRY_DSN` is set, silent in local dev. Wired into the Express error
    handler so every uncaught exception is captured with full context.
  - **Per-request structured log** (`src/middleware/request-logger.ts`) —
    every API call logs `{requestId, method, path, status, duration_ms,
    userAgent}` and stamps `X-Request-Id` on the response so trace
    correlation works across logs, errors, and the frontend's network tab.
  - The `errorHandler` middleware funnels `HttpError`, `ZodError`, and
    unknown errors into a consistent JSON envelope and either warns
    (4xx) or errors (5xx) accordingly.
- Status `[~]` not `[x]` because: (a) the frontend has no Sentry yet, (b) no
  metrics/tracing layer (OpenTelemetry, Prometheus) yet, (c) production
  Sentry DSN not provisioned. All three land in the next observability
  push.

---

## Part B — 10 Architecture Rules (Claude Build Guide v1.1)
*(from `Afrizonemart_2.0_ClaudeBuildGuide_v1.1_Apr2026_BrandUpdated (1).docx`,
Section 3)*

These are **code-level** rules. Every file, every component, every API
endpoint must comply.

---

### B1. [x] Rule 1 — API-First (code level) (audited 2026-04-27)

**What it means**: Build the endpoint *before* the UI component. Components
only call APIs and render data — never contain business logic.

**Implementation log**:
- **2026-04-25** — First API endpoints exist before the frontend consumes
  them: `GET /api/products` and `GET /api/products/:slug`.
- **2026-04-25 (frontend half)** — Groceries section (`ProductsSection`)
  is now a client component using `useProducts({category: 'groceries'})`
  via TanStack Query. Other product sections (Deals, Favourites, Female,
  Purchase Big, Books) still use hardcoded data — they migrate
  incrementally as we add their API endpoints / category seeds. Stays
  `[~]` until at least the catalogue side is fully API-driven.

---

### B2. [x] Rule 2 — TypeScript Everywhere

**What it means**: Every value typed. No `any`. Types in `src/types/` and
domain-specific types co-located with their modules.

**Implementation log**:
- **2026-04-25** — Entire codebase is TypeScript. `src/types/index.ts` holds
  cross-cutting types (`Product`, `CartItem`, `Order`, `Customer`, etc.).
  Domain-specific types are co-located: `ProductDetail` in
  `src/lib/products.ts`, `MockOrder` and `OrderStatus` in
  `src/lib/mock-data.ts`, `Country` in `src/lib/countries.ts`,
  `ShippingAddress` and `NotifyPrefs` in `src/stores/checkoutStore.ts`,
  `ProductBundle`/`ProductFeature`/`ProductSpec`/`ProductReview` in the
  product module. Strict mode is on; no `any` casts.
- **2026-04-25 (API)** — Same on the API side: strict TypeScript across
  the new `afrizonemart-api/` project. Zod schemas validate runtime input
  in addition to TS-level type safety.

---

### B3. [x] Rule 3 — Component Architecture

**What it means**: Small, focused components. Always handle loading, error,
and empty states. Use named exports.

**Implementation log**:
- **2026-04-25** — All components use named exports (no defaults except for
  Next.js page files which require default exports). Components are kept
  small and focused — `CartLineItem`, `BundleSelector`, `QuantitySelector`,
  `OrderTracker`, `FiltersSidebar`, etc. are each one job. Empty states exist
  for cart (`EmptyCart`), wishlist, orders, search-no-results. Loading states
  are placeholder — proper loading skeletons land in Rule B8.

---

### B4. [x] Rule 4 — State Management

**What it means**: Zustand for global state. TanStack Query for server data.
`useState` for local UI. Don't reach for Redux.

**Implementation log**:
- **2026-04-25** — Zustand is in place with **two stores**:
  - `useCartStore` (`src/stores/cartStore.ts`) — items, addItem, removeItem,
    updateQuantity, clear; persisted to localStorage as `azm-cart`.
  - `useCheckoutStore` (`src/stores/checkoutStore.ts`) — shipping, delivery
    method, notify prefs, payment method, order id; persisted as
    `azm-checkout`.
- **2026-04-25 (TanStack Query wired)** — `QueryProvider`
  (`src/components/providers/QueryProvider.tsx`) wraps the entire app from
  `src/app/layout.tsx`. First hooks at `src/hooks/use-products.ts`
  (`useProducts(params)`, `useProduct(slug)`) calling
  `src/lib/api/products.ts`. The Groceries section is the first consumer
  with full loading + error rendering. Default options: 60s staleTime, 5m
  gcTime, 1 retry, no refetch on focus.
- Local UI state (`useState`) is used everywhere it should be — modal opens,
  form drafts, accordion sections, gallery active index, wishlist toggle, etc.
- **Flipped to `[x]`** — three-tier state strategy fully realised.

---

### B5. [x] Rule 5 — Event-Driven Side Effects (audited 2026-04-27)

**What it means**: Use `eventBus` for side effects. Adding a notification
when an order is placed should be a subscriber registration, never a chained
function call inside the order code.

**Implementation log**:
- **2026-04-25** — Bus implemented at
  `afrizonemart-api/src/infra/eventBus.ts` with a typed `EventMap`. First
  publisher: `products/service.ts` emits `product.viewed`. Status `[~]`
  until at least one real cross-module subscriber exists (planned with the
  Notifications module).

---

### B6. [x] Rule 6 — UI From Screenshots

**What it means**: Match the original site design pixel-for-pixel using the
provided screenshots. Pixel-sample colours; don't guess.

**Implementation log**:
- **2026-04-25** — Done extensively. Brand tokens were **pixel-sampled** from
  the live afrizonemart.com hero screenshot:
  - Navy `#000066` (overrode the Build Guide's `#0D1F4E` and an
    intermediate `#1e1b7f`)
  - Amber `#FBAC34` (overrode the Build Guide's `#F5A623`)
  - Section banner pattern, card aspect ratios, container max-widths, card
    proportions, padding — all measured from the design before being coded.
- All 9 homepage containers, the product page, and the checkout flow were
  built from user-provided screenshots and iteratively tightened to match
  measurements.

---

### B7. [x] Rule 7 — Mobile-First Responsive

**What it means**: Design for mobile first. Use Tailwind responsive prefixes
(`sm:`, `md:`, `lg:`, `xl:`) on every breakpoint-sensitive component.

**Implementation log**:
- **2026-04-25** — Every grid, every navigation, every card collection is
  responsive. Examples: cart line items collapse to stacked rows on mobile,
  hero slider drops to single-image on phones, shop filters become a slide-in
  drawer on mobile, country grid goes 3 → 4 → 6 → 7 cols across breakpoints,
  header search bar adapts. Tested visually at multiple widths during the
  build.

---

### B8. [x] Rule 8 — Error and Loading States (audited 2026-04-27)

**What it means**: Every data-fetching component handles **loading**,
**error**, and **empty** states. No naked spinners; use skeleton placeholders
that match the final shape.

**Implementation log**:
- **2026-04-25** — Skeletons + error fallbacks introduced for the first
  data-fetching surface (Groceries section):
  - `src/components/product/ProductCardSkeleton.tsx` — single-card skeleton
    matching the exact shape of `ProductCardPlaceholder` so there's no
    layout shift when real data arrives. `ProductGridSkeleton` renders N.
  - `src/components/product/ProductGridError.tsx` — inline error tile with
    "Try Again" button that calls `refetch`. Reads the API error envelope
    (`error.code` / `error.message`).
  - The cart, wishlist, orders, and search-no-results pages already had
    empty states from earlier work.
- Status `[~]` because only one section (Groceries) demonstrates the
  pattern. Other sections still use static data and will pick up the same
  loading/error treatment as we migrate them to the API.

---

### B9. [x] Rule 9 — Environment Variables

**What it means**: All config in `.env` files. `NEXT_PUBLIC_` prefix for any
var that needs to reach the browser.

**Implementation log**:
- **2026-04-25** — Frontend: `.env.local` and `.env.local.example` exist with
  `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`. `.env.local` is
  git-ignored. `src/lib/api.ts` reads `process.env.NEXT_PUBLIC_API_URL` (with
  a localhost fallback) for the axios base URL.
- **2026-04-25 (API)** — Server-side env vars are typed and validated at
  startup via Zod (`afrizonemart-api/src/config/env.ts`). The app refuses
  to boot if `DATABASE_URL` or `JWT_SECRET` (≥32 chars) is missing.
  Documented in `.env.example`. More vars (Paystack public key, Resend API
  key, Cloudflare R2 endpoints, Sentry DSN) get added to both schema and
  example as each integration lands.

---

### B10. [~] Rule 10 — Observability

**What it means**: Log every meaningful action from day one. Every error is
caught and reported. Winston for structured logs, Sentry for error tracking.

**Implementation log**:
- **2026-04-25 (API)** — Same wiring as Principle #10: Winston structured
  logger, Sentry init, per-request log middleware with `X-Request-Id`,
  central error handler that logs and reports to Sentry. Status `[~]` until
  the frontend gets a Sentry SDK and prod DSNs are configured.

---

## Part C — Build Guide Phases (Section 6)

The Build Guide also lays out a 6-phase tracker for actual feature delivery.
Recording our state against it for context:

- **Phase 0 — Project Setup** [x] complete
  - Next.js 14, TypeScript, Tailwind, brand tokens, Raleway font, folder
    structure, env vars, basic libs all in place.
- **Phase 1 — Base Components** [x] complete
  - Button-equivalents (used inline), inputs, cards, badges, modals,
    skeletons (partial), toasts (none yet — TBD), error/empty states,
    SectionBanner, Header, Footer, CartDrawer (we used a cart pill +
    dedicated cart page instead), ProductCard variants, ProductGrid,
    PriceDisplay (`formatPriceNGN`), CategoryCard.
- **Phase 2 — API Endpoints** [~] in progress
  - **2026-04-25**: `afrizonemart-api/` project bootstrapped (Node + Express
    + TypeScript + Prisma + PostgreSQL). First module (products) live with
    list + single-product endpoints. Health endpoint live. Type-check passes.
  - **2026-04-26**: **Auth module live** — register, login, refresh,
    logout, /me. JWT access (15m) + refresh (30d) with hashed
    refresh-token-on-user revocation. bcrypt for passwords (12 rounds).
    User model migrated. All endpoints verified end-to-end.
  - Remaining: cart sync → orders → payments → notifications →
    search → categories → wishlist → reviews → admin endpoints.
- **Phase 3 — Frontend Pages** [x] complete (UI only, mock data)
  - Homepage, shop, category, product, cart, checkout, success, login,
    register, forgot-password, account dashboard, account/orders,
    account/orders/[id], account/wishlist, account/addresses,
    account/profile, search, shop/country/[slug] — all done.
- **Phase 4 — Admin Dashboard** [ ] not started
- **Phase 5 — Data Migration** [ ] not started (depends on API)
- **Phase 6 — Launch** [ ] not started

---

## How we'll use this document going forward

1. We agree on which item to tackle next.
2. We implement.
3. I tick the box (`[ ]` → `[x]` or `[~]`) and write a 3-6 line summary in
   the **Implementation log** for that item — what we did, where the code
   lives, and any noteworthy decisions.
4. If the implementation also unblocks/partially-fulfils another principle,
   I cross-reference it.

This way the doc stays the single source of truth on which architectural
commitments are honoured and which are still pending.

---

## Suggested next push

Bootstrap is done. The next push is **connect the frontend to the new API**:

1. **Provision a local Postgres** (Docker, Postgres.app, or Railway preview
   DB) and run `npx prisma migrate dev` to create the products + categories
   tables. Seed with the existing mock products as real DB rows.
2. **Replace `src/lib/products.ts` mock data** in the Next.js app with
   TanStack Query hooks (`useProducts`, `useProduct(slug)`) calling
   `GET /api/products` and `GET /api/products/:slug`.
3. **Add proper loading skeletons + error boundaries** on the homepage
   product grids and the `/product/[slug]` page — this finally closes
   Rule B8.
4. **Sentry SDK on the frontend** — `@sentry/nextjs` install + DSN — so
   the whole pipeline (frontend → API → Sentry) is observable.
5. **Build the auth module** (register, login, refresh) and wire login /
   register pages to it.

Steps 1-3 flip Rule B1 to `[x]` and close the loop on Principle #1.
Step 4 finishes Principle #10 and Rule B10 (frontend half).
Step 5 unlocks all the account-section pages going from mock to real.

After that we work down: cart sync → orders → payments → notifications.

---

## Followups (queued — not yet done)

- **Crash-on-DB-blip (API)** — _fully resolved 2026-04-26_. Two
  layers: (1) `asyncHandler` wrapper + process-level
  `unhandledRejection`/`uncaughtException` listeners in `server.ts`
  prevent the API from dying. (2) `prisma.$extends` retry middleware
  in `infra/prisma.ts` retries P1001/P1002/P1008/P1017 with
  exponential backoff (200ms → 400ms, 2 retries) so brief blips
  return 200 on retry instead of 503.
- **Product detail rich-content schema (Principle #4 milestone)** —
  _resolved 2026-04-26 Workstream 3_. Schema extended with
  `attributes Json`, `Review` model, plus dedicated columns for
  `shortDescription`, `ingredients`, `discountPercent`. Page reads
  pure-API. `ProductImage` side table still deferred until R2 image
  uploads land.
- **Related products are still hardcoded slugs**: `getRelatedProducts` in
  `src/lib/products.ts` returns 6 fixed slugs, several of which don't
  match the seed (`tara-half-dual-powder-palette` vs seed's
  `tara-half-dual-powder`, etc.). Real fix is to fetch related products
  by category from the API. Quick fix in this session is to align the
  hardcoded slugs to the seed so the links work.
- **Auth — refresh token in localStorage** _(resolved 2026-04-26
  Workstream 1)_ — refresh token now lives only in an `azm_refresh`
  httpOnly cookie set by the API; `authStore` only persists `user` +
  `accessToken`.
- **Auth — User schema missing fields** (2026-04-26). The register form
  collects `firstName`, `lastName`, `country`, `phone` but the API only
  persists email/password/name. Country and phone are silently dropped.
  Extend the User Prisma model and seed migration accordingly when we
  add the customer-profile module.
- **Auth — no automatic access-token refresh on 401** _(resolved
  2026-04-26 Workstream 1)_ — `lib/api/client.ts` `apiFetchAuthed`
  now retries once via `authStore.refresh()` when the API returns 401.
- **Auth — forgot-password not wired** (2026-04-26). The page is static.
  Needs a backend endpoint (`POST /api/auth/password-reset/request`,
  `POST /api/auth/password-reset/confirm`) using a one-time token sent
  over email; depends on the notifications module.
- **Account pages still on mock data** (2026-04-26, partially
  resolved). `/account` (dashboard) now reads real orders + real user
  data via `listOrders()` and the auth store. **Still on mocks**:
  `/account/wishlist`, `/account/addresses`, `/account/profile`,
  `/account/rewards`. Need wishlist module, addresses module, profile
  PATCH endpoint, and a loyalty-points module respectively.
- **Order detail URL accepts cuid OR orderNumber** (2026-04-26). The
  initial `/account/orders/[id]` path expected the cuid only and
  404'd when the dashboard linked using the friendly `AZM-…` number.
  Fixed: `findOrder` now matches `id OR orderNumber`. Frontend uses
  the friendly number in URLs.
- **/shop/[category] pages still on mocks** (2026-04-26). The "View
  More" buttons on each homepage section link to `/shop/groceries`,
  `/shop/books`, etc. — those category landing pages still render
  hardcoded products. Migrate to `useProducts({category})` with a
  shared layout; would also unlock filters (origin, sort, price
  range).
- **GT Squad payment gateway integration** (2026-04-26, supersedes
  earlier Paystack note). Magnus chose **GT Squad** (multi-currency,
  important for pan-African + global shipping). The `PaymentMethod`
  Prisma enum still says `PAYSTACK` and needs renaming/replacing
  (`GTSQUAD` or a more neutral `CARD` + `gateway` field). Build a
  `payments` module with init + webhook endpoints; on webhook
  success transition `Order.status` to `PAID` and emit `order.paid`.
  Use `Order.currency` (already on the model) — do not hardcode NGN.
  Env: `GTSQUAD_PUBLIC_KEY`, `GTSQUAD_SECRET_KEY`,
  `GTSQUAD_WEBHOOK_SECRET`. Need test/live keys from Magnus before
  end-to-end verification.
- **Order status timeline / tracking** (2026-04-26). `Order.status`
  is updateable but we don't store status-change timestamps, so the
  `OrderTracker` component can't show "shipped at", "delivered at"
  etc. Either add `OrderStatusEvent` table or add timestamp columns
  per status. Re-enable the rich tracker UI on `/account/orders/[id]`
  once landed.
- **CartSyncProvider swallows server errors** (2026-04-26). If
  `replaceCart` PUT fails (e.g. validation: stale productId after a
  catalog edit), the local cart silently diverges from the server.
  Surface a toast or inline banner; reconcile by re-fetching server
  cart on next mount.
- **Per-product `shipping` text editable in admin** (2026-04-26).
  Public product page renders a `shipping` string ("Free shipping
  over NGN10k…"). Currently a constant in `src/lib/products.ts` so
  every product shows the same line. Either add an editable
  `shippingNote` column to Product (admin field) or — better — make
  it part of the global Settings module (Phase 5) and override
  per-product only when the field is non-empty.
- **Header nav links unverified** (2026-04-26). `/shop/country/nigeria`,
  `/deals`, `/shop/1k-store`, `/new-arrivals`, `/suppliers` — none of
  these routes exist yet. Either build them or remove the nav items
  for v1
