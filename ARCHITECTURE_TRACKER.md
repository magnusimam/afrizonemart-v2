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

### 4. [x] Schema-Driven Design

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
- **2026-04-26** — Auth module added two more publishers:
  `user.registered` (on successful register) and `user.logged_in` (on
  successful login). Still no consumers — welcome emails, login
  notifications, and audit log will subscribe when those modules land.

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
  for v1.
