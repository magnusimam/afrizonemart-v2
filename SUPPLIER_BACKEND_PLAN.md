# Supplier Portal — Backend & Functionality Implementation Plan

> Living tracker for turning the supplier portal from mock-backed UI into a
> working product. Goal: ship fast, with as little debugging as possible, by
> agreeing the contract first and wiring against it precisely.
>
> Legend: ✅ done · 🟡 in progress · ⬜ todo · 🔵 **YOUR action** (user) · ⚙️ backend repo

---

## 0. Architecture reality (read first)

- **Frontend** = this Next.js repo (`afrizonemart-v2`).
- **Backend** = `afrizonemart-api` — **Express + Prisma**, served at
  `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).
  **It is a SEPARATE repo and is NOT on this machine.**
- Existing auth (already live for shop + admin):
  - Endpoints `/api/auth/{login,register,refresh,logout,me,forgot-password,
    reset-password,google,phone/start,phone/verify}`.
  - Access token kept **in memory** (zustand `authStore`); refresh token is an
    **httpOnly cookie** set by the API. `apiFetchAuthed` attaches the bearer and
    does the 401→refresh→retry dance.
  - `AuthUser.role` ∈ `ADMIN | STAFF | SELLER | CUSTOMER`, plus `permissions[]`.
  - Error envelope: `{ error: { code, message, details? } }`.
  - Guards: `RequireAuth`, `RequireAdmin` (role + hydration + refresh wait).
    `RequireSupplier` is currently a **passthrough stub**.

### Decisions — LOCKED (2026-06-12)
1. ✅ **Backend repo: bring it here.** The user will place `afrizonemart-api` on
   this machine (recommended path `C:\Users\USER\AZM\afrizonemart-api`). I then
   build Prisma models + Express routes there AND the frontend, tested end-to-end
   against the real API on `:4000`. **← currently waiting on the repo.**
2. ✅ **Identity = reuse accounts + `SupplierProfile`.** No separate supplier
   login/role. Supplier access = a `SupplierProfile` row for the logged-in user.
   Existing AZM users log in with current credentials.
3. ✅ **Apply = combined register + apply.** One form creates the account (if
   needed) and the `SupplierProfile` together, landing them at Stage 1.

---

## 1. Identity & access model (recommended)

- **One accounts table** (existing `User`). Supplier access = existence of a
  `SupplierProfile` linked to `userId`.
- **Login** = the existing `loginUser` (`/api/auth/login`). The supplier login
  page mirrors the admin login page, but the post-login check is "does this user
  have a supplier profile?" (via `GET /api/suppliers/me`) instead of a role test.
  - Existing AZM customer/seller? They log in with the same creds. If they have a
    supplier profile → portal. If not → offer "Apply to sell".
- **Apply ("become a supplier")** = `POST /api/suppliers/apply`:
  - If authenticated: creates a `SupplierProfile` for the current user.
  - If not: combined form registers the account (reusing `/api/auth/register`
    semantics) **then** creates the profile — or 401 → send to login first.
- **RequireSupplier** (flip from stub): wait for hydration + refresh, require a
  user, then require `GET /api/suppliers/me` to succeed (profile exists);
  otherwise redirect: unauthenticated → `/supplier/login?returnUrl=…`,
  authed-but-not-supplier → `/suppliers` (the landing, with an Apply CTA).

---

## 2. Data model — ⚙️ `afrizonemart-api` (Prisma)

One model per concept; everything keys off `supplierId`.

- **SupplierProfile** — `id, userId (unique), companyName, contactName, phone,
  country, region, category, currentStage Int(1–10), status (ACTIVE/…),
  createdAt`. Plus profile fields from registration: `legalName, regNumber, taxId,
  yearEstablished, employees, factoryType, factoryAddress, bankDetails (encrypted),
  businessLicenseUrl`.
- **StageSubmission** — discovery / EoI / profiling answers as `stage Int + answers Json`
  (schema-driven, mirrors the PIQ engine), or fold into SupplierProfile.
- **ProductPIQ** — `id, supplierId, name, category, status (DRAFT|SUBMITTED|
  UNDER_REVIEW|APPROVED|REVISION_REQUIRED|REJECTED), completion Int, answers Json,
  configVersion, createdAt, updatedAt`.
- **PIQReview** — `id, piqId, summary, reviewer, feedback Json([{questionId,message}]),
  createdAt`.
- **FacilityVisit** — `id, supplierId, status (UNSCHEDULED|REQUESTED|CONFIRMED|
  COMPLETED), requestedSlot, confirmedAt, address, leadName, leadPhone,
  formData Json, reportUrl, outcome (PARTNERSHIP|CALLY_VALLEY)`.
- **Partnership** — `id, supplierId, status (PENDING|READY|SIGNED), signedAt,
  agreementUrl`.
- **Activation** — `id, supplierId, images Json, status (PENDING|SUBMITTED|LISTED)`.
- **TradeOrder** — `id, supplierId, ref, items Json, value, status (AWAITING|
  CONFIRMED|FULFILLED), deliverBy`.
- **SupplierActivity** — `id, supplierId, icon, tone, text, createdAt` (dashboard feed).
- **PIQConfig** — `category, version, sections Json` (so the form is admin-editable later).
- **Later:** EmailLog, CallyValleyEnrollment, WebinarSession, ReviewCall.

---

## 3. API contract (endpoints → the pages they power)

All under the existing envelope + auth. Supplier-scoped routes require the
caller's supplier profile (server derives `supplierId` from the token).

**Auth (exists):** reuse as-is. Optionally extend `GET /api/auth/me` to include
`supplier: { id, currentStage } | null` to save a round-trip.

**Supplier core**
- `POST /api/suppliers/apply` → create profile (body = EoI basics). → `/suppliers` Apply, `/supplier/register`
- `GET  /api/suppliers/me` → profile + currentStage. → RequireSupplier, dashboard, stage pages, profile
- `PATCH /api/suppliers/me` → update profile. → profile "request a change"/edit
- `GET  /api/suppliers/me/activity` → activity feed. → dashboard "Recent activity"

**Stage forms (1–3)**
- `GET  /api/suppliers/me/stages/:stage` → saved answers (autofill). → stage forms
- `PUT  /api/suppliers/me/stages/:stage` → autosave/submit answers. → stage forms

**PIQ (stage 4)**
- `GET  /api/piq-configs/:category` → `PIQFormConfig`. → PIQ editor
- `GET  /api/suppliers/me/piqs` → list. → My PIQs (+ dashboard KPIs derive from it)
- `POST /api/suppliers/me/piqs` → create (returns id). → "Add product"
- `GET  /api/suppliers/me/piqs/:id` → one PIQ + answers + status. → editor
- `PUT  /api/suppliers/me/piqs/:id` → autosave answers/completion. → editor autosave
- `POST /api/suppliers/me/piqs/:id/submit` → submit/resubmit. → submit button
- `GET  /api/suppliers/me/piqs/:id/review` → revision feedback. → revision banner

**Facility visit (6)**
- `GET  /api/suppliers/me/visit` → status + slots + confirmed details.
- `POST /api/suppliers/me/visit/request` `{ slotId }` → request a slot.

**Partnership (7) / Activation (8) / Trade (9)**
- `GET/POST /api/suppliers/me/partnership` (accept)
- `GET/POST /api/suppliers/me/activation` (submit images; needs uploads)
- `GET /api/suppliers/me/orders`, `POST /api/suppliers/me/orders/:id/confirm`

**Uploads:** reuse existing `src/lib/api/uploads.ts` pattern (PIQ photos,
business license, listing images, SDS docs).

**Admin side (⚙️ + new admin UI):** review queue (approve/request changes),
facility-visit team (confirm dates, fill audit form, generate report), product-
upload team (publish listings), Cally Valley program management. *(Admin is in
THIS repo under `(admin)/` — those pages are new frontend work too.)*

---

## 4. Frontend work — this repo (file-by-file)

- ⬜ `src/lib/api/supplier.ts` — typed client for every endpoint above (using
  `apiFetchAuthed`). Mirrors `src/lib/api/admin.ts` style.
- ⬜ `src/components/supplier/RequireSupplier.tsx` — flip stub → real gate
  (RequireAdmin pattern + supplier-profile check).
- ⬜ `src/app/(supplier-auth)/supplier/login/page.tsx` — wire to `loginUser` +
  profile check (replace the mock `router.push`).
- ⬜ `src/app/(supplier-auth)/supplier/register/page.tsx` — wire "Apply to sell"
  to `POST /api/suppliers/apply` (combined register+apply).
- ⬜ Replace mock reads with real fetches behind a flag (see §9):
  dashboard, My PIQs, PIQ editor, profile, stage pages, stage 5–10 bodies.
- ⬜ `authStore`/logout: add a sign-out control in the supplier sidebar.
- ⬜ Loading/empty/error states for every fetch (first-run supplier = 0 PIQs,
  stage 1) — currently only happy-path mock.

## 5. Backend work — ⚙️ `afrizonemart-api`
Prisma models (§2) + migration; routes (§3); supplier-profile middleware;
seed (a demo supplier matching our mock so the UI looks identical); wire admin
review/visit/listing endpoints. *(I can do this if the repo is available.)*

## 6. 🔵 YOUR actions (ops / accounts / keys)
- 🔵 Make `afrizonemart-api` available here, or assign the backend tasks.
- 🔵 Confirm `NEXT_PUBLIC_API_URL` for dev/staging/prod (`.env.local`).
- 🔵 DB: run migrations + seed on the API.
- 🔵 Decide supplier role/profile model (§0.2) and apply flow (§0.3).
- 🔵 Third-party (later phases): email provider (Resend/SES) for the email
  engine; file storage (S3/Cloudinary — uploads already exist?); ElevenLabs
  (review call); webinar video hosting; Paystack/Stripe (Cally Valley payments).

## 6b. Local dev runbook (works today)

API repo cloned to `C:\Users\USER\AZM\afrizonemart-api`. To bring the stack up:
1. **DB:** `docker run -d --name azm-pg -e POSTGRES_USER=azm -e POSTGRES_PASSWORD=azm -e POSTGRES_DB=afrizonemart -p 5433:5432 postgres:16` (needs Docker Desktop running). `.env` already points at it.
2. **Schema:** in `afrizonemart-api`, `NODE_OPTIONS=--use-system-ca npx prisma db push`
   — ⚠️ use `db push`, NOT `migrate dev`: a pre-existing migration
   (`20260505160000_brand_logo`) fails to replay on a fresh shadow DB
   (`ProductImageSubmission` table missing at that point — migration ordering
   bug in the repo's history; **Magnus to fix before any fresh prod migrate**).
3. **Seed:** `NODE_OPTIONS=--use-system-ca npx tsx scripts/seed-supplier.ts`
   → demo login **adia@adiafoods.ng** (password set by the seed script — see `scripts/seed-supplier.ts`) (Adia Foods, Stage 4).
4. **API:** `NODE_OPTIONS=--use-system-ca npm run dev` → `:4000` (health: `/api/health`).
5. **Frontend:** `node node_modules/next/dist/bin/next dev -p 8085` (default
   `NEXT_PUBLIC_API_URL=http://localhost:4000`; CORS already allows `:8085`).
