# Afrizonemart 2.0 — Mobile App Implementation Tracker

> Living document. Tick each checkbox as we ship. Under every item we log a
> plain-English summary of **what we actually did, when, and where the code
> lives** — same convention as `ARCHITECTURE_TRACKER.md`.
>
> Sources:
> - `Afrizonemart_2.0_ScalableArchitecture_Apr2026_10EngineeringPrinciples.docx` (same principles apply to mobile — API-First, Event-Driven, Schema-Driven, etc.)
> - `Afrizonemart_2.0_ClaudeBuildGuide_v1.1_Apr2026_BrandUpdated (1).docx` (brand tokens; UI rules)
> - Web platform — every API endpoint the mobile app calls is **already live and in production**.
>
> Status legend: `[ ]` not started · `[~]` partially done · `[x]` done

---

## Locked decisions (2026-05-21)

| Decision | Choice | Rationale |
|---|---|---|
| **Stack** | **React Native + Expo (TypeScript, EAS Build, OTA updates)** | Reuses our TS codebase + shared types + utility libs (countries, formatters, validators, capability strings). One team ships iOS + Android. OTA pushes JS changes without app-store review. |
| **Backend** | **Existing afrizonemart-api** (no new backend) | Engineering Principle #1: every endpoint the app calls is already in production. The mobile app is the second consumer of the same APIs the web uses. |
| **Branding** | **1:1 with web** — navy `#000066`, amber `#FBAC34`, Raleway font, same hero imagery | Customer should feel they're in the same world; consistency builds trust. UI samples to be provided by Magnus. |
| **Scope (v1)** | **Money path + account** — browse, search, PDP, cart, checkout, order tracking, profile, Continental Rewards, push notifications, biometric login | Repeat-buyer-first. Admin + marketing + long-tail features stay on web. Don't try to mirror the whole web in v1. |
| **Build order** | **UI-first (mocked data) → API wiring** | Lets Magnus review look-and-feel against UI samples before any data plumbing risk. Same approach used for the web platform's Phase 3 → Phase 2 sequence (UI before API). |
| **Repo** | **Separate `afrizonemart-mobile` repo** (to be created) | Mirrors the established pattern (`afrizonemart-v2`, `afrizonemart-v2-supplier`, `afrizonemart-api`). Independent deploy pipeline, independent CI, independent versioning. This tracker stays in `afrizonemart-v2` for now because cross-tracker context lives here too. |

---

## Where we stand right now (2026-05-21)

**Just kicked off.** Decisions above are locked; nothing built yet.

**Awaiting from Magnus:** UI samples (screenshots / Figma / mockups for the 9-or-so core screens that define the look + flow — login, register, home/browse, search, PDP, cart, checkout shipping, checkout payment, order success, account dashboard).

**My next step on green-light:** bootstrap the Expo project, port brand tokens + Raleway font, build the design system primitives (Button, Card, Input, Heading), and stand up the navigation skeleton with placeholder screens. Then iterate against the UI samples one screen at a time.

---

## Phase plan

Phases roughly mirror the web platform's. Times below are calendar weeks assuming a small dedicated team — adjust if shared resources.

### Phase 0 — Project setup `[ ]`
**Goal:** A buildable Expo app on a developer's phone that displays "Hello world" branded with our navy + amber.

