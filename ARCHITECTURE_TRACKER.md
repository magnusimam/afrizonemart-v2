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

---

## Part A — 10 Scalable Architecture Principles
*(from `Afrizonemart_2.0_ScalableArchitecture_Apr2026_10EngineeringPrinciples.docx`)*

These are **system-level** principles. They shape how the whole platform is
organised so it can grow without breaking.

---

### 1. [~] API-First Design

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

### 2. [ ] Feature Flags

**What it means**: Every feature can be turned on/off from a database row
without deploying code. Roll out to 1% first, kill instantly if it breaks.

**Why it matters**: A/B tests, gradual rollouts, instant kill-switch when
something explodes — without engineers touching the code.

**Implementation log**:
- _(empty)_

---

### 3. [ ] Rules Engine

**What it means**: Pricing, shipping thresholds, discount logic, surge rules,
loyalty points, regional pricing — all stored as configurable data, edited
from the admin dashboard. Not hardcoded in the application.

**Why it matters**: The business team changes the free-shipping threshold from
₦10k to ₦15k in 30 seconds without filing an engineering ticket.

**Implementation log**:
- _(empty)_

---

### 4. [ ] Schema-Driven Design

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

---

### 5. [~] Event-Driven Architecture

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

---

### 6. [~] Separation of Concerns

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

### 8. [~] Infrastructure as Code

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
- [ ] `vercel.json` for the Next.js frontend (regions, env-var manifest, build config)
- [x] `railway.toml` for the API project (build & start commands, healthcheck path, restart policy)
- [x] Prisma schema + migrations directory under `prisma/` in the API repo
- [ ] R2 bucket provisioning notes / Wrangler config or Cloudflare Terraform
- [ ] DNS records documented (or moved to Cloudflare-as-Terraform)

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

### B1. [~] Rule 1 — API-First (code level)

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

### B5. [~] Rule 5 — Event-Driven Side Effects

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

### B8. [~] Rule 8 — Error and Loading States

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
    Remaining: auth → cart sync → orders → payments → notifications →
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