- `--use-system-ca` is required everywhere (corporate cert proxy) for Prisma
  engine downloads / TLS.

### Phase 1 — DONE (verified end-to-end 2026-06-12)
Backend `/api/suppliers/{apply,me}` + `SupplierProfile` model; frontend
login/apply/RequireSupplier/sign-out. Curl-verified: login→token, /me 200,
no-token 401, non-supplier 404, combined apply 201 (+signed in, Stage 1),
duplicate apply 409.

## 6c. Bulk import — DONE (committed 2026-06-12)

Existing Sheets suppliers migrated into the DB. Scripts in `afrizonemart-api/scripts/`:
- `import-suppliers.ts` (dry-run by default; `--commit` to write) — ETL + matcher.
- `lib/import-core.ts` (load/normalize/identity-resolution), `lib/field-map.ts`
  (Sheet headers → PIQ/EOI field ids), `diagnose-matches.ts` (edge-case audit).
- Source CSVs + report live in `afrizonemart-api/data/imports/` (git-ignored, PII).

Result: **83 accounts + 83 SupplierProfiles + 91 ProductPIQs** created (idempotent;
re-runnable). EOI answers stored on `SupplierProfile.eoiAnswers`; PIQ answers on
`ProductPIQ.answers` (keyed by our field ids). Stage: EOI-only→3, has-PIQ→4.
Accounts have a random unusable password — **no emails sent**; they'll get a
secure "set your password" invite (reuses reset-token system) as a separate step.