- [ ] Create `afrizonemart-mobile` GitHub repo (TypeScript Expo template)
- [ ] Configure ESLint + Prettier matching web repo's style
- [ ] Set up EAS Build (Expo's managed build service) for iOS + Android dev builds
- [ ] Add brand tokens (`theme/colors.ts`, `theme/spacing.ts`, `theme/typography.ts`) — pixel-matched to web
- [ ] Bundle Raleway font via `expo-font` (same family the web uses)
- [ ] Establish app icon + splash screen (matches web favicon + logo)
- [ ] `.env.example` with `EXPO_PUBLIC_API_URL` pointing at api.afrizonemart.com
- [ ] First Expo Go dev build runs on real iOS + Android device

**Definition of done:** The empty app starts up showing the Afrizonemart logo splash and a single navy screen with amber accent — on both an iOS and an Android phone.

---

### Phase 1 — Design system + navigation skeleton `[ ]`
**Goal:** A flat set of placeholder screens you can navigate between, all using the same primitives.

- [ ] **Design system primitives** in `src/components/ui/` — `Button`, `Input`, `Card`, `Heading`, `Text`, `Pill`, `Badge`. Same names + variants as the web's components, adapted for RN's `<Pressable>` + `StyleSheet`.
- [ ] **Navigation library** — React Navigation v7 (de facto standard for Expo). Bottom tab navigator for the four main destinations: Home, Search, Cart, Account.
- [ ] **Tab bar** styled to brand (navy background, amber active state, Raleway labels). Cart tab shows a badge with the item count.
- [ ] **Stack navigators** within each tab so PDP, order detail, etc. push on top.
- [ ] **Placeholder screens** for every Phase 2–4 destination — empty, brand-styled, just labeled.
- [ ] **Safe-area handling** site-wide (same pattern as web's `viewportFit='cover'` + `env(safe-area-inset-*)`).

**Definition of done:** Navigating between every tab + every nested screen works smoothly. Nothing has real data yet, but the shell feels real.

---

### Phase 2 — Browse + Search + PDP (UI, mocked data) `[ ]`
**Goal:** Customer can flick through the catalog feel on real devices, even though it's all hard-coded.

- [ ] Home screen — country marquee, featured shelves, category strips. Same visual rhythm as the web home page.
- [ ] Search screen — search bar, suggestions, results grid.
- [ ] Country directory (`/shop/countries` equivalent) — flag tiles.
- [ ] Product card — image, name, price, country chip, "Add to Cart" — matches the web's `ProductCardPlaceholder`.
- [ ] PDP — image gallery (swipe), title, price, bundle selector, variant chips, description, specifications, share button, wishlist heart.
- [ ] **Mock data layer** (`src/mocks/products.ts`) — 10–15 sample products mirroring real fields so Phase 4 wiring doesn't reshape components.

**Definition of done:** Browsing through 15 mock products from home → category → PDP feels like a real shopping app at 60fps on a mid-range Android.

---

### Phase 3 — Cart + Checkout (UI, mocked data) `[ ]`
**Goal:** Customer can do a full mock purchase end-to-end.

- [ ] Cart screen with line items, quantity steppers, remove, subtotal, coupon row.
- [ ] Checkout — Shipping screen with address form, saved-address picker, live shipping quote selector.
- [ ] Checkout — Payment screen with payment-method tiles, T&C checkbox, animated Pay button.
- [ ] Checkout — Success screen with order summary + share buttons + Continental Rewards earned.
- [ ] Mocked Squad redirect flow (web view that "succeeds" after a tap).

**Definition of done:** End-to-end mock purchase from PDP → cart → success in under 2 minutes on a real device, with no broken transitions.

---

### Phase 4 — Account + Auth (UI, mocked data) `[ ]`
**Goal:** Sign in, sign up, view profile, view orders.

- [ ] Login screen (email + password, Google sign-in placeholder).
- [ ] Register screen (with phone + country picker, marketing opt-in).
- [ ] Forgot password.
- [ ] Account dashboard — name, role, stats tiles (orders, wishlist, addresses, coins).
- [ ] Order history list + order detail.
- [ ] Profile edit, addresses, wishlist, Continental Rewards screen.

**Definition of done:** All 8 customer-facing account flows render correctly with mock data.

---

### Phase 5 — API wiring `[ ]`
**Goal:** Replace every mock data source with a live API call. App is now a real product.

The plan here mirrors the web's `lib/api/*` structure exactly — same endpoint URLs, same response shapes, same error handling.

- [ ] **Shared API client** — `src/lib/api/client.ts` with `apiFetch()` + `apiFetchAuthed()` (cookie + Bearer token, 401-refresh-retry dance — port from web).
- [ ] **Auth wiring** — `useAuthStore` (Zustand, like web). Login → store JWT → all subsequent calls authenticated. Refresh token in `expo-secure-store` (NOT AsyncStorage — refresh tokens are credentials).
- [ ] **Product reads** — `fetchProducts`, `fetchProduct`, `listCategories`. Use TanStack Query (`@tanstack/react-query`) like the web. Background refetch + stale-while-revalidate.
- [ ] **Cart sync** — `useCartStore` syncs to `/api/cart` for signed-in users; localStorage-equivalent (AsyncStorage) for anonymous.
- [ ] **Checkout** — `fetchShippingQuotes`, `placeOrder`, `initPayment`.
- [ ] **Orders** — `listOrders`, `getOrder`.
- [ ] **Account** — `getMe`, `updateMe`, `listAddresses`, `createAddress`.
- [ ] **Wishlist** — `countWishlist`, `addToWishlist`, `removeFromWishlist`.
- [ ] **Continental Rewards** — `getMyLoyalty`, `redeemCoins`.
- [ ] **Search** — `fetchProducts({ q })`.

**Definition of done:** `npm run smoke` equivalent for the app (a manual smoke checklist) passes against the production API.

---

### Phase 6 — Mobile-native unlocks `[ ]`
**Goal:** The reasons we built the app at all.

- [ ] **Push notifications** via Expo Push API (free, works on iOS + Android). Backend already has `Notification` model + Resend webhook intake — extend to support push tokens, send order-status updates + restock alerts + Continental Rewards prompts.
- [ ] **Biometric login** via `expo-local-authentication`. Face ID / Touch ID / Android fingerprint. Stores a refresh token in `expo-secure-store` keyed by biometric prompt.
- [ ] **Native share sheet** for share-as-image and link sharing — uses iOS/Android system share, much better than web fallback.
- [ ] **Deep linking** — `afrizonemart://product/<slug>` so push notifications can route to specific screens. Plus universal links so `https://afrizonemart.com/product/<slug>` opens the app if installed.
- [ ] **Offline-aware** product cache — last viewed products viewable offline.

**Definition of done:** Customer can be biometric-logged-in, receive a push when an order ships, tap it, and land directly on the order tracking screen.

---

### Phase 7 — Beta + store submission `[ ]`
**Goal:** App is in customers' hands.

- [ ] TestFlight build (iOS) — invite 10–20 testers from Magnus's network.
- [ ] Google Play Internal Testing track — same testers.
- [ ] Bug bash week with real users on real devices.
- [ ] App Store metadata (description, screenshots, keywords, age rating, privacy nutrition label).
- [ ] Google Play store listing.
- [ ] Apple developer account ($99/yr) + Google Play developer account ($25 one-time) provisioned.
- [ ] Submit to both stores. Apple review averages 1–2 days; Google is same-day.

**Definition of done:** App is downloadable from both stores under "Afrizonemart" by the public.

---

## Part A — 10 Engineering Principles (mobile-specific notes)

The same principles from `ARCHITECTURE_TRACKER.md` Part A apply to the mobile app, with mobile-specific application notes.

### 1. API-First Design `[x]` (inherited)
**Mobile note:** This is the whole reason an app is feasible in 2 months instead of 6. Every endpoint we need already exists. The mobile app is a thin client over our existing platform.

### 2. Feature Flags `[ ]`
**Mobile note:** The mobile app subscribes to the same `/api/feature-flags` registry the web does. Same `useFlag()` hook, ported to RN. **Critical for mobile** — store-review cycles mean we can't redeploy code instantly, so flag-driven kill-switches matter MORE on mobile than on web. We use them to roll out animated features gradually and disable any that misbehave on a specific OS version without waiting for Apple review.

### 3. Rules Engine `[x]` (inherited)
**Mobile note:** The same `/admin/business-rules` configures shipping thresholds, coupon limits, loyalty rates — all consumed by the app via API. No mobile-side rule logic.

### 4. Schema-Driven Design `[x]` (inherited)
**Mobile note:** The PDP renders custom fields dynamically (author/ISBN for books, ingredients for food) by reading `attributes` from the API. No app-side knowledge of book vs food fields needed.

### 5. Event-Driven Architecture `[x]` (server-side, inherited)
**Mobile note:** All events already fire server-side. Mobile triggers events via API calls; subscribers handle them. **One mobile-specific publisher to consider:** `app.opened` for engagement analytics — but that's TBD.

### 6. Separation of Concerns `[ ]`
**Mobile note:** Same three-layer pattern as web — `screens/` (UI), `lib/api/` (data fetching), `stores/` (client state). No business logic in screen components.

### 7. Domain-Driven Design `[ ]`
**Mobile note:** Folder names mirror web: `screens/{home, search, cart, checkout, account, product}/`, `lib/api/{products, orders, auth, ...}/`, `stores/{cartStore, authStore, checkoutStore}.ts`. A web developer can find the same file by feel.

### 8. Infrastructure as Code `[ ]`
**Mobile note:** `eas.json` (EAS Build profiles), `app.config.ts` (Expo app config — bundle ID, scheme, splash, icons, OTA channel) all in Git. Spinning up a new flavour (e.g. Afrizonemart Ghana with different default country) is a config flag.

### 9. Modular Architecture `[ ]`
**Mobile note:** Same modular pattern. Each domain's screens + API client + store is self-contained. Adding "Wallet" or "Live commerce" later is a new folder, not a refactor.

### 10. Observability by Default `[ ]`
**Mobile note:** Sentry React Native SDK on first launch. Every screen tagged. Crash reporting + breadcrumbs + session replay (where supported). Plus Expo's built-in analytics for adoption + retention.

---

## Part B — Mobile Build Rules (adaptation of web Build Rules)

### MB1. API-First (code level) `[ ]`
Build screens against the live API, not mocks-as-truth. Mocks are scaffolding; remove them as each screen wires up in Phase 5.

### MB2. TypeScript Everywhere `[ ]`
Strict mode. No `any`. Shared types with the API where possible (publish a typed client package from `afrizonemart-api` as a future improvement; for v1, copy the types).

### MB3. Component Architecture `[ ]`
Small focused screens. Each screen handles loading + error + empty. Screen components are presentational; data fetching via hooks.

### MB4. State Management `[ ]`
Same three-tier strategy: **Zustand** for global state (cart, checkout, auth) — same library web uses; **TanStack Query** for server data; **React's `useState`** for local screen state.

### MB5. Event-Driven Side Effects `[~]`
Server-side via existing event bus. Mobile-side, use the same pattern for in-app effects — e.g. a `cart.itemAdded` event triggers the cart-badge animation + haptic feedback, without coupling the components.

### MB6. UI From Samples `[ ]`
Match Magnus's UI samples pixel-for-pixel. Brand tokens already locked at navy `#000066` + amber `#FBAC34` + Raleway. **Same pixel-sampling discipline as web** — no guessed colours.

### MB7. Mobile-First (it IS mobile) `[x]` (inherited)
Tap targets ≥ 44pt. Safe-area-aware on every screen. Inputs 16pt+ to never trigger iOS zoom-on-focus (carried over from web foundation work).

### MB8. Error and Loading States `[ ]`
Every data-fetching surface handles loading + error + empty. Skeletons match the final shape. Pull-to-refresh on every list. Network failure shows a banner, not a blank screen.

### MB9. Environment Variables `[ ]`
`EXPO_PUBLIC_*` for client-side. Secrets (e.g. push notification credentials, Sentry DSN) injected via EAS Secrets at build time, never committed.

### MB10. Observability `[ ]`
Sentry RN SDK + Expo Insights from day one. Same Sentry project as web (separate DSN, same org) so cross-platform incidents correlate in one place.

---

## Decisions log (append-only)

- **2026-05-21** — Stack locked to React Native + Expo. Magnus confirmed.
- **2026-05-21** — Branding locked 1:1 with web (UI samples pending from Magnus).
- **2026-05-21** — v1 scope: money path + account. Admin/marketing/long-tail stay on web.
- **2026-05-21** — Build order: UI first (mocked), API wiring after. Phase 5 is the wiring milestone.
- **2026-05-21** — Repo strategy: separate `afrizonemart-mobile` repo (matches existing supplier/storefront/api split).

---

## Open questions (resolve as we go)

- **App store accounts** — does Afrizonemart already have an Apple developer account + Google Play developer account, or do we need to enrol? ($99/yr Apple, $25 one-time Google.)
- **Push notification provider** — Expo Push API (free, fine for most cases) vs OneSignal (richer analytics, costs $$). Default to Expo Push; revisit if we hit scale.
- **Sentry plan** — current Sentry is on free tier (5k events/mo). Mobile errors may push us over. Plan to either upgrade (Sentry Team ~$26/mo) or sample mobile events.
- **Backend changes needed** — `User.pushToken` field + push-send service module. Both are small additions; estimate ~1 day of API work added during Phase 6.
- **App name + bundle ID** — confirm "Afrizonemart" and `com.afrizonemart.app` (or similar) before Phase 0.
- **Privacy policy + terms** — Apple/Google require URLs to live versions. Web `/legal/privacy` + `/legal/terms` are placeholders today; need real copy before Phase 7.

---

## Risks (track + mitigate)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **App store review rejection** | Medium | 1–2 week delay | Follow Apple's checklist on first submission; have a contingency for any "guideline 4.x" rejection by polishing UX before submit |
| **Push notification deliverability** | Low | Low — fallback to email | Expo Push is reliable on iOS + Android; we have email as the established channel |
| **Refresh token security on device** | Medium | High if compromised | Use `expo-secure-store` (iOS Keychain / Android Keystore) NOT AsyncStorage |
| **Native module conflict** | Medium | Days of debugging | Stick to Expo's vetted SDK modules; avoid raw native modules in v1 unless absolutely necessary |
| **Slow JS bundle on cold start** | Medium | Customer churn | Hermes engine on; lazy-load non-critical routes; measure on a 3-year-old Android |
| **Currency / locale handling** | Medium | Wrong prices shown | Reuse the web's `lib/format.ts` + `lib/countries.ts` exactly — single source of truth for both surfaces |

---

## Cross-references

- `ARCHITECTURE_TRACKER.md` — the web platform tracker. Same principles, deeper history.
- `afrizonemart-api/src/modules/**/` — every endpoint the mobile app calls. No backend changes needed for Phases 1–5.
- `src/lib/api/**.ts` — the web's API client. Mobile's client will mirror this 1:1 for predictability.
- `src/lib/countries.ts`, `src/lib/format.ts` — reusable on mobile via direct copy or shared package (decide in Phase 0).
- `src/lib/permissions.ts` — only relevant if we ever add admin features to the app (not in v1).
