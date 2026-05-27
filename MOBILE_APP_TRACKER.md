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

### Phase 0 — Project setup `[~]`
**Goal:** A buildable Expo app on a developer's phone that displays "Hello world" branded with our navy + amber.

- [x] Create `afrizonemart-mobile` GitHub repo (TypeScript Expo template) — `github.com/magnusimam/afrizonemart-mobile`, private, default branch `main`. Bootstrapped via `npx create-expo-app blank-typescript` (Expo SDK 54). Commit `5c57c91`.
- [ ] Configure ESLint + Prettier matching web repo's style — deferred until after Phase 1; not blocking.
- [ ] Set up EAS Build (Expo's managed build service) for iOS + Android dev builds — needs interactive `eas init` from Magnus.
- [x] Add brand tokens (`theme/colors.ts`, `theme/spacing.ts`, `theme/typography.ts`) — pixel-matched to web. Commit `67a7e72`.
- [ ] Bundle Raleway font via `expo-font` — needs the font asset files; will use `@expo-google-fonts/raleway` in Phase 1.
- [ ] Establish app icon + splash screen (matches web favicon + logo) — needs Magnus to provide / approve artwork. Splash background already set to brand navy.
- [x] `.env.example` with `EXPO_PUBLIC_API_URL` pointing at api.afrizonemart.com — commit `67a7e72`.
- [ ] First Expo Go dev build runs on real iOS + Android device — Magnus to verify; the Phase-0 placeholder App.tsx renders brand navy + 3 swatches.

**Definition of done:** The empty app starts up showing the Afrizonemart logo splash and a single navy screen with amber accent — on both an iOS and an Android phone.

---

### Phase 1 — Design system + navigation skeleton + Home `[x]` (shipped 2026-05-21, PR magnusimam/afrizonemart-mobile#1)
**Goal:** A working Home screen on a real device with the design system primitives that everything else will reuse.

#### Locked design decisions from the UI samples review (2026-05-21)
- **4 archetypes** mapped to categories:
  - 🥤 **Grocery / Drinks** — soft amber-tint hero panel, pill stepper, inline price + quantity row
  - 🍷 **Wine / Spirits** — solid navy hero panel, vertical [+]/num/[-] stepper, size pills
  - 🛋 **Lifestyle / Furniture** — warm cream hero panel, 2-col pastel-tile grid, image carousel dots
  - 👕 **Fashion / Premium** — amber-to-cream gradient hero, thumbnail strip right, variant pills, two-CTA bottom (Add to Cart + Buy Now)
- **Bottom tab bar:** 4 tabs — Home · Search · Cart (with badge) · Account. Active tab gets a small text label.
- **Cart screen:** unified breakdown style across all archetypes (per archetype only flavors the add-to-cart toast).
- **No "by [Seller]"** attribution on cards. Brand info lives on the PDP.
- **Cutout product images** via the existing `/api/share-image/cutout/<slug>` pipeline — shared R2 cache between web and mobile (web's existing cutouts work for mobile day-1; mobile-triggered cutouts work for web's share-as-image).

#### Sub-steps
- [x] **Install nav + safe-area + icons deps** via `npx expo install` (fc974d4): `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`, `react-native-svg`, `@expo/vector-icons`, `@expo-google-fonts/raleway`, `expo-font`.
- [x] **Bundle Raleway via @expo-google-fonts/raleway** (fc974d4) — `App.tsx` gates rendering on `useFonts({ Raleway_400Regular, _500Medium, _600SemiBold, _700Bold, _800ExtraBold })`. `typography.ts` exposes `fontFamilies` mapping weight keys to the loaded family names. `app.json` declares the `expo-font` plugin.
- [x] **Design system primitives** in `src/components/ui/` (fc974d4):
  - `Text.tsx` — body wrapper, size + weight + color props, uppercase shorthand
  - `Heading.tsx` — h1/h2/h3 with level → size + weight defaults
  - `Card.tsx` — rounded container, padding + surface variants (white/navy/amber/cream)
  - `Pill.tsx` — primary / accent / outline / ghost; default + compact sizes; leading + trailing slots
  - `Badge.tsx` — amber counter circle, auto-hides at count ≤ 0
  - `IconButton.tsx` — 44pt tap-target wrapper, plain / chip / navy variants
- [x] **Navigation skeleton** in `src/navigation/` (fc974d4):
  - `AppNavigator.tsx` — root NavigationContainer with brand-coloured theme so RN-Nav's grey defaults don't flash on cold start
  - `BottomTabs.tsx` — 4-tab navigator (Home / Search / Cart / Account). Inactive tabs icon-only; active tab gets a label + filled icon. Respects safe-area bottom inset.
- [x] **Placeholder screens** for Search, Cart, Account (fc974d4) — branded amber icon + heading + "Phase X coming" copy, ready to be replaced.
- [x] **Home screen** at `src/screens/home/HomeScreen.tsx` (fc974d4) with all six sections:
  - Header bar — avatar / wordmark / cart-with-badge
  - Greeting — "Habari, Magnus 👋" + tagline
  - Search row — input + navy Filter pill (Image 6 pattern)
  - Category chip row — 9 circular Ionicons category chips
  - "Most popular" featured shelf — 5 large amber-tile product cards with real cutout imagery + price + small navy add-to-bag icon
  - "Shop by country" marquee — 10 flag tiles
- [x] **Mock data** in `src/mocks/` (fc974d4):
  - `products.ts` — 5 products with real cutout URLs from production R2 cache
  - `categories.ts` — 9 top-level categories (For Her, For Him, Groceries, Beauty, Wines, Decor, Electronics, Books, Art)
  - `countries.ts` — 10 featured countries with flagcdn URLs
- [x] **Safe-area handling** (fc974d4) — `SafeAreaProvider` at the root, `useSafeAreaInsets` consumed by HomeScreen + BottomTabs + every placeholder screen.

**Definition of done:** Magnus opens Expo Go on his phone, scans the QR, sees a real-feeling Home screen with branded header, category chips, a horizontally-scrolling product shelf with cutout images, and a working bottom tab bar — even though tapping a product card or another tab routes to a placeholder.

---

### Phase 2 — Browse + Search + PDP (UI, mocked data) `[~]` (in progress 2026-05-21)
**Goal:** Customer can flick through the catalog feel on real devices, even though it's all hard-coded.

- [ ] Search screen — search bar, suggestions, results grid (same `ProductCard` primitive as Home).
- [ ] Country directory (`/shop/countries` equivalent) — flag tiles.
- [ ] Shop / category landing — 2-col grid using the appropriate archetype's `ProductCard` variant.
- [x] **PDP — Fashion archetype** (PR magnusimam/afrizonemart-mobile#3, commit 79ae854) — amber→cream→page `LinearGradient` hero (`expo-linear-gradient`), `PdpThumbnailStrip` vertical strip on the right edge of the hero, `QuantityStepperInline` `[○−] 01 [○+]` next to product name, `FashionPdpFooter` with two CTAs side-by-side (Add to Cart navy outline + Buy Now solid amber). 2 mock products added (African Black Soap, Things Fall Apart).
- [x] **PDP — Grocery archetype** (PR magnusimam/afrizonemart-mobile#2, commit e4062de) — soft amber-tint hero panel (`#FEEEDA`), floating wishlist heart bridging hero + content card (Image 1 detail), inline `QuantityStepperPill`, `BundlePicker` variant row (1 Pack / 3 Pack / Carton with savings tags on discounted bundles), sticky `GroceryPdpFooter` with running subtotal + full-width "Add to Bag" navy CTA.
- [ ] **PDP — Wine archetype** (covers Beer, Wines & Spirit) — solid navy hero, vertical stepper beside hero, size pills.
- [ ] **PDP — Lifestyle archetype** (covers Interior Decor, Art & Collectibles, Home Essentials, Automobile) — warm cream hero, image carousel dots, rating + review count, full-width amber Checkout.
- [ ] **Archetype-aware `ProductCard`** that consumes `categoryArchetype(category.slug)` and picks the right tile colour / layout.
- [x] **Live API wired into Home + PDP** (PR magnusimam/afrizonemart-mobile#4, commit fbf6b9b, 2026-05-21) — mock catalog deleted (was misleading; *Things Fall Apart* under Fashion was never a real product). Home shelf fetches `{ limit: 12, inStock: true, sort: 'featured' }` from `api.afrizonemart.com` with spinner / retry / empty states; PDP fetches by slug with 404-vs-network branching. New `src/lib/api.ts` + `api-types.ts` + `productAdapter.ts` + `useProducts.ts` hooks; `ApiProduct → PdpProduct` adapter decouples layout components from API shape. Phase 5 API wiring effectively partly-done — read-only product paths are now production-wired. Auth + cart + addresses still mock-or-stub.
- [x] **Hero slider** (PR magnusimam/afrizonemart-mobile#6, commit 2cfa82a, 2026-05-21) — full-bleed 16:9 banner at top of Home reading `content.home.hero.slides` from `/api/content`. Same admin content key the web hero uses, so editing slides in `/admin/content` lands on both apps. Auto-rotates 5s, dot indicators with animated active-pill, pause-on-touch. Empty → renders null. New `src/lib/siteContent.ts` + `useSiteContent.ts` mirror the storefront's reader pattern.
- [x] **Admin shelves + live categories + transparent cutouts on Home** (PR magnusimam/afrizonemart-mobile#5, commit 5a2fd41, 2026-05-21) — Home now renders 5 `/api/shelves/<key>` rows (`shelf_groceries`, `homepage_featured`, `staff_picks`, `shelf_for_her`, `shelf_books`) — same placement keys as web home. Adding a shelf to mobile = adding its key to `HOME_SHELVES`; admin owns title/products/enabled. New `CategoryChipRow` reads `/api/categories` (admin-created categories surface automatically). Ported `src/lib/countries.ts` from storefront (canonical 54 + `FEATURED_COUNTRY_CODES`). `src/mocks/` dir deleted. New `CutoutImage` component routes every product image through `/api/share-image/cutout/<slug>` with R2-cached PNG (web + mobile share the cache). **MB11 rule formalised in this tracker** — transparent cutouts mandatory on mobile because every surface is coloured.
- [x] **Archetype router** — `src/lib/categoryArchetype.ts` maps category slug → archetype key. Single source of truth (e4062de).
- [x] **Stack navigation** — native-stack on top of bottom tabs so PDP pushes over and hides the tab bar (e4062de).
- [x] **Home → PDP wiring** — product card press uses `navigation.navigate('Product', { slug })` with typed route params (e4062de).

**Definition of done:** Browsing through 4 product types from home → PDP feels distinct per archetype but unmistakably the same app.

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

### Phase 4 — Account + Auth `[~]`
**Goal:** Sign in, sign up, view profile, view orders. Real API from day one (we skipped the "mock then wire" step — auth is one of the few flows you can't usefully mock).

**PR 4.1 — Auth foundation + Login/Register screens** `[x]` (2026-05-21)
- [x] `expo-secure-store` installed (kept in deps for biometric refresh-token work in Phase 6).
- [x] Real `useAuthStore` — Zustand + AsyncStorage persist for `{ user, token }`. Refresh token lives in the API's `azm_refresh` httpOnly cookie (RN's fetch persists it via `credentials: 'include'`).
- [x] `src/lib/api-base.ts` — shared API_BASE + ApiError, broken out so `api.ts` and `authStore.ts` can both import it without a circular dep.
- [x] `apiAuthedGet` / `apiAuthedPost` / `apiAuthedPatch` — refresh-on-401-and-retry handled in the client (runtime import of authStore inside the 401 branch).
- [x] LoginScreen + RegisterScreen — full validation, friendly error states per API error code (RATE_LIMITED, INVALID_CREDENTIALS, ACCOUNT_LOCKED, EMAIL_IN_USE, WEAK_PASSWORD).
- [x] AccountScreen rewritten — signed-out view (Sign in / Create account CTAs + benefit list) and signed-in view (identity card + menu rows + sign-out).
- [x] CheckoutPayment AuthRequiredOverlay now routes to Login with `redirectAfterLogin: 'checkout'` instead of the Phase-3 "coming soon" stub.

**PR 4.3 — Account dashboard + Orders + Profile edit** `[x]` (2026-05-21)
- [x] `src/lib/api.ts` — `fetchMyOrders` / `fetchMyOrder` / `fetchMyLoyalty` / `fetchWishlistCount` helpers.
- [x] `src/lib/api-types.ts` — `ApiUserOrder` / `ApiUserOrderItem` / `ApiOrderStatus` / `ApiLoyaltyResponse`.
- [x] OrderHistoryScreen — list with status pills, 3-thumb preview, pull-to-refresh, empty + error states.
- [x] OrderDetailScreen — Placed→Paid→Shipped→Delivered timeline strip, items list, money breakdown (subtotal/coupon/coin/delivery/refund/total), ship-to + payment cards.
- [x] ProfileEditScreen — name + phone (E.164 mirror) + birthday + marketing/sms opt-ins; sticky Save CTA; password row stubs to ComingSoon (PR 4.2).
- [x] AccountScreen — 3 dashboard counter tiles (Orders / Wishlist / Coins). Menu rows wired: My orders → OrderHistory, Edit profile → ProfileEdit. Wishlist + Addresses + Rewards menu rows still ComingSoon (PR 4.4 / 4.5).

**PR 4.4 — Wishlist + heart toggles** `[x]` (2026-05-21, stacked on 4.3)
- [x] `src/lib/api.ts` — fetchWishlist + addToWishlist + removeFromWishlist + new apiAuthedDelete helper.
- [x] `src/lib/api-types.ts` — ApiWishlistEntry + ApiWishlistProduct + ApiWishlistListResponse.
- [x] `src/stores/wishlistStore.ts` — Zustand cache (ids Set + entries[]). Optimistic toggle with roll-back; pendingIds gate.
- [x] App.tsx hydrates on sign-in, clears on sign-out.
- [x] HeartToggle component — pop-on-tap animation, sign-in Alert for guests, card + hero sizes.
- [x] Wired into SearchResultCard, ProductShelfRow, ProductDetailScreen (all 4 archetypes via existing wished/onWishlistToggle props).
- [x] WishlistScreen — 2-col grid, pull-to-refresh, signed-out / empty / error states.
- [x] AccountScreen wishlist tile + menu row now route to /Wishlist. Tile counter reads live store size so PDP toggles reflect immediately.

**PR 4.2 — Forgot / Reset password** `[x]` (2026-05-22)
- [x] `src/lib/api.ts` — `requestPasswordReset(email)` + `resetPassword(token, password)` public POST helpers (no auth).
- [x] ForgotPasswordScreen — email field, anti-enumeration confirmation copy ("If an account exists for X, we've sent a reset link"). Rate-limit friendly error.
- [x] ResetPasswordScreen — token from route param (deep link), password rule mirror (8/digit/upper/symbol), confirm-password match check, success → replace to Login.
- [x] React Navigation `linking` config — `afrizonemart://reset-password?token=...` + `https://afrizonemart.com/reset-password?token=...` both resolve to ResetPassword.
- [x] iOS `associatedDomains` + Android `intentFilters` (autoVerify) set in app.json. Universal links activate once AASA + assetlinks.json are hosted on afrizonemart.com.
- [x] LoginScreen "Forgot password?" link → ForgotPassword (was a ComingSoon stub).

**PR 4.5 — Continental Rewards full screen** `[x]` (2026-05-24)
- [x] `src/lib/api-types.ts` — corrected `ApiLoyaltyResponse` (transactions use `type`/`delta`, not `kind`/`coins`) + full `ApiLoyaltyConfig` + `ApiLoyaltyTier` / `ApiLoyaltyTxnType` unions + `ApiLoyaltyTransaction`.
- [x] `src/lib/loyalty.ts` — tier labels/colours/thresholds, per-tier earn rate + birthday bonus, txn label/icon mapping, compact NGN formatter.
- [x] ContinentalRewardsScreen — balance hero (tier-coloured), expiring-coins banner, progress-to-next-tier bar, tier ladder, perks ladder, coin-activity ledger, how-it-works; plus not-enrolled teaser + signed-out + error states. Display-only (redeem is checkout-only, enrollment is auto on first paid order).
- [x] Wired: Account Coins tile + Continental Rewards menu row + Home drawer `continentalRewards` action → ContinentalRewards screen.

**PR 4.6 — Saved addresses** `[x]` (2026-05-25)
- [x] `src/lib/api.ts` — fetchAddresses / createAddress / updateAddress / deleteAddress + `ApiSavedAddress`/`ApiAddressInput` types.
- [x] AddressBookScreen — list (default-first), default badge, set-default, edit, delete, add CTA; refetch-on-focus.
- [x] AddressEditScreen — add/edit form, E.164 phone validation, CountryPickerModal reuse, set-default toggle.
- [x] AccountScreen "Saved addresses" row → AddressBook (was ComingSoon).
- [x] CheckoutShipping — "Use a saved address" chip row prefills contact + address for signed-in users.

**Still queued for Phase 4:**
- [ ] PR 4.7 (deferred) — Google sign-in (needs OAuth client IDs) + Phone OTP (needs SMS provider).

**Definition of done:** All 8 customer-facing account flows render correctly against the live API.

---

### Phase 5 — polish + infra `[~]`

**Currency / FX display** `[x]` (2026-05-25)
- [x] `fetchFxRates` (`GET /api/fx/rates`) + `ApiFxSnapshot` (NGN base, display-only).
- [x] `useCurrencyStore` (Zustand persist) — selected currency (default NGN, persisted) + in-memory FX rates loaded on app boot.
- [x] `formatPrice` + `useFormatPrice` — NGN→display conversion via Intl, NGN fallback when rates absent / target is NGN.
- [x] `CurrencyPickerModal` + Account "Display currency" row (signed-in + out).
- [x] Wired every price label: SearchResultCard, ProductShelfRow, all 4 PDP layouts + Grocery/Wine/Lifestyle footers, CartLineItemRow, CartScreen, CheckoutPayment/Shipping/Success, OrderHistory, OrderDetail.
- [x] Continental Rewards left in NGN by design (Naira-denominated loyalty program).

**Pull-to-refresh on every list** `[x]` (2026-05-25)
- [x] RefreshControl on Browse / Category / Country (Home, Wishlist, Order History already had it). Full-screen loader gated to initial load; pull-over-data shows the inline spinner. Search (query-driven) + Countries directory (static) skipped by design.

**API status banner** `[x]` (2026-05-25)
- [x] `src/components/ApiStatusBanner.tsx` — polls /api/health (120s healthy / 30s degraded), 2-fail threshold, "back online" recovery, AppState-paused, 5s probe timeout. Root overlay in App.tsx. Gated by `useFlag('api_status_banner', true)` (added to KNOWN_MOBILE_FLAGS; already in API registry).

**Add-to-cart snackbar (event-bus payoff)** `[x]` (2026-05-25)
- [x] toastStore + Toast root overlay; cartActions (quickAddCard + notifyAddedToCart). PDP Add-to-Cart toasts + stays on page (was force-nav to Cart); Buy Now / lifestyle Checkout → CheckoutShipping. Home shelf-card add button wired (was a no-op). Cart badge already reactive.

**Pro-level UI/UX audit implementation** `[x]` (2026-05-25) — 7 PRs (mobile #43–#47 + design-system #43)

Acted on a full design audit of every customer surface. Shipped in order:

- [x] **DS hardening** (mobile #43) — `shadows.ts` (sm/md/lg/bar elevation tokens), `motion.ts` (durations + press feedback), `lineHeights`/`letterSpacing` typography tokens, grey ramp + `amberTile`/`successSurface`/`dangerSurface` colour tokens. Card/IconButton adopt them.
- [x] **Product card redesign** (mobile #44) — `RatingRow` + `DiscountBadge` shared primitives. Cards now show a `-N%` badge, star rating, struck compare price. Grid + secondary shelves moved to **white cards** (hairline + `shadows.sm`); amber kept only for the `homepage_featured` "featured" shelf variant. No API change — the public shelf endpoint already returns rating/reviewCount/comparePrice; the mobile `ApiShelfItem` type just surfaced them.
- [x] **PDP trust block + unified stepper** (mobile #45) — `PdpTrustBlock` (in-stock pill, prominent rating, honest chips: Authentic / Secure checkout / Ships across Africa — no returns/free-shipping claims) on all 4 archetypes. Three steppers collapsed into one `QuantityStepper` with a `variant` prop (shapes preserved, logic unified). `inStock` surfaced on `PdpProduct`.
- [x] **Checkout review step + progress indicator** (mobile #46) — new `CheckoutReview` screen (items + address + delivery confirm with Edit links) between Shipping and Payment. Shared `CheckoutProgress` (Shipping → Review → Payment) on all 3 steps; dropped redundant "Step N of 3" subtitles.
- [x] **Account dedup + honest cart total** (mobile #47) — removed the Orders/Wishlist/Rewards menu rows that duplicated the counter tiles (tiles stay as the single count surface). Cart footer "Total" → "Estimated total" + "Delivery added at checkout" caption (was reading as free shipping).
- [x] **Photo-forward card redesign** (mobile #48) — killed the cream tile (it exposed the catalog's mixed imagery). New unified `ProductCard` for every list surface: `cardImageFit` picks cover (apparel/décor/eleganza, edge-to-edge) vs contain-on-white (packaged goods/books); `ProductCardImage` adds skeleton + placeholder + cover scrim; solid discount badge + glassy heart + **origin flag-chip** signature + hero price. `PdpCardProduct` gained brand/categorySlug/originCountry. **Unique/hero card still pending Magnus' design.**
- [x] **Card native polish** (mobile #49) — shipped the deferred deps (managed project → Expo Go bundles them). **expo-image** backs CutoutImage + cover card images (memory-disk cache + 220ms cross-fade; `resizeMode`→`contentFit` across 6 callers). **expo-blur** via new `GlassView` (real glass iOS / translucent Android, no fork) → HeartToggle `surface="glass"` on cards. **expo-haptics** light impact on add-to-cart + heart tap. Custom dev builds need one `eas build`; Expo Go just works.

**Still queued (Phase 5):** TanStack Query swap (invisible infra; do when caching benefits are wanted).

---

### Phase 5 (orig) — API wiring `[ ]`
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

### MB11. Transparent Product Imagery `[x]`
**Every product image on mobile renders through the cutout pipeline.** The amber-tint hero panels, gradient Fashion panels, and tinted shelf cards all rely on the product cutting out cleanly against the surface — raw images with stock-photo backgrounds break the visual system instantly.

**The rule:**
- Product images on mobile MUST go through `CutoutImage` (`src/components/CutoutImage.tsx`) which lazy-fetches `${API_BASE}/api/share-image/cutout/<slug>` and swaps the source as soon as the bg-removed PNG is ready. Raw `images[0]` is the first-paint fallback so the card never flashes empty.
- This **differs from the web** — the storefront's `PlacementOrFallbackGrid` renders `images[0]` directly because card backgrounds are white and cutting out adds latency for no visual win. On mobile, every product surface is coloured (amber tile / gradient / soft cream / navy panel), so the cutout is structural, not decorative.
- The cutout endpoint already caches in R2 keyed by `SHA256(imageUrl)` (audit 2026-05-19). Web and mobile share the same cache: a cutout generated by either platform is reused by both.
- One `Map<slug, url>` cache lives in `src/lib/cutout.ts` so a cutout fetched on the home shelf is reused on the PDP hero + thumbnail strip + cart — no double-fetch.
- The provider may report `isOriginal: true` (background-removal failed for that image); the component still renders, just without transparency. Don't error on that — it's the graceful-degradation path.

**Surfaces covered:** Home shelf cards, Grocery PDP hero, Fashion PDP hero + thumbnail strip, Wine/Lifestyle heroes (when those archetypes ship). Anywhere a product image touches a coloured surface.

---

## Decisions log (append-only)

- **2026-05-21** — Stack locked to React Native + Expo. Magnus confirmed.
- **2026-05-21** — Branding locked 1:1 with web (UI samples pending from Magnus).
- **2026-05-21** — v1 scope: money path + account. Admin/marketing/long-tail stay on web.
- **2026-05-21** — Build order: UI first (mocked), API wiring after. Phase 5 is the wiring milestone.
- **2026-05-21** — Repo strategy: separate `afrizonemart-mobile` repo (matches existing supplier/storefront/api split).
- **2026-05-21** — Image rule MB11: all product imagery on mobile routes through `/api/share-image/cutout/<slug>`. Differs from web intentionally — coloured archetype surfaces require transparent cutouts.

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

## Comprehensive wiring audit (2026-05-21)

Source-of-truth list of every customer-facing API endpoint the mobile app needs, and every UI screen still to build. **Anything not in this audit is out of scope for v1.**

### A. API endpoints — wire status

Generated from `afrizonemart-api/src/server.ts` route mounting + per-module `routes.ts`. Admin-only modules excluded.

| Module | Path | Status | Mobile file when wired |
|---|---|---|---|
| **Products** | `GET /api/products`, `GET /api/products/:slug` | ✅ wired (PR #4) | `src/lib/api.ts` |
| **Categories** | `GET /api/categories` | ✅ wired (PR #5) | `src/lib/api.ts` |
| **Shelves** | `GET /api/shelves/:key?country=` | ✅ wired (PR #5) | `src/lib/api.ts` |
| **Share-image cutout** | `GET /api/share-image/cutout/:slug` | ✅ wired (PR #5) | `src/lib/cutout.ts` |
| **Site content** | `GET /api/content` | ✅ wired (PR #6) | `src/lib/siteContent.ts` |
| **Auth — email** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, `PATCH /api/auth/me` | ❌ pending | `src/lib/api/auth.ts` + Zustand store |
| **Auth — password reset** | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | ❌ pending | same |
| **Auth — Google** | `POST /api/auth/google/challenge`, `POST /api/auth/google` | ❌ pending | + `expo-auth-session` |
| **Auth — phone OTP** | `POST /api/auth/phone/start`, `POST /api/auth/phone/verify` | ❌ pending | same |
| **Cart** | `GET /api/cart`, `PUT /api/cart`, `DELETE /api/cart`, `POST /api/cart/coupon`, `DELETE /api/cart/coupon` | ❌ pending | `src/lib/api/cart.ts` + Zustand store |
| **Wishlist** | `GET /api/wishlist`, `GET /api/wishlist/count`, `POST /api/wishlist`, `DELETE /api/wishlist/:id` | ❌ pending | `src/lib/api/wishlist.ts` |
| **Addresses** | `GET /api/addresses`, `POST /api/addresses`, `PATCH /api/addresses/:id`, `DELETE /api/addresses/:id` | ❌ pending | `src/lib/api/addresses.ts` |
| **Orders** | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id` | ❌ pending | `src/lib/api/orders.ts` |
| **Shipping** | `GET /api/shipping/rates`, `POST /api/shipping/quote` | ❌ pending | `src/lib/api/shipping.ts` |
| **Payments** | `GET /api/payments/gateways`, `POST /api/payments/init`, `GET /api/payments/verify/:ref`, `POST /api/payments/check-order/:ref` | ❌ pending | `src/lib/api/payments.ts` + WebView |
| **Payment methods** | `GET /api/payment-methods` | ❌ pending | `src/lib/api/paymentMethods.ts` |
| **Loyalty** | `GET /api/loyalty/me`, `GET /api/loyalty/referral-summary`, `GET /api/loyalty/referral-coupon` | ❌ pending | `src/lib/api/loyalty.ts` |
| **Reviews** (read) | `GET /api/products/:slug` includes reviews | ✅ already returned | — |
| **Reviews** (write) | `POST /api/reviews` (if module exists) | ❌ verify + wire | `src/lib/api/reviews.ts` |
| **Coupons** (validate) | inside cart endpoint | ✅ via cart | — |
| **Pages (CMS)** | `GET /api/pages`, `GET /api/pages/:slug` | ❌ pending (legal/privacy/terms) | `src/lib/api/pages.ts` |
| **Blog** | `GET /api/blog`, `GET /api/blog/tags`, `GET /api/blog/:slug` | optional v2 | — |
| **FX rates** | `GET /api/fx/rates` | ❌ pending (origin-currency display) | `src/lib/api/fx.ts` |
| **Feature flags** | `GET /api/flags?keys=` | ❌ pending — critical for kill-switches | `src/lib/flags.ts` |
| **Custom fields** | `GET /api/custom-fields/:scope` | ❌ pending (book/electronics specs) | `src/lib/api/customFields.ts` |
| **Marketing unsubscribe** | `POST /api/marketing/unsubscribe` | skip — handled via deep-link to web page | — |
| **Resend webhook** | `POST /api/notifications/webhooks/resend` | skip — server-side only | — |
| **Health** | `GET /api/health` | ❌ pending (ApiStatusBanner) | `src/components/ApiStatusBanner.tsx` |

### B. UI screens — build status

| Screen | Status | Phase |
|---|---|---|
| Home (hero + categories + shelves + countries) | ✅ done | 1–2 |
| PDP — Grocery archetype | ✅ done | 2 |
| PDP — Fashion archetype | ✅ done | 2 |
| PDP — Wine archetype | ❌ pending | 2 |
| PDP — Lifestyle archetype | ❌ pending | 2 |
| Search (input → results grid) | ❌ pending | 2 |
| Shop / category landing | ❌ pending | 2 |
| Country landing (`/shop/country/:slug`) | ❌ pending | 2 |
| Cart screen (line items, qty, coupon, subtotal) | ❌ pending | 3 |
| Checkout — Shipping (address picker + quote) | ❌ pending | 3 |
| Checkout — Payment (method picker + Squad WebView) | ❌ pending | 3 |
| Checkout — Success (order summary + rewards earned) | ❌ pending | 3 |
| Login | ❌ pending | 4 |
| Register (email + phone + country) | ❌ pending | 4 |
| Forgot / Reset password | ❌ pending | 4 |
| Google sign-in flow | ❌ pending | 4 |
| Phone OTP flow | ❌ pending | 4 |
| Account dashboard (counters: orders / wishlist / addresses / coins) | ❌ pending | 4 |
| Order history list | ❌ pending | 4 |
| Order detail | ❌ pending | 4 |
| Profile edit | ❌ pending | 4 |
| Addresses (list + add + edit + default) | ❌ pending | 4 |
| Wishlist screen | ❌ pending | 4 |
| Continental Rewards screen | ❌ pending | 4 |
| Notifications inbox | ❌ pending | 6 |
| Settings (marketing opt-in, currency, language) | ❌ pending | 4 |
| Help / Support | ❌ pending | 4 |
| Legal / Privacy / Terms (CMS pages) | ❌ pending | 7 (App Store requires) |
| Maintenance / app-update-required screen | ❌ pending | 6 |

### C. Architecture rule status

Mobile-specific build rules (MB1-MB11 above). What each needs to graduate from `[ ]` → `[x]`:

| Rule | Status | What's missing |
|---|---|---|
| MB1 API-First | `[~]` | Product/category/shelf/content done. Auth + cart + orders + payments still mock-or-stub. |
| MB2 TypeScript Everywhere | `[~]` | Strict mode on, no `any`. Want a shared types package with API (defer to Phase 6). |
| MB3 Component Architecture | `[~]` | Home + PDP done. Cart/checkout/auth screens not yet built. |
| MB4 State Management | `[ ]` | **Zustand** for cart + auth stores not added. **React Query** not added — currently useState+AbortController. Promote in Phase 5 alongside auth wiring. |
| MB5 Event-Driven Side Effects | `[ ]` | No in-app event bus yet. Add when cart wires up (`cart.itemAdded` → badge bump + haptic). |
| MB6 UI From Samples | `[~]` | Home + Grocery + Fashion archetypes match samples. Wine + Lifestyle pending. |
| MB7 Mobile-First | `[x]` | 44pt taps, 16pt input floor, safe-area aware. Maintain on every new screen. |
| MB8 Error and Loading States | `[~]` | Every existing list handles loading/error/empty. Pull-to-refresh **not** added yet — needed on Home, shelves, lists. |
| MB9 Environment Variables | `[~]` | `EXPO_PUBLIC_API_URL` works. **EAS Secrets** not configured for Sentry DSN / Google client ID / push credentials. Phase 6. |
| MB10 Observability | `[ ]` | Sentry RN SDK + Expo Insights not added. Phase 6. |
| MB11 Transparent Imagery | `[x]` | CutoutImage applied to all coloured surfaces. Maintain on new archetype heroes. |

---

## Scalable patterns — move from code to admin

The platform is API-first; the mobile app should follow suit. **Anything that might change without an app update should live in the admin, not in code.** Below are the eight patterns that pay back the most.

### S1. Dynamic Home layout (admin-controlled section order) `[ ]`
**Today:** `HOME_SHELVES` is a hard-coded array in `src/screens/home/HomeScreen.tsx`. Adding / reordering / removing a section requires an app release.

**Recommendation:** Add a `mobile.home.layout` content key in `/admin/content`:
```json
[
  { "type": "hero" },
  { "type": "categories" },
  { "type": "shelf", "key": "shelf_groceries" },
  { "type": "promo_spot", "imageKey": "content.home.spot_1.image", "link": "/shop/beauty" },
  { "type": "shelf", "key": "homepage_featured" },
  { "type": "countries" }
]
```
Mobile renders the sections in order. Admin drags rows in the page builder to reorder. **Win:** rearrange Home, run a seasonal campaign, hide a section — all from admin, no deploy.

### S2. Category → archetype mapping on the Category model `[ ]`
**Today:** `ARCHETYPE_BY_CATEGORY` is a hard-coded Record in `src/lib/categoryArchetype.ts`. New categories default to `'fashion'` until a code change.

**Recommendation:** Add `archetype` enum field on the Prisma `Category` model (`grocery|wine|lifestyle|fashion`). Admin picks it when creating/editing a category. `/api/categories` returns it. Mobile reads it from the API response, no slug map needed. **Win:** new admin category gets correct PDP visual treatment day one.

### S3. Mobile feature flags via existing `/api/flags` `[ ]`
**Today:** No feature flag plumbing on mobile. Web already has `useFlag()` + registry + admin override UI.

**Recommendation:** Port `useFlag()` to mobile. Wire to `GET /api/flags?keys=mobile.*` on app launch. Register mobile-specific flags (`mobile.show_hero`, `mobile.show_countries`, `mobile.animations.cart`, `mobile.payment.crypto`). **Win:** emergency kill-switches for any mobile feature without redeploying the app. Critical for OTA-resistant breakage.

### S4. Min-supported-version gate `[ ]`
**Today:** No version check. A user on an old broken build will keep hitting it forever.

**Recommendation:** Content key `mobile.min_supported_version`. On every launch, mobile compares its Expo `runtimeVersion` to the value. If older → show full-screen "Please update" with App Store / Play Store deep link, block app use. **Win:** force-upgrade after a critical bugfix; clean way out of a Sentry-spike pattern.

### S5. Maintenance-mode banner `[ ]`
**Today:** No maintenance toggle. A DB migration would 500 every customer until done.

**Recommendation:** Content keys `app.maintenance.enabled` + `app.maintenance.message`. Mobile checks on launch + every API timeout. If enabled → show maintenance screen with admin-controlled copy. Web should do the same. **Win:** smooth window for DB migrations or third-party outages.

### S6. App-wide sticky banner (announcements / promos) `[ ]`
**Today:** No top-of-app messaging.

**Recommendation:** Content keys `mobile.banner.text` + `mobile.banner.action_url` + `mobile.banner.dismissable`. Top-of-app sticky bar (1 line). Tap routes to a product / category / external URL. **Win:** marketing announcements ("Free delivery in Lagos this week!"), without an app update.

### S7. Promotional spots inside Home layout `[ ]`
**Today:** Hero is the only admin-controlled imagery on Home.

**Recommendation:** Add `promo_spot` section type in S1's layout schema. Each spot reads its image + link from a content key (`content.home.spot_1.image`, `.link`). Drop into the layout between shelves. **Win:** seasonal campaigns ("Eid Sale 30% off Beauty") drop in without engineering.

### S8. Push notification topic preferences `[ ]`
**Today:** Push not wired (Phase 6).

**Recommendation:** When Phase 6 lands, expose topic toggles in `/admin/notifications` and let users opt in/out via `Settings`. Topics like `order_updates`, `price_drops`, `new_arrivals_by_country`, `loyalty_milestones`. Admin defines topics; mobile renders the checklist. **Win:** marketing can target without engineering.

---

## Phase-aligned build order

Following the audit, the remaining work compresses into:

- **Phase 2 finish** — Wine PDP + Lifestyle PDP + Search + Shop/category + Country landing. **No new APIs needed.**
- **Phase 3** — Cart + Checkout. Wires: `/api/cart`, `/api/shipping`, `/api/payments`, `/api/payment-methods`. New Zustand `useCartStore`. Squad WebView wrapper.
- **Phase 4** — Auth + Account. Wires: `/api/auth/*`, `/api/auth/me`, `/api/orders`, `/api/wishlist`, `/api/addresses`, `/api/loyalty`. New Zustand `useAuthStore` + secure-store refresh token.
- **Phase 4.5** (NEW) — Scalable patterns S1-S3. Dynamic home layout, archetype on category, mobile feature flags. **One-time investment, pays back every subsequent feature.**
- **Phase 5** — TanStack Query swap (replace useState bodies in existing hooks), event bus (`useEventBus`), ApiStatusBanner, pull-to-refresh on every list, FX/currency display.
- **Phase 6** — Push notifications, biometrics, Sentry RN SDK, Expo Insights, min-supported-version gate (S4), maintenance mode (S5), CMS pages (legal/privacy/terms).
- **Phase 7** — App Store + Play Store submission.

---

## Cross-references

- `ARCHITECTURE_TRACKER.md` — the web platform tracker. Same principles, deeper history.
- `afrizonemart-api/src/modules/**/` — every endpoint the mobile app calls. No backend changes needed for Phases 1–5 except S2 (Category.archetype field — one migration).
- `src/lib/api/**.ts` — the web's API client. Mobile's `src/lib/api.ts` mirrors this 1:1 for predictability.
- `src/lib/countries.ts`, `src/lib/format.ts` — reusable on mobile via direct copy or shared package (decide in Phase 0).
- `src/lib/permissions.ts` — only relevant if we ever add admin features to the app (not in v1).