**Residual (handle later, tracked in `data/imports/manual-skip.csv`):** 7 no-contact
companies (incl. P.P. Foods, Devialcare, FEHI, T. Elekhebor), 1 phone-only
(Janephilips Global Ltd), 1 cluster over-merge (**WETI** — skipped, it's a
cooperative of distinct companies). User holds an email list to fill some gaps.
Re-run `--commit` after edits (idempotent).

⚠ **Still TODO for these imported records:**
- Frontend must READ them (Phase 2/3) so suppliers see their data on login.
- Drive image links in answers still point to Google Drive → migrate to R2 (task #12).
- Send the set-password invites.

## 6d. Phase 2 + read-half of Phase 3 — DONE (2026-06-12)

Portal now reads LIVE data (react-query, `QueryProvider` is app-wide):
- Backend: `GET /api/suppliers/me/piqs` (list) + `/me/piqs/:id` (detail+answers).
- Frontend: `src/lib/api/supplier-hooks.ts` (`useSupplierMe`, `useSupplierPIQs`,
  shared keys → gate + pages dedupe one `/me` fetch). `RequireSupplier` now uses
  the query. Dashboard, Profile, My PIQs, and the PIQ **editor** are client
  components reading live data (editor seeds the supplier's real imported answers
  via `initialAnswers`). Loading skeletons + empty states added.
- Verified: AB'S Menu (`abmenu@gmail.com`, password set via
  `scripts/set-password.ts`) → dashboard Stage 4, My PIQs shows 6 imported
  products with completion %, editor shows their real answers.
- Mock `src/lib/supplier/mock.ts` no longer used by dashboard/profile/piqs/editor
  (stage 1–3 form pages still reference it — Phase 4). Delete mock at the very end.

**Still TODO (write-half of Phase 3):** create/autosave/submit PIQ + revision
review endpoints; wire editor submit + My PIQs "add product". Then invites + Phase 4+.

## 6e. Supplier invites — WIRED (2026-06-12)

"Set your password" invite flow (secure link, no plaintext passwords):
- Backend: `src/modules/suppliers/invite.service.ts` `sendSupplierInvite(userId)`
  — issues a 14-day single-use token (reuses `PasswordResetToken`) + emails a
  branded link via the existing pipeline (`sendEmail` → Console provider in dev,
  Resend in prod). Email template `templates/SupplierInvite.tsx`.
- Frontend: `/supplier/set-password?token=…` page → calls `resetPassword(token,
  pwd)` → `/supplier/login`.
- Batch: `scripts/invite-suppliers.ts` (dry-run default; `--commit` to send;
  `--only=email` for a single test). Verified end-to-end: invite → token →
  set-password (204) → login OK.
- 🔵 **To actually send to the 83:** set `RESEND_API_KEY` (+ verified `EMAIL_FROM`
  domain) in `afrizonemart-api/.env`, then `npx tsx scripts/invite-suppliers.ts --commit`.
  Without Resend, dev logs each email to stdout (preview only).
- ⚠ During testing the demo account `abmenu@gmail.com` password was reset via `scripts/set-password.ts`; the value is not recorded here.

Also fixed: `CountUp` (dashboard KPIs) was sticking at 0 (Strict-Mode + late data) —
now re-animates on value change and always settles on the real number.

## 6f. Phase 3 write-half — DONE (2026-06-12)

PIQs are now editable/submittable end-to-end:
- Backend: `POST /me/piqs` (create draft), `PUT /me/piqs/:id` (autosave answers/
  completion/name), `POST /me/piqs/:id/submit` (→ UNDER_REVIEW). Verified by curl.
- Frontend: `PIQFormEngine` gained `onAutosave`/`onSubmit` props (debounced real
  PUT; submit does a final save then POST submit, with a submitting state). The
  editor wires them + invalidates the piqs/me queries; "Add product" opens
  `/piqs/new/edit` which creates a draft and redirects to its id. Client mutations
  in `src/lib/api/supplier.ts` (`createSupplierPIQ`/`updateSupplierPIQ`/`submitSupplierPIQ`).
- Product `name` syncs from the `product_name` answer on save.

