# Afrizonemart 2.0 — Features Backlog

> Living queue of features we want to build but haven't shipped yet.
>
> **Difference from `ARCHITECTURE_TRACKER.md`**: the tracker is the
> log of what's *been* built (or is in flight). This file is the
> queue of what's *next* — ideas, half-specs, and approved-but-not-
> started work. Entries here graduate to the tracker once we start
> implementing.
>
> **Status legend**:
> - `[ ]` queued — approved, not yet started
> - `[~]` in progress — being built; mirrored in `ARCHITECTURE_TRACKER.md`
> - `[x]` shipped — moved fully to `ARCHITECTURE_TRACKER.md`; kept here briefly so the team sees it landed
> - `[!]` blocked — see notes for what's in the way
> - `[?]` idea — captured but not yet approved for build
>
> **Convention going forward**: anything we want to build lands here
> first. CTO approval flips `[?]` → `[ ]`. When we start, copy a stub
> to the tracker, flip to `[~]` here. When it ships, mark `[x]` and
> let it age out after the next batch.

---

## High priority — committed

### 1. [~] Animated cart button — Stage 2 (PDP dark variant)

**Where**: `src/components/product/ProductInfo.tsx` — replace the
big navy "Add to Cart — {price}" CTA on the product detail page.

**Source**: `Interactive Cart Button.zip` from CodePen
(@nayanchamling). Ported + reskinned to navy + amber.

**Stage in series**: stage 2 of 3. Stage 1 (truck button on Place
Order) shipped 2026-05-08 in PR #34. This is the next step.

**Constraints carried from stage 1**:
- **No GSAP Club** — the cart button's t-shirt-into-cart morph step
  uses `MorphSVGPlugin` (paid). Replace with Framer Motion variants
  or pure CSS keyframes (free). Already doing this.
- **Re-skin** to `#0D1F4E` (navy) + `#F5A623` (amber).
- **`prefers-reduced-motion: reduce`** must skip the animation
  entirely — fall through to a normal `<button>`.
- **Resilience pattern (per Magnus 2026-05-08)** — every animated
  button ships with all three:
  - `useFlag('<key>', true)` admin kill-switch (default ON)
  - `<SafeBoundary>` wrapping the animated component, with the
    plain version as fallback
  - A `Static<Name>Button` that's 1:1 swappable from prop contract
- **Feature-flag registry entry** — add to
  `afrizonemart-api/src/modules/feature-flags/registry.ts` in the
  same PR so the flag is discoverable in `/admin/feature-flags`
  on first deploy.

**Plan sketch**:
1. New `AddToCartButton` component (TSX + CSS module). Port the
   demo's HTML + Framer Motion variants for the morph step.
2. New `StaticAddToCartButton` (the existing inline button extracted)
   — same `onAdd` / `disabled` / `variant` contract.
3. `ProductInfo.tsx` — wrap the new component in
   `<SafeBoundary fallback={<StaticAddToCartButton />}>` and gate
   on `useFlag('animated_pdp_add_to_cart_button', true)`.
4. Registry entry: `animated_pdp_add_to_cart_button` (default true).
5. **Smoke test before merge**: Vercel preview hits the test plan in
   the PR description; specifically open a PDP and click the button.

**Why this comes before stage 3**: PDP is one button per page (low
blast radius); product cards are six-per-shelf × N shelves
(high blast radius). Validate the morph rewrite + resilience pattern
on the small surface first.

---

### 2. [ ] Animated cart button — Stage 3 (product card light variant)

**Where**: `src/components/product/ProductCardPlaceholder.tsx` —
the small "Add to Cart" button at the bottom of every product card
on every shelf (homepage rows, shop pages, search results, country
pages, related products). High-frequency CTA.

**Source**: same `Interactive Cart Button.zip` (light variant).

**Stage in series**: stage 3 of 3. **Blocked on stage 2 proving
stable in prod** — same component code, just lighter palette.

**Plan sketch**:
- Reuse the `AddToCartButton` component from stage 2; expose a
  `theme: 'light' | 'dark'` prop. Light theme = white card surface,
  dark theme = navy PDP CTA.
- Replace inline `<button>` in `ProductCardPlaceholder.tsx` with the
  animated variant, wrapped in the same SafeBoundary + flag pattern.
- Separate flag key `animated_card_add_to_cart_button` (default true)
  so we can kill-switch cards independently of the PDP CTA.
- Registry entry for the new flag.

**Mobile responsive check** before merge — product cards on mobile
are ~140px wide; the animation may need a smaller variant or a
fallback to the static button below a width threshold.

---

## Ideas / not-yet-approved

### [?] Storefront smoke-test in CI

When GitHub Actions billing is unblocked, wire
`scripts/smoke.mjs` into a workflow that hits a handful of critical
URLs against the Vercel preview after a PR builds. Fails the PR if
any return 500. Blocks merge until the runtime errors are fixed.

Captures the kind of failure we hit on 2026-05-08 — build succeeded,
runtime 500'd on every product page, and we only noticed when Magnus
manually clicked through.

Until then: run the script manually before merging.

### [?] Sentry DSN configured in prod

Currently unset — Sentry is wired but inert. Once a DSN is
provisioned, every 500 in production gets paged within seconds
instead of "until a user reports it." Pair with the M3 PII scrubber
already in place.

---

## Recently shipped (delete after the next batch)

- **2026-05-08** — Stage 1 truck button on `/checkout/payment` (#34, plus the resilience wrap in #34-followups).
- **2026-05-08** — Storefront origin-currency display + "see in your currency" toggle (#33).
- **2026-05-08** — Admin /products country filter (#32).
- **2026-05-08** — 2026-05-08 security audit batch (#31): C1, C2, C3, H1, H2, H4-H10, M1-M5, M8-M12.