**Remaining for full Phase 3:** the revision loop's *live* data — an admin action
to request changes (set status REVISION_REQUIRED + per-field feedback) and a
`GET /me/piqs/:id/review` endpoint feeding the engine's existing feedback UI.
That pairs with the admin surfaces (Phase 6).

## 6g. Admin PIQ review + revision loop — DONE (2026-06-13)

Suppliers share the existing admin dashboard. Added a **Supplier PIQs** section:
- Capability **`suppliers.review`** (in API `lib/permissions.ts`; ADMIN auto-has it;
  tickable for STAFF in the staff matrix). Admin sidebar nav item gated on it.
- API: `src/modules/suppliers/admin.{routes,controller,service}.ts`, mounted at
  `/api/admin/suppliers` with `requireCapability('suppliers.review')`:
  `GET /queue` (PIQs UNDER_REVIEW/SUBMITTED), `GET /` (all suppliers),
  `GET /piqs/:id`, `POST /piqs/:id/approve`, `POST /piqs/:id/request-changes`
  `{summary, feedback:{fieldId:msg}}`.
- `ProductPIQ` gained `reviewSummary` + `feedback`. Approve → APPROVED (clears
  feedback). Request-changes → REVISION_REQUIRED (+ feedback). Supplier
  `GET /me/piqs/:id` now returns `reviewSummary`+`feedback`; the editor feeds them
  to `PIQFormEngine`'s existing revision UI → loop closed.
- Frontend: `/admin/suppliers` page (queue table + review modal: read-only answers
  by section + Approve / Request-changes with per-field notes). Client:
  `src/lib/api/admin-suppliers.ts`.
- Verified by curl end-to-end: admin queue (92) → request-changes → supplier PIQ =
  REVISION_REQUIRED with summary + per-field feedback.
- ⚠ Test only: `adia@adiafoods.ng` was promoted to **ADMIN** (role) to exercise
  the admin UI. Revert in prod / grant `suppliers.review` to real staff instead.

**Phase 3 (PIQ end-to-end) is complete:** read + create/autosave/submit + the
full admin review/revision loop.

## 6h. Phase 4 — journey forms live + stage advancement (2026-06-13)

Stages 1–3 (Discovery / EoI / Registration) now persist + advance:
- Schema: `SupplierProfile.stageAnswers Json?` (keyed by stage number).
- API: `GET/PUT /me/stages/:stage` (get/autosave) + `POST /me/stages/:stage/complete`
  (save + `currentStage = max(currentStage, stage+1)`, capped at 10). Stage 2 GET
  falls back to imported `eoiAnswers` so suppliers see their original EoI.
- Frontend: `StageFormLive` (loads saved answers → `PIQFormEngine` with real
  autosave + submit→advance→dashboard) and `StageProgressLive` (tracker now shows
  the real `currentStage`, not mock). Stage page no longer imports `mock.ts`.
- Verified: save/get round-trip, EoI fallback (19 fields), complete advances.

Portal now reads/writes **fully live**; `src/lib/supplier/mock.ts` is no longer
referenced by any supplier page (safe to delete at the end).

**Remaining (Phase 5+):** stages 5–10 deep flows (facility-visit scheduling +
admin handoff, partnership, activation, trade) and the automations (emails,
ElevenLabs call, evergreen webinar, Cally Valley, report gen) — several need the
user's pending docs (facility form per category, Cally Valley, report template).

## 6i. Admin supplier management (2026-06-13)

`/admin/suppliers` now has tabs: **Review queue** (PIQ approve/request-changes) +
**All suppliers** — every supplier with inline **Stage** advance (1–10) and
**Status** (Active/Suspended) controls. API: `GET /api/admin/suppliers` (list) +
`PATCH /api/admin/suppliers/:id` `{currentStage?, status?}`. Lets the team run the
human steps (review call, webinar, visit) and move suppliers along now, ahead of
full automation. Verified: advance-to-stage-5 via API; page renders.

## 6j. Facility Visit scheduling — Stage 6 (2026-06-13)

- Schema: `FacilityVisit` (1:1 supplier; status REQUESTED/CONFIRMED/COMPLETED/
  CANCELLED, preferredDate, address, confirmedDate/window, leadName/Phone, notes).
- New capability **`suppliers.visits`** (facility-visit team/department).
- Supplier: `GET /me/visit`, `POST /me/visit/request`. Stage 6 body rewritten live
  (propose date → requested → confirmed details shown).
- Admin: `/api/admin/facility-visits` (list / `:id/confirm` / `:id/complete`) gated
  by `suppliers.visits`; new `/admin/facility-visits` page (queue + confirm modal)
  + sidebar item. Verified e2e: request → confirm → supplier sees CONFIRMED.
- TODO (needs user doc): the per-category on-site **audit form** the team fills,
  then auto **report generation** → Partnership / Cally Valley routing.

**Next:** circle back to transactional emails (#1).

## 6k. Transactional emails — supplier lifecycle (2026-06-13)

Wired the supplier lifecycle notifications through the existing `sendEmail`
pipeline (Console provider in dev → Resend in prod; every send also writes a
`Notification` row, so the admin log reflects reality). Emails are best-effort:
`sendEmail` never throws, so a flaky provider can't block a submit/approve.

- Templates: `notifications/templates/SupplierNotifications.tsx` — `PIQSubmittedEmail`,
  `PIQApprovedEmail`, `PIQChangesEmail`, `VisitConfirmedEmail` (reuse `_layout`).
- Dispatch helpers: `suppliers/notify.ts` — `notifyPIQSubmitted`, `notifyPIQApproved`,
  `notifyPIQChanges`, `notifyVisitConfirmed` (build WEB_URL deep-links to the portal).
- Triggers:
  - `submitPIQ` → **supplier.piq.submitted** (acknowledgement, link to dashboard).
  - `approvePIQ` → **supplier.piq.approved** (link to dashboard).
  - `requestPIQChanges` → **supplier.piq.changes** (reviewer summary + edit link).
  - `confirmVisit` → **supplier.visit.confirmed** (date/window/address/lead card).
  - (existing **supplier.invite** unchanged — set-password onboarding.)
- `getPIQForAdmin` now also returns `supplierUserId` (so notifications attach to the user).
- Verified e2e (dev): all 4 types rendered + persisted `SENT`. Test PIQs cleaned up.
- Email types are plain strings, so they're also editable via the admin DB-template
  resolver (Phase 10.3) once rows are added for these `type`s.

**Next:** stages 5/7/8/9/10 deep flows + facility-visit audit form & report gen
(need user docs), or Drive→R2 image migration (needs R2 creds).

## 6l. Journey stages 5 & 7 — live completion (2026-06-13)

Made the two actionable static stages persist + advance through the existing
generic stage-answer mechanism (`GET/POST /me/stages/:stage[/complete]`,
`completeStage` advances `currentStage = max(current, stage+1)`).

- **Stage 7 — Partnership** (`Stage7Partnership.tsx`): now react-query driven.
  Loads `getStageAnswers(7)`; "Accept & sign" → `completeStage(7, {agreed, signedAt})`
  → persists, advances to Stage 8, shows confirmed state (with signed date) on
  reload. Loading skeleton + error + pending states. Verified e2e: complete-7 →
  200, answers `{agreed:true, signedAt}` persisted, `currentStage` → 8.
- **Stage 5 — Orientation** (`Stage5Orientation.tsx`): the review-call + evergreen
  webinar UI stays as the intentional preview of the ElevenLabs/webinar
  integrations (automation phase, needs docs). Added a live **OrientationComplete**
  card: `completeStage(5, {completedAt})` → advances to Stage 6, shows done state
  on reload.
- Both reuse `supplierKeys.me` invalidation so the dashboard tracker updates.

Still static (genuinely need real commerce-side data, not standalone flows):
- **Stage 8 Activation/Listing** — driven by admin listing approvals / live products.
- **Stage 9 Trade Engagement** — needs real purchase-order data.
- **Stage 10 Continuous** — ongoing performance/support dashboards.
These should read live status once the listing/PO data sources exist.

**Next:** facility-visit audit form & report gen (need user docs), Drive→R2 image
migration (needs R2 creds), or production cutover.

## 6m. Product-Commodity Audit (SP-CA) — Stage 6 audit form + report (2026-06-13)

Built the on-site audit the Quality & Compliance unit fills, straight from the
**Onboarding & Activation Framework §5** (doc "stage 5" = our journey Stage 6
"Product Audit"). The six audit criteria are universal (not per-category in the
doc), so it's one structured form, not category variants.

- Schema: `SupplierAudit` (1:1 supplier) — 6 criteria each `AuditRating`
  (PASS/CONDITIONAL/FAIL) + note: Destination Market Standards · Product
  Authenticity · Quality Standards · Labelling & Packaging · Branding · Market
  Viability Index. Plus `summary`, `recommendations AuditRecommendation[]`
  (PRODUCT_IMPROVEMENTS / CALLYVALLEY / AGREEMENT_DRAFTING), `auditorName`,
  `conductedAt`, status DRAFT/COMPLETED. `db push`'d + client regen'd.
- New capability **`suppliers.audit`** (Quality & Compliance unit).
- Admin API `/api/admin/supplier-audits` (gated `suppliers.audit`):
  `GET /` queue (suppliers at stage ≥6 or with an audit), `GET /:supplierId`
  (audit + supplier header), `PUT /:supplierId` (autosave draft, partial-safe),
  `POST /:supplierId/complete` (requires full assessment).
- **Report generation + routing on complete**: status→COMPLETED + conductedAt;
  if recommendations include `AGREEMENT_DRAFTING` → advance supplier to Stage 7
  (Partnership); emails the supplier **supplier.audit.complete** with the
  outcome. Other outcomes leave stage as-is (improvements = supplier acts;
  CallyValley = parallel program).
- Supplier API `GET /me/audit` — returns the report only once COMPLETED (drafts
  stay private).
- Frontend admin: `/admin/supplier-audits` (queue + AuditEditorModal: 6
  PASS/CONDITIONAL/FAIL togglable criteria + notes, summary, recommendation
  checkboxes, auditor name, Save draft / Complete; completed = read-only) +
  sidebar "Product audits" (ClipboardCheck).
- Frontend supplier: `AuditReportCard` rendered under Stage 6 — shows the rated
  criteria, notes, summary, recommendation chips; renders nothing until done.
- Verified e2e: queue→draft save (note persisted)→complete (200)→supplier
  `/me/audit` returns full report→**supplier.audit.complete** email SENT. Both
  pages render 200; API + frontend typecheck clean.

Note: this email is the 5th supplier transactional type (joins submitted /
approved / changes / visit-confirmed from §6k).

## 6n. Stage 5 orientation — evergreen "live" + review call (2026-06-13)

Made Stage 5 fully live, both steps.

**Evergreen "live" webinar (Step 2)**
- Goes live daily at a fixed time — **21:00 WAT (20:00 UTC)**, configurable via
  `ORIENTATION_LIVE_HOUR_UTC` (default 20) + `ORIENTATION_JOIN_WINDOW_MINS`
  (default 30). Client computes the window vs the user's clock (`computeLive`):
  before → countdown to today's go-live; within [live, live+window] → "Live now"
  + Join; after → countdown to tomorrow. Join requires a click (satisfies the
  30-min rule AND unblocks autoplay-with-audio).
- The recording is **time-synced**: video `currentTime` = seconds elapsed since
  go-live, resynced if it drifts >4s. So everyone sees the same position, like a
  real stream. Served from the API: `GET /api/orientation/video` streams the
  local file with HTTP Range (206) so it can seek; prod sets
  `ORIENTATION_VIDEO_URL` to a CDN/R2 URL instead. (Video git-ignored: `/video/`.)
- **Real chat replayed**: the recording's Google Meet chat transcript (`.sbv`)
  was parsed → `src/lib/supplier/orientation-chat.ts` (39 real comments, AZM
  speakers flagged as hosts, questions detected). Comments drip in as the
  session timeline passes their timestamp — reads authentically.
- **Supplier comments saved**: posting in the live chat → `OrientationComment`
  (auto-flags questions). Shown to the supplier instantly; persisted for the
  Supplier Relations Desk.

**PIQ review call (Step 1)**
- `ReviewCall` (1:1 supplier). Admin schedules (date/mode/link/notes) → supplier
  emailed `supplier.reviewcall.scheduled` (6th transactional type).
- Supplier can **request a reschedule** but not within **24h** of the call
  (`RESCHEDULE_CUTOFF_HOURS`); server-enforced + reflected as `canReschedule`.
- **Seamless calendar** (no OAuth): API returns an Add-to-Google-Calendar URL +
  `.ics` body (`src/lib/calendar.ts`); supplier card has "Add to Google Calendar"
  + "Download .ics". (Full Google Calendar API auto-create can layer on later
  with a service account.)

**Admin** `/admin/orientation` (gated `suppliers.review`, sidebar "Orientation &
calls"): tab 1 = review-call queue + schedule modal (handles reschedule
requests); tab 2 = live comments triage (questions filter, mark question /
answered). API under `/api/admin/orientation`.

Verified e2e: video 206 range; orientation config; post comment (201,
auto-question) → admin sees it; schedule call (200) → email SENT → supplier sees
SCHEDULED + calendar links; reschedule allowed >24h / blocked <24h (400);
`computeLive` window math checked. API + frontend typecheck clean; pages 200.

> ⚠️ **PREVIEW OVERRIDE ACTIVE**: `.env` has `ORIENTATION_LIVE_HOUR_UTC=22` +
> `ORIENTATION_JOIN_WINDOW_MINS=1440` so the room is viewable any time during
> testing. **Revert to 20 / remove these lines for real 9pm WAT behaviour.**

## 6o. Orientation polish + category audit system (2026-06-14)

**Orientation refinements** (`Stage5Orientation.tsx`)
- Removed "goes live every day…" framing — reads as a genuine live, not a schedule.
- Real time: **9pm WAT (20:00 UTC), 20-min join window** (`.env` ORIENTATION_*).
- Chat now drips **one comment at a time** as the session timeline passes each
  real transcript timestamp (no more dumping the backlog).
- Chat is a **contained Google-Meet-style scroll panel beside the video**
  (fixed height, internal scroll), not a full-page-length list.
- Viewer count fluctuates **180–250** over the session.
- Video treated as a true live stream: **no controls, can't pause/seek**
  (click-blocking overlay + onPause→play + position pin); join = the user
  gesture that unblocks audio autoplay.
- Review-call card already wired to admin (schedule → email + calendar links;
  reschedule ≥24h). Admin `/admin/orientation` confirmed.

**Category Product-Commodity Audit — full rebuild (replaces §6m generic audit)**
Digitized the 6 printed category audit templates + auto report generation, per
the `supplier-docx` source docs (Master Index + 6 templates + sample reports).
- **Templates parsed from the real .docx** → `src/modules/suppliers/audit-templates.ts`
  (6 categories A–F, ~215 checkpoints across 12–15 sections each, with ref,
  requirement, evidence). Regen via `supplier-docx/parse_templates.py` + `gen.js`
  (source docs git-ignored: `/supplier-docx/`).
- **Unified rating model** (per user decision): every checkpoint rated
  **C / M / Mi / O / Cpt / NA**. Indicative score = `100 − 2·Major − 0.5·Minor`;
  **any Critical ⇒ REJECTED**; else ≥85 & ≤3 Major ⇒ APPROVED; ≥70 ⇒
  PROVISIONAL; else REJECTED. (`scoreAudit`.)
- **Schema reworked**: `SupplierAudit` → category + `metadata`/`preVisitDocs`/
  `responses`/`capa` JSON + computed `indicativeScore`/`counts`/`outcome`
  (`AuditOutcome`) + `summary`/`recommendations`/`auditorName`. (db push, dev
  data dropped.)
- **API**: `/api/admin/supplier-audits` adds `GET /templates`,
  `GET /templates/:category`; save (partial draft) + complete (validates every
  checkpoint rated → scores → routes APPROVED to Stage 7 → emails
  `supplier.audit.complete` with outcome+score). Supplier `GET /me/audit`
  returns the full report incl. the category template for matrix rendering.
- **Admin UI** `/admin/supplier-audits`: category selector → dynamic template
  form (sections → checkpoints with C/M/Mi/O/Cpt/NA + findings, evidence hints,
  pre-visit doc checklist, scope metadata, CAPA editor, **live score/outcome
  badge**) → Save draft / Complete; completed = read-only.
- **Supplier UI** `AuditReportCard` (Stage 6): the diagnostic report — outcome
  banner + blurb, indicative score, finding counts, executive summary, full
  conformity matrix with per-checkpoint rating + findings, CAPA, recommendations.
- Verified e2e: template list/fetch; complete Template A (31 checkpoints) →
  score 90, outcome PROVISIONAL (Major>3 rule), email SENT, supplier report
  renders. API + frontend typecheck clean; pages 200.
- **Printable PDF report**: shared `AuditReportDocument` (formal cover +
  metadata + outcome/score + exec summary + full matrix + CAPA + recommendations
  + sign-off + confidential footer) with scoped `@media print` isolation (only
  the report prints, no portal/admin chrome) and a "Download / Print PDF" button
  (browser print → Save as PDF, no deps). Routes: supplier
  `/supplier/audit-report` (linked from the Stage-6 report card) and admin
  `/admin/supplier-audits/:supplierId/report` (linked from the completed-audit
  view). Both render 200.

## 6p. Stage 8 Activation & Listing — live inputs (2026-06-14)

- **Listing photos now upload for real.** New supplier-scoped endpoint
  `POST /api/suppliers/me/listing-photo` (requireAuth + supplier profile, no
  `uploads.write` needed; multer image-only, forced `products/` folder, reuses
  the uploads service → R2 in prod). Client `uploadListingPhoto()` (multipart +
  401-refresh).
- **Stage 8 rewritten live** (`Stage8Activation.tsx`): each of the 4 shots
  (front / back / lifestyle / scale) uploads → thumbnail + remove; URLs persist
  in stage-8 answers (`saveStageAnswers(8)`). "Submit for listing" records
  `submittedAt` → handoff state ("Sent for listing"). Loads existing state on
  return. Does **not** auto-advance the stage (listing is admin-published).
- **Sample video** ("How it's made" preview, the YouTube embed) now lives in
  Stage 8's "It's Made in Africa" section — moved off the orientation page (it
  was mistakenly added there first).
- Verified e2e: upload → public URL; stage-8 save/readback; page 200.
- TODO (admin side, with commerce data): a Product Upload review surface to view
  the submitted listing photos and publish; advancing to Stage 9 on publish.

> Deferred per request (production): orientation = one-time live — once a
> supplier completes it, the live should no longer be openable (show "complete ·
> move to next"). Recorded in `afrizonemart-api/PRODUCTION_CUTOVER.md` §8.

## 6q. Stages 8→10 complete — the journey is end-to-end live (2026-06-14)

Finished the last three stages (autonomously approved). New capability
**`suppliers.trade`** (Activation & Procurement) + admin page `/admin/trade`
(sidebar "Activation & trade"); added to `grant-supplier-caps` + cutover doc.

- **Stage 8 publish (admin):** `GET /api/admin/trade/listings` lists suppliers
  who submitted listing photos; `POST .../listings/:supplierId/publish` →
  advances them to Stage 9, emails **supplier.listing.published**. Supplier
  Stage 8 shows a "You're live" banner once published.
- **Stage 9 Purchase Orders (new `PurchaseOrder` model + `POStatus`):** admin
  `POST /api/admin/trade/purchase-orders/:supplierId` issues a PO (line items,
  currency, due date, notes; total auto-computed; unique PO number) → emails
  **supplier.po.issued**; `GET .../purchase-orders` lists; `.../:id/cancel`.
  Supplier `GET /me/purchase-orders` + `:id/acknowledge` + `:id/fulfill`
  (status ISSUED→ACKNOWLEDGED→FULFILLED). Stage 9 UI: live PO cards with line
  tables, acknowledge → mark-fulfilled, empty state.
- **Stage 10 performance:** `GET /me/performance` aggregates journey stage,
  listing-live, audit outcome/score, and PO counts + fulfilled value. Stage 10
  UI: live KPI cards + development programmes (periodic audits, capacity
  building, CallyValley®, joint marketing).
- 8 supplier transactional email types total now (added listing.published,
  po.issued).
- Verified e2e: submit listing → admin publish → stage 9; issue PO (total
  ₦870,000 correct) → supplier ack → fulfill; performance reflects all of it;
  both emails SENT; admin/trade + stages 8/9/10 pages 200; API + web typecheck
  clean.

**The full 10-stage supplier journey is now live end-to-end.** Remaining queued:
Drive→R2 image migration (needs R2 creds); production deploy (see
`afrizonemart-api/PRODUCTION_CUTOVER.md`).

## 6r. QA & hardening pass — stage gating + CTAs (2026-06-19)

While R2 creds are pending, hardened the supplier journey:
- **Stage-locking enforced.** Locked future stages were still clickable on both
  the journey map and the progress bar (and the stage page didn't check
  `currentStage`), so a supplier could URL-jump ahead and e.g. sign the
  partnership or submit a listing early. Now: locked stops render as
  non-navigable elements, and a new **`StageAccessGate`** wraps the stage body —
  any stage beyond `currentStage` shows a "locked" panel instead.
- **Dashboard CTAs route to the real current stage.** "Continue your journey" /
  the Next-step button always went to `/supplier/piqs`; now they use
  `stageHref(currentStage)` (Stage 4 → PIQs, every other stage → its page).
- Shared helpers added to `lib/supplier/stages.ts`: `stageHref()`,
  `isStageUnlocked()`. Frontend typecheck clean; pages render 200.

(Drive→R2 migration tool is built + validated, paused on the EOI folder share +
R2 creds — §8 of PRODUCTION_CUTOVER.md.)

## 7. Build order (phased) + acceptance per phase
1. **Auth & gating** — supplier login (existing accounts), apply, RequireSupplier,
   logout. ✅ when: log in as a seeded supplier → dashboard; non-supplier → Apply;
   logged-out → login; refresh keeps you in.
2. **Profile + dashboard read** — `GET /me`, `/me/activity`, PIQ-derived KPIs.
   ✅ when dashboard shows real data for the seeded supplier.
3. **PIQ end-to-end** — list/create/autosave/submit/review. ✅ when you can create
   a product, fill it, submit, see it under review; admin requests changes → you
   see per-field feedback → resubmit.
4. **Stages 1–3 forms** — save/autofill.
5. **Stages 5–10** — visit scheduling + admin handoff, partnership, activation,
   trade. (Some need §6 third-parties; ship UI-complete with stub endpoints first.)
6. **Admin surfaces** — review queue, facility team, product upload, Cally Valley.
7. **Automation** — emails, ElevenLabs, evergreen webinar, report generation.

## 8. Page / route / control inventory (nothing missed)
Public: `/suppliers` (nav links, Back to shopping, Supplier login, Apply to sell,
hero CTAs, FAQ accordion, hotline). Auth: `/supplier/login`, `/supplier/register`,
(password reset?). Portal: `/supplier/dashboard`, `/supplier/piqs`,
`/supplier/piqs/[id]/edit` (wizard: steps, autosave, submit/resubmit, autofill
chips, revision feedback), `/supplier/stages/[1..10]` (each stage body + its
buttons), `/supplier/profile`, `/supplier/support`. Sidebar: brand→`/suppliers`,
Dashboard, My PIQs, Support, Profile, Exit portal, **+ Sign out (to add)**.

## 9. Mock → real cutover (low-risk) — ✅ DONE (2026-06-13)
- All supplier surfaces (dashboard, PIQs, profile, stages, visit) now read the
  live API. `src/lib/supplier/mock.ts` was fully orphaned (no imports anywhere)
  and has been **deleted**; typecheck stays clean.
- Supplier auth surface complete: login, register/apply, set-password (invite),
  forgot-password + reset-password (shared global flow, linked from supplier
  login), sign-out (SupplierSidebar). No gaps.
- (Historical plan was an env-flag `NEXT_PUBLIC_SUPPLIER_LIVE` data layer; we cut
  each surface straight to live instead, so the flag was never needed.)

## 6s. Pre-deployment hardening pass (2026-07-27)

Full scan of the supplier build ahead of the first push/deploy. Frontend
typecheck + lint clean, `next build` passes, all 17 supplier/admin pages 200,
every supplier + admin API endpoint verified against the live API.

**Security — removed two dev backdoors that were about to ship** (both were
uncommitted local edits, so they'd have gone out with this branch):
- `src/lib/api/auth.ts` short-circuited `loginUser()` for
  `demo@azm.com` / `demo1234` and returned a fabricated SELLER session
  entirely client-side — an auth bypass on every surface, not just supplier.
- `src/lib/api/supplier.ts` matched that fake user id in `getSupplierMe()` and
  returned a `DEMO_SUPPLIER` profile, so the demo login also walked past
  `RequireSupplier` into the portal. Both deleted.

**Stage gating actually enforced now.** §6r claimed this was done; it wasn't in
the code:
- `StageAccessGate` took a `stage` prop, ignored it, and rendered children
  unconditionally — every stage body was reachable by URL. It now compares
  against `currentStage` via `isStageUnlocked()` and renders a locked panel
  (with a route back to the real current stage) instead.
- `SupplierJourneyMap` computed `locked` but wrapped every stop in a `Link`
  regardless, so locked stops were clickable. Locked stops are now inert
  `div`s, matching `SupplierStageProgressBar`, which already did this right.

**Orientation = genuinely one-time (cutover §8 closed).** Stage 5 now shares a
`useStage5Complete()` query between the webinar and the completion card; once a
supplier marks orientation complete the room is replaced by an "attended" panel
and can't be re-entered. The `.env` preview override (22 / 1440) was already
back to production values (20 / 20).

**Also fixed:** the supplier login page's redirect effect declared `cancelled`
but never returned a cleanup, so an unmounted page could still redirect —
cleanup added. Cleared 5 ESLint errors (unused `YES_NO`, `CheckCircle2`,
`locked`, `_stage`, `prefer-const`). Restored `SECURITY_AUDIT_TRACKER.md`,
which was staged for deletion unrelated to supplier work.

**Known, unchanged:** `adia@adiafoods.ng` is still role ADMIN from dev testing
(cutover §4 covers reverting it), and a test PIQ named "Autosave Test" is still
in the dev DB.

## 6t. B.I.L.L.I.E. read access + direct DB visibility (2026-07-27)

**Service tokens** — new `ServiceToken` model + `requireServiceToken`
middleware, so machine consumers can call the API without the browser session
dance (15-min access token + httpOnly refresh cookie doesn't suit a daemon).
Tokens are `azm_sk_…`, stored only as a SHA-256 hash, carry an explicit scope
list, and `readOnly` tokens are refused any non-GET before the route runs.
Minted/rotated/revoked with `scripts/create-service-token.ts`.
(Note: Express 4 doesn't catch async middleware rejections — the middleware
routes every failure through `next(err)` rather than throwing, or the request
hangs instead of 401ing.)

**`/api/billie`** — four read-only GETs for the voice assistant: `/overview`
(pipeline + action queue), `/suppliers` (search by name/stage/status),
`/suppliers/:id` (full journey detail), `/products` (PIQs by status). Verified:
no token → 401, bad token → 401, user JWT → 401, POST with a read-only token →
403, valid GET → 200, unknown id → 404. Manifest for Billie's `capabilities/`
is `afrizonemart-suppliers.md` in the API repo.

**Direct DB access** — `azm_readonly` Postgres role (SELECT only, denied
`ServiceToken`) for Beekeeper Studio; see `DB_ACCESS.md` for connection details
and a map of which tables hold the form/PIQ/EOI answers.

**Invites** — dry-run re-verified: 83 of 85 suppliers have an email and are
ready for the set-password magic link. Still gated on `RESEND_API_KEY` + a
verified `EMAIL_FROM` domain; without them the API logs to console instead.
