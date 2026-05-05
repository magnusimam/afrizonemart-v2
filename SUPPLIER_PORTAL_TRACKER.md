# Afrizonemart Supplier Portal — Build Tracker

> Living tracker for the **Supplier Portal** build — the third user surface
> on Afrizonemart, alongside the customer storefront `(shop)/` and the admin
> console `(admin)/`. Suppliers are the brands, farms, manufacturers, and
> co-ops whose products you eventually list on the marketplace. They go
> through a 10-stage onboarding pipeline before any of their products go
> live to customers.
>
> Status legend: `[ ]` not started · `[~]` partially done · `[x]` done · `[?]` blocked / awaiting input
>
> Sources:
> - `AZM_SupplierPortal_PIQ_Addendum_May2026_Stage4Spec.docx` — this tracker captures Stage 4 (PIQ) in full.
> - `AZM_SupplierPortal_ClaudeBuildGuide_May2026_FullSpec.docx` — referenced by the addendum; foundational stages 1-3 + 5-10 wait on this.
>
> Live with `ARCHITECTURE_TRACKER.md` (the existing tracker for the platform-wide work). This file is scoped to the supplier portal.

---

## 0. Snapshot — where we are

**As of 2026-05-05**: nothing supplier-side exists in the codebase. The repo today has:

- `(shop)/` — public storefront + customer auth + cart/checkout/account
- `(admin)/` — admin console (orders, products, intern queue, blog, content, etc.)
- `(auth)/` and `(admin-auth)/` — sign-in pages
- Express API on Railway with the User model, JWT auth, refresh tokens, Resend, R2 uploads, event bus, error handler

Everything below is **planned** unless ticked.

---

## 1. Architecture decisions (locked)

- [x] **Same repo, `(supplier)/` route group inside `afrizonemart-v2`.** Reuses User model, JWT auth, Resend, R2 uploads, Prisma, Express API. No new deployment, no new DevOps.
- [x] **API on the same Express server.** Supplier endpoints mount at `/api/suppliers/...` and `/api/admin/piqs/...`. Same Prisma schema, single DB.
- [x] **Domain strategy — phase 1: same domain, `/supplier/...` path.** Phase 2 (later, optional): rewrite `suppliers.afrizonemart.com` to `/supplier` via Next.js middleware so the URL feels separate without splitting the codebase.
- [ ] **Vercel "Ignored Build Step"** — to skip the Vercel build when a push only touches `(shop)/` (so supplier-only deploys don't rebuild the storefront, and vice-versa). Add when supplier surface is large enough to matter.

---

## 2. The 10-stage map

The supplier journey from first contact to fully active. **PIQ is the new Stage 4** — every stage from 4 onward shifted up by one when the addendum landed.

| Stage | Name |
|---|---|
| 1 | Supplier Discovery & Initial Contact |
| 2 | Expression of Interest (EoI) |
| 3 | Supplier Registration & Profiling |
| **4 (NEW)** | **Product Information Questionnaire (PIQ)** |
| 5 | Supplier Orientation *(was 4)* |
| 6 | Supplier Product-Commodity Audit — SP-CA *(was 5)* |
| 7 | Formalize Supplier Partnership *(was 6)* |
| 8 | Supplier Activation & Listing *(was 7)* |
| 9 | Procurement & Trade Engagement *(was 8)* |
| 10 | Continuous Supplier Engagement *(was 9)* |

DB rule: `Supplier.maxStage = 10`. Any code that previously checked `currentStage === 9` for the final stage must now check `=== 10`. Frontend `STAGES` constant must include all 10. All email templates must reflect the new numbering.

---

## 3. Phase F — Foundation (must precede all stage work)

The PIQ addendum assumes a Supplier model + supplier auth + `(supplier)/` route group already exist. They don't. Phase F creates them.

### 3.1 Database & schema

- [ ] **Add `Supplier` model to `prisma/schema.prisma`** with at minimum: `id`, `userId` (relation to existing User), `companyName`, `contactName`, `phone`, `address`, `country`, `currentStage Int @default(1)`, `maxStage Int @default(10)`, `minimumPIQsRequired Int @default(1)`, `createdAt`, `updatedAt`.
- [ ] **Add `SUPPLIER` to `UserRole` enum** in `prisma/schema.prisma`.
- [ ] **Add `SupplierActionLog` model** — audit trail of every event emitted on the supplier event bus. Used by the existing audit infrastructure.
- [ ] **Migration** — `npx prisma migrate dev --name supplier_foundation` against dev DB, commit the migration file. Production picks it up via `migrate deploy`.

### 3.2 Auth + middleware

- [ ] **Supplier sign-up flow** — `/supplier/register` page. Creates a User with role=SUPPLIER + a Supplier row.
- [ ] **Supplier sign-in flow** — `/supplier/login` page (mirrors `/admin/login` pattern but routes to `/supplier`).
- [ ] **`RequireSupplier` client gate** (mirror of `RequireAdmin` in `src/components/admin/RequireAdmin.tsx`) — redirects non-suppliers to the supplier login.
- [ ] **API middleware `requireSupplier`** — gates `/api/suppliers/...` to authenticated users with role=SUPPLIER. Pair with `requireAuth`.
- [ ] **Capability extension** — add supplier-related capabilities (`piq.review`, `piq.config.write`, `supplier.support.respond`) to the existing `lib/permissions.ts` registry so admin staff can be granted these granularly.

### 3.3 Route group + layout

- [ ] **`src/app/(supplier)/layout.tsx`** — equivalent of the admin layout. Wraps everything in `<RequireSupplier>` + a supplier-specific sidebar/topbar.
- [ ] **`SupplierShell` client wrapper** — like `AdminShell`, owns mobile drawer state. Sticky topbar + hamburger on mobile.
- [ ] **`SupplierSidebar`** — navigation: Dashboard, My PIQs, Support, Profile, Stage Progress.
- [ ] **`SupplierStageProgressBar`** — 10-step horizontal progress indicator. Used in supplier dashboard + at the top of every supplier page so they always see where they are in the journey.

### 3.4 Event bus + emails

- [ ] **`supplierEvents.ts`** — central registry of supplier events. Wraps the existing `eventBus` so all supplier-side events log to `SupplierActionLog` automatically.
- [ ] **Email pipeline extension** — add a `templates/supplier/` folder under `afrizonemart-api/src/modules/notifications/templates/`. Each stage transition + each PIQ status change gets its own React Email template using the existing `EmailLayout`.

### 3.5 Vercel ignored build step (optional, recommended)

- [ ] **Add `vercel.json` or set Project Settings → Git → Ignored Build Step** with a script that skips the build when no supplier-relevant files changed (or, conversely, no shop-relevant files changed for a supplier-only Vercel project).

---

## 4. Stages 1–3 — placeholders (need full Supplier Portal Build Guide)

**Status: `[?]` blocked — awaiting `AZM_SupplierPortal_ClaudeBuildGuide_May2026_FullSpec.docx`.**

The PIQ addendum assumes Stages 1–3 exist. They define how a supplier even *gets* to Stage 4. Once the full spec lands, expand each into its own subsection here. Top-of-mind needs:

- **Stage 1 — Supplier Discovery & Initial Contact**: how AZM finds the supplier (cold outreach, referral, marketplace scout). Likely admin-only data entry initially.
- **Stage 2 — Expression of Interest (EoI)**: supplier submits an EoI form. Lightweight; basic company info + intent.
- **Stage 3 — Supplier Registration & Profiling**: full company profile — legal docs, banking, certifications, capacity, geography. This is what the PIQ used to be a sub-step of, before being elevated.

Write up here once the spec is in hand. Until then: `[ ] receive AZM_SupplierPortal_ClaudeBuildGuide` is the only blocker.

---

## 5. Stage 4 — PIQ — full detail (THIS ADDENDUM)

The Product Information Questionnaire is **its own stage** because it's structurally different from Stage 3:

1. **One PIQ per product.** Supplier with 30 SKUs fills 30 PIQs. Each is independent.
2. **Specialist knowledge needed.** Suppliers need help → dedicated support tickets per PIQ.
3. **Each PIQ reviewed individually.** AZM Merchandise Sourcing Unit reviews each one. Stage advances when a *minimum number of PIQs* are approved (default 1, configurable per supplier).
4. **PIQs continue forever.** Supplier can keep adding new ones after Stage 4 advances.

### 5.1 Concepts (must be true in code)

| Concept | Implication |
|---|---|
| One PIQ per product | `PIQ` is its own model, NOT a field on `Supplier`. |
| Category-specific questions | Form fields driven by `PIQFormConfig.sections` JSON. **Don't hardcode.** |
| Each PIQ has its own status | Statuses tracked independently of overall supplier stage. |
| Stage 4 advances on min approved | Stage advancement logic counts approved PIQs ≥ `Supplier.minimumPIQsRequired`. |
| Support built-in | Per-PIQ support tickets — not generic "contact us." |

### 5.2 PIQ status flow

```
DRAFT             → supplier still filling, not yet submitted
  ↓ submit
SUBMITTED         → supplier sent for AZM review
  ↓ AZM picks it up
UNDER_REVIEW      → AZM Merchandise Sourcing Unit is reviewing
  ↓ outcome
APPROVED          → product ready for audit + listing
REVISION_REQUIRED → AZM wants changes; supplier updates + resubmit (revisionCount++)
REJECTED          → permanently rejected; product cannot proceed
```

**Stage 4 completion check** (TypeScript pseudocode from the spec):

```ts
const isStage4Complete = (supplier: Supplier): boolean => {
  const approvedCount = supplier.piqs.filter((p) => p.status === 'APPROVED').length;
  return approvedCount >= supplier.minimumPIQsRequired; // default 1
};
```

When complete, supplier auto-advances to Stage 5 (Orientation). They can keep submitting more PIQs after.

### 5.3 Dynamic form engine — schema-driven

Magnus uploads the real question set later. Until then, the engine must work from a placeholder config. **Zero code changes** when the real config replaces the placeholder.

`PIQFormConfig.sections` JSON shape:

```jsonc
{
  "sections": [
    {
      "id": "section_1",
      "title": "Basic Product Information",
      "description": "Core details about this product",
      "questions": [
        {
          "id": "q1",
          "label": "Product Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter exact product name as it will appear on packaging",
          "helpText": "This should match your product label exactly",
          "maxLength": 200
        },
        {
          "id": "q2",
          "label": "Product Category",
          "type": "select",
          "required": true,
          "options": ["Processed Food", "Fresh Produce", "Beverage", "Snacks", "Condiments"]
        },
        {
          "id": "q3",
          "label": "NAFDAC Registration Number",
          "type": "text",
          "required": true,
          "conditional": { "dependsOn": "q2", "showWhen": ["Processed Food", "Beverage", "Snacks"] }
        },
        {
          "id": "q4",
          "label": "Upload NAFDAC Certificate",
          "type": "file",
          "required": true,
          "acceptedTypes": ["application/pdf", "image/jpeg", "image/png"],
          "maxSizeMB": 10,
          "conditional": { "dependsOn": "q2", "showWhen": ["Processed Food", "Beverage", "Snacks"] }
        }
      ]
    }
  ]
}
```

**Supported question types** (the `type` field):
- `text` — single-line input
- `textarea` — multi-line input (with `maxLength`)
- `number` — numeric input
- `select` — dropdown from `options[]`
- `multiselect` — checkbox group from `options[]`
- `boolean` — Yes/No toggle
- `date` — date picker
- `file` — drag-drop upload (with `acceptedTypes[]` + `maxSizeMB`)
- `repeatable` — list of sub-forms (e.g. "Add another variant")

**Conditional logic**: a question's `conditional: { dependsOn, showWhen[] }` means "only render when `answers[dependsOn]` is included in `showWhen`."

**Auto-save**: every keystroke debounced 800ms → `PUT /api/suppliers/me/piqs/:id`. UI shows "Saved" indicator (green check fading in/out).

**Completion calc**: `completionPct = (answeredRequired / totalRequired) * 100`. Per-section progress bar at top of each section.

### 5.4 Database models — final shape

Add to `prisma/schema.prisma`:

```prisma
model PIQ {
  id              String    @id @default(cuid())
  supplierId      String
  // Product Identity
  productName     String
  productCategory String    // must match a PIQFormConfig.category
  sku             String?   // optional at PIQ stage
  // Form Data
  formConfigId    String    // which PIQFormConfig version was used
  answers         Json      // { questionId: answer } map
  uploadedFiles   Json      // { questionId: { url, name, size } } map
  completionPct   Int       @default(0)  // 0-100
  // Status
  status          PIQStatus @default(DRAFT)
  // Review
  reviewedBy      String?   // AZM staff user ID
  reviewedAt      DateTime?
  reviewNotes     String?   // AZM feedback to supplier
  revisionCount   Int       @default(0)
  // Support
  supportTickets  PIQSupportTicket[]
  // Timestamps
  submittedAt     DateTime?
  approvedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  supplier        Supplier  @relation(fields: [supplierId], references: [id])
}

model PIQSupportTicket {
  id          String              @id @default(cuid())
  piqId       String
  supplierId  String
  subject     String
  status      SupportTicketStatus @default(OPEN)
  priority    SupportPriority     @default(NORMAL)
  messages    PIQSupportMessage[]
  createdAt   DateTime            @default(now())
  resolvedAt  DateTime?
  piq         PIQ                 @relation(fields: [piqId], references: [id])
}

model PIQSupportMessage {
  id         String           @id @default(cuid())
  ticketId   String
  content    String
  senderRole String           // 'supplier' | 'azm_support'
  senderId   String
  senderName String
  createdAt  DateTime         @default(now())
  ticket     PIQSupportTicket @relation(fields: [ticketId], references: [id])
}

model PIQFormConfig {
  id        String   @id @default(cuid())
  category  String   @unique  // 'FOOD_BEVERAGE', 'COSMETICS', 'APPAREL', etc.
  label     String   // Display name e.g. 'Food & Beverages'
  sections  Json     // Dynamic question definitions (see 5.3)
  version   Int      @default(1)
  isActive  Boolean  @default(true)
  updatedAt DateTime @updatedAt
}

enum PIQStatus           { DRAFT SUBMITTED UNDER_REVIEW APPROVED REVISION_REQUIRED REJECTED }
enum SupportTicketStatus { OPEN IN_PROGRESS RESOLVED CLOSED }
enum SupportPriority     { LOW NORMAL HIGH URGENT }
```

Plus on `Supplier`: `minimumPIQsRequired Int @default(1)`.

---

## 6. Phase PIQ-1 — Database & API

### 6.1 Schema + seed

- [ ] Add `PIQ`, `PIQSupportTicket`, `PIQSupportMessage`, `PIQFormConfig` models — `prisma/schema.prisma`
- [ ] Add `minimumPIQsRequired` to `Supplier` (default 1) — `prisma/schema.prisma`
- [ ] Add `PIQStatus`, `SupportTicketStatus`, `SupportPriority` enums — `prisma/schema.prisma`
- [ ] Confirm `Supplier.maxStage` is set to 10 — `prisma/schema.prisma`
- [ ] Migration `npx prisma migrate dev --name piq_stage` — applied to dev + committed; Railway picks it up
- [ ] Seed placeholder `PIQFormConfig` with the test question set (see Section 8 below) — `prisma/seed.ts`

### 6.2 Public endpoints

- [ ] `GET /api/piq-configs` — list all available categories
- [ ] `GET /api/piq-configs/:category` — fetch the form config for a category (the supplier UI hits this before saving any draft)

### 6.3 Supplier endpoints (`/api/suppliers/me/piqs/...`, gated by `requireSupplier`)

- [ ] `GET /api/suppliers/me/piqs` — list every PIQ for this supplier with status, productName, completionPct
- [ ] `POST /api/suppliers/me/piqs` — body `{ productName, productCategory }`. Creates DRAFT row. Returns PIQ id + form config.
- [ ] `GET /api/suppliers/me/piqs/:piqId` — single PIQ with all answers + uploaded files
- [ ] `PUT /api/suppliers/me/piqs/:piqId` — save answers (auto-save). Recalculates `completionPct`.
- [ ] `POST /api/suppliers/me/piqs/:piqId/submit` — validates required fields, flips status to `SUBMITTED`, sets `submittedAt`, fires `PIQ_SUBMITTED` event.
- [ ] `POST /api/suppliers/me/piqs/:piqId/files` — multipart upload for a file-type answer. Stores in R2. Returns `{ url, name, size }`.
- [ ] `DELETE /api/suppliers/me/piqs/:piqId/files/:fileId` — remove an uploaded file.
- [ ] `POST /api/suppliers/me/piqs/:piqId/resubmit` — supplier resubmits after `REVISION_REQUIRED`. Increments `revisionCount`, status → `SUBMITTED`.

### 6.4 Supplier support endpoints

- [ ] `GET /api/suppliers/me/piqs/:piqId/support` — list tickets for this PIQ
- [ ] `POST /api/suppliers/me/piqs/:piqId/support` — open new ticket, body `{ subject, initialMessage }`
- [ ] `POST /api/suppliers/me/piqs/:piqId/support/:ticketId/reply` — supplier sends a reply
- [ ] `GET /api/suppliers/me/support` — supplier inbox: all tickets across all PIQs

### 6.5 Admin PIQ endpoints (`/api/admin/piqs/...`, gated by `requireRole('ADMIN')` or capability `piq.review`)

- [ ] `GET /api/admin/piqs` — list all PIQs across all suppliers; filters by status, category, supplier
- [ ] `GET /api/admin/piqs/:piqId` — full detail: answers, files, supplier info, support history
- [ ] `PUT /api/admin/piqs/:piqId/approve` — body `{ notes? }`. Status → `APPROVED`, `approvedAt = now()`. Triggers stage check.
- [ ] `PUT /api/admin/piqs/:piqId/request-revision` — body `{ notes, specificIssues[] }`. Status → `REVISION_REQUIRED`. Notes + issues saved. Fires event.
- [ ] `PUT /api/admin/piqs/:piqId/reject` — body `{ reason }`. Status → `REJECTED`. Fires event.
- [ ] `GET /api/admin/support/piqs` — all open PIQ support tickets
- [ ] `POST /api/admin/support/:ticketId/reply` — AZM staff reply
- [ ] `PUT /api/admin/support/:ticketId/resolve` — mark resolved

### 6.6 Admin form-config endpoints

- [ ] `POST /api/admin/piq-configs` — upload/update PIQ form config for a category. **This is the endpoint to hit when Magnus hands over the real PIQ question set.** Body matches `PIQFormConfig.sections` JSON.
- [ ] `GET /api/admin/piq-configs` — list all configs with version history

### 6.7 Event bus + stage-advance logic

- [ ] `supplierEvents.ts` — define `PIQ_EVENTS` constants:

  ```ts
  export const PIQ_EVENTS = {
    PIQ_CREATED:               'piq.created',
    PIQ_SUBMITTED:             'piq.submitted',
    PIQ_APPROVED:              'piq.approved',
    PIQ_REVISION_REQUESTED:    'piq.revision_requested',
    PIQ_REJECTED:              'piq.rejected',
    PIQ_RESUBMITTED:           'piq.resubmitted',
    STAGE4_MINIMUM_MET:        'piq.stage4_minimum_met',
    SUPPORT_TICKET_OPENED:     'piq.support_ticket_opened',
    SUPPORT_REPLY_BY_AZM:      'piq.support_reply_azm',
    SUPPORT_REPLY_BY_SUPPLIER: 'piq.support_reply_supplier',
    SUPPORT_RESOLVED:          'piq.support_resolved',
  } as const;
  ```

- [ ] `PIQ_APPROVED` handler: re-counts approved PIQs for the supplier; if ≥ `minimumPIQsRequired`, emits `STAGE4_MINIMUM_MET`.
- [ ] `STAGE4_MINIMUM_MET` handler: advances supplier to Stage 5, sends "Stage 4 Complete" email. (Decide: auto-advance or admin-approve advance — spec allows either.)
- [ ] All PIQ events also log to `SupplierActionLog` via the audit subscription.

### 6.8 Email templates

All under `src/modules/notifications/templates/supplier/`. Use the existing `EmailLayout` brand frame.

| Trigger | Subject | Notes |
|---|---|---|
| PIQ Created (DRAFT) | — | **No email** — silent. Supplier fills at their own pace. |
| PIQ Submitted | "PIQ Received — \[Product Name\]" | Confirmation, expected review time (3–5 working days), portal link |
| PIQ Approved | "Great News — \[Product Name\] PIQ Approved!" | Product ready to proceed; if stage minimum met, mention "You are now eligible to advance to Stage 5" |
| PIQ Revision Required | "Action Required — \[Product Name\] PIQ Needs Updates" | AZM feedback summary, specific issues listed, link to update + resubmit |
| PIQ Rejected | "Update on \[Product Name\] PIQ" | Rejection reason, support contact, optional CallyValley program mention |
| Support Ticket Opened *(to AZM)* | "New PIQ Support Request — \[Supplier\]: \[Subject\]" | PIQ details, initial message, admin reply link |
| Support Reply *(to supplier)* | "AZM Support Has Replied — \[Subject\]" | Reply preview, link to thread |
| Support Reply *(to AZM)* | "Supplier Replied — \[Supplier\]: \[Subject\]" | Reply content, admin thread link |
| Support Resolved *(to supplier)* | "Your Support Ticket Has Been Resolved" | Resolution summary, portal link |
| Stage 4 Complete | "You Have Completed Stage 4 — PIQ Stage" | Congrats, advance-to-Stage-5 instructions |

- [ ] Template per row above (skip the DRAFT one), with React Email components matching the existing brand layout.
- [ ] Wire each template into the corresponding `PIQ_EVENTS` handler.

---

## 7. Phase PIQ-2 — Frontend components

All under `src/components/piq/`. Built in this order so dependencies cascade.

- [ ] `PIQStatusBadge` — pill component with all six statuses + colour styles (see below). One source of truth — every page uses it.
- [ ] `PIQAutoSaveIndicator` — "Saving…" / "Saved ✓" pill. Fade-in/out. Plays during the 800ms debounce.
- [ ] `PIQSectionProgress` — per-section completion bar (`answeredRequired / totalRequired`).
- [ ] `PIQFileUpload` — drag-drop zone, click-to-browse, type/size validation, upload progress, preview, remove, error states. Used inside `PIQFormEngine` for `type: 'file'` questions.
- [ ] `PIQFormEngine` — **the core**. Receives a `PIQFormConfig`, renders dynamically. Handles all 9 question types, conditional logic, auto-save, completion calc, readOnly mode, top-of-form revision-notes banner.
- [ ] `PIQCard` — used in supplier dashboard grid. Shows productName, category, status badge, completion %, contextual CTA per status (Continue / View / Address Feedback / etc.). REVISION_REQUIRED variant shows AZM notes inline in amber.
- [ ] `PIQSupportModal` — open new support ticket. Subject + initial message.
- [ ] `PIQSupportThread` — chat-style message list. Supplier messages right-aligned navy; AZM messages left-aligned amber. AZM sender always reads "AZM Support Team".
- [ ] `AdminPIQReviewPanel` — sticky right rail in admin review page. Notes textarea, three actions: Approve (green) / Request Revision (amber) / Reject (red). Each action's confirmation modal.
- [ ] `AdminPIQSpecificIssues` — issue list builder (each issue: section, question, description). Used in revision flow.

### Status badge colour reference (from spec)

```ts
const STATUS_STYLES = {
  DRAFT:             { bg: '#F7F7F7', text: '#555555', label: 'Draft' },
  SUBMITTED:         { bg: '#EDF2FA', text: '#0D1F4E', label: 'Submitted' },
  UNDER_REVIEW:      { bg: '#FEF3E2', text: '#D35400', label: 'Under Review' },
  APPROVED:          { bg: '#EAFAF1', text: '#1A6B2E', label: 'Approved ✓' },
  REVISION_REQUIRED: { bg: '#FEF3E2', text: '#C0392B', label: 'Revision Required' },
  REJECTED:          { bg: '#FDEDEC', text: '#C0392B', label: 'Rejected' },
};
```

### CTA button per status (PIQCard)

| Status | CTA label | Goes to |
|---|---|---|
| DRAFT | Continue PIQ | `/piqs/[id]/edit` |
| SUBMITTED | View Submission | `/piqs/[id]/view` |
| UNDER_REVIEW | View PIQ | `/piqs/[id]/view` (read-only) |
| APPROVED | View Approved PIQ | `/piqs/[id]/view` |
| REVISION_REQUIRED | Address Feedback | `/piqs/[id]/edit` (shows AZM notes) |
| REJECTED | View Rejection Reason | `/piqs/[id]/view` |

---

## 8. Phase PIQ-3 — Frontend pages

### 8.1 Supplier surface (under `(supplier)/`)

- [ ] **`src/app/(supplier)/piqs/page.tsx`** — Stage 4 dashboard. Layout:
  - Stage 4 progress banner (amber). "You are in Stage 4 — Product Information Questionnaire. Complete a PIQ for each product you want to sell through AZM."
  - Stage progress indicator: "X of Y PIQs approved" with amber progress bar; green badge when minimum met.
  - "+ Add New Product PIQ" button (amber, prominent).
  - PIQ Cards Grid — one card per product.
  - Support banner — "Need help with your PIQ? Contact us" → "Get Support" button.
- [ ] **`src/app/(supplier)/piqs/new/page.tsx`** — start new PIQ. Three steps: pick category → enter product name + SKU → POST creates DRAFT and redirects to edit.
- [ ] **`src/app/(supplier)/piqs/[id]/edit/page.tsx`** — full dynamic form using `PIQFormEngine`. Auto-save. AZM revision notes shown at top in amber when `REVISION_REQUIRED`.
- [ ] **`src/app/(supplier)/piqs/[id]/view/page.tsx`** — read-only view (`PIQFormEngine readOnly`).
- [ ] **`src/app/(supplier)/piqs/[id]/support/page.tsx`** — list of support tickets for this specific PIQ. "Open New Support Ticket" button. Per-ticket "View Thread" link → `PIQSupportThread`.
- [ ] **`src/app/(supplier)/support/page.tsx`** — supplier-wide inbox: all tickets across all PIQs.

### 8.2 Admin surface (under `(admin)/`)

- [ ] **`src/app/(admin)/admin/piqs/page.tsx`** — all PIQs across suppliers. Default sort: submission date desc. Filter tabs: ALL / SUBMITTED / UNDER_REVIEW / REVISION_REQUIRED / APPROVED / REJECTED. Filters: supplier, category, date range.
- [ ] **`src/app/(admin)/admin/piqs/[id]/review/page.tsx`** — split layout:
  - Left 60%: supplier info card + read-only `PIQFormEngine` + downloadable file links.
  - Right 40% (sticky): current status badge, review history, Notes textarea, Specific Issues list builder, three action buttons (Approve / Request Revision / Reject). Approve + Reject confirmation modals. Request Revision requires at least one note or specific issue.
- [ ] **`src/app/(admin)/admin/support/piqs/page.tsx`** — all PIQ support tickets across all suppliers. Filter: status, priority, supplier, date. Quick reply from list view.
- [ ] **`src/app/(admin)/admin/piq-configs/page.tsx`** — upload/manage form configs. JSON validation against the `PIQFormConfig.sections` schema. Version history.

### 8.3 Sidebar entries

Add to admin sidebar (`AdminSidebar.tsx`, gated by appropriate capabilities):
- "PIQs" → `/admin/piqs` — `cap: 'piq.review'`
- "PIQ support" → `/admin/support/piqs` — `cap: 'supplier.support.respond'`
- "PIQ configs" → `/admin/piq-configs` — `cap: 'piq.config.write'`

Add to supplier sidebar (`SupplierSidebar.tsx`):
- "Dashboard" → `/supplier`
- "My PIQs" → `/supplier/piqs`
- "Support" → `/supplier/support`
- "Profile" → `/supplier/profile`

---

## 9. Phase PIQ-4 — Integration & E2E testing

Each row is a manual flow to walk through after the previous phase is in.

- [ ] Supplier can create a PIQ, fill answers, auto-save fires + persists across reload
- [ ] Conditional questions show/hide correctly based on prior answers
- [ ] File upload works — file lands in R2, URL saved into the answer record
- [ ] PIQ submit validates all required fields before flipping status (refuses submit with friendly error if any required is blank)
- [ ] Admin can review, approve, request revision, reject — each transitions status correctly + persists notes
- [ ] Approval triggers the stage minimum check — `STAGE4_MINIMUM_MET` event fires when approved count ≥ minimum
- [ ] Stage 4 advance event flows into supplier stage update — `currentStage` becomes 5
- [ ] Supplier receives the right email at each transition (DRAFT silent, all others fire)
- [ ] Support ticket open → AZM reply → supplier reply → AZM resolve — email at each step + thread renders correctly
- [ ] `PIQFormConfig` loaded from DB renders correctly in `PIQFormEngine` (placeholder questions during dev; real ones once Magnus uploads)
- [ ] Stage progress bar updates on supplier dashboard the moment an approval happens (TanStack Query invalidation)
- [ ] 10-stage progress bar shows the right active stage on every supplier-side page

---

## 10. Stages 5–10 — placeholders

**Status: `[?]` blocked — awaiting `AZM_SupplierPortal_ClaudeBuildGuide_May2026_FullSpec.docx`.**

Once the foundation spec lands, expand each stage into its own subsection here following the same pattern as Stage 4 (concepts, status flow if applicable, schema, endpoints, components, pages, emails, e2e checks).

- **Stage 5 — Supplier Orientation**: structured intro to the platform (videos, quizzes, acknowledgements). Likely no per-product workflow — single completion gate.
- **Stage 6 — Supplier Product-Commodity Audit (SP-CA)**: physical/sample audit by AZM. Likely admin-driven with supplier upload milestones.
- **Stage 7 — Formalize Supplier Partnership**: contracts, e-sign, banking verification.
- **Stage 8 — Supplier Activation & Listing**: product placements, pricing windows, first listing day.
- **Stage 9 — Procurement & Trade Engagement**: live trading flow, POs, fulfilment.
- **Stage 10 — Continuous Supplier Engagement**: performance scoring, support, retention, expansion.

---

## 11. Cross-cutting

### 11.1 PIQ Question Set — placeholder for testing

Use this until Magnus provides the real questions. Seeded into the DB so the engine can render end-to-end before the real spec arrives.

```jsonc
{
  "category": "PLACEHOLDER",
  "label": "Test Category",
  "sections": [
    {
      "id": "s1",
      "title": "Basic Product Information",
      "questions": [
        { "id": "q1", "label": "Product Name", "type": "text", "required": true },
        { "id": "q2", "label": "Product Description", "type": "textarea", "required": true, "maxLength": 1000 },
        { "id": "q3", "label": "Product Category", "type": "select", "required": true,
          "options": ["Food & Beverage", "Cosmetics", "Apparel", "Crafts", "Electronics"] },
        { "id": "q4", "label": "Country of Manufacture", "type": "select", "required": true,
          "options": ["Nigeria", "Ghana", "Kenya", "South Africa", "Ethiopia", "Other"] }
      ]
    },
    {
      "id": "s2",
      "title": "Pricing & Production",
      "questions": [
        { "id": "q5", "label": "Unit Price (NGN)", "type": "number", "required": true },
        { "id": "q6", "label": "Minimum Order Quantity", "type": "number", "required": true },
        { "id": "q7", "label": "Monthly Production Capacity", "type": "text", "required": true }
      ]
    },
    {
      "id": "s3",
      "title": "Certifications & Documents",
      "questions": [
        { "id": "q8", "label": "Has NAFDAC / Regulatory Approval?", "type": "boolean", "required": true },
        { "id": "q9", "label": "Upload Certification Document", "type": "file", "required": false,
          "acceptedTypes": ["application/pdf", "image/jpeg", "image/png"], "maxSizeMB": 10,
          "conditional": { "dependsOn": "q8", "showWhen": [true] } },
        { "id": "q10", "label": "Upload Product Photos", "type": "file", "required": true,
          "acceptedTypes": ["image/jpeg", "image/png", "image/webp"], "maxSizeMB": 20 }
      ]
    }
  ]
}
```

### 11.2 How to swap in the real PIQ question set

1. Magnus provides the PIQ document (Word, Sheet, bullet list — any format).
2. Convert the question list to the `PIQFormConfig.sections` JSON structure (5.3).
3. `POST /api/admin/piq-configs` with the JSON, `category` matching the product category enum.
4. Form engine renders the new questions automatically — **no code changes required**.

### 11.3 Visual identity

- Navy `#0D1F4E`
- Amber `#F5A623`
- Raleway font
- Consistent with the existing admin/storefront brand frame; no new design system.

### 11.4 Capabilities to add to `lib/permissions.ts`

- `piq.review` — admin/staff can read + transition PIQ status
- `piq.config.write` — admin can upload/edit PIQ form configs
- `supplier.support.respond` — admin/staff can reply to supplier support tickets

### 11.5 Settings keys (in `Setting` table)

- `piq.minimum_required_default` — fallback when `Supplier.minimumPIQsRequired` is null. Default `1`.
- `piq.review_target_days` — used in the "PIQ Submitted" email body. Default `5`.

### 11.6 Vercel Ignored Build Step (when ready)

Project Settings → Git → Ignored Build Step (per project, two-project setup):

- **afrizonemart-v2** (storefront/admin):
  ```bash
  git diff HEAD^ HEAD --quiet -- 'src/app/(shop)' 'src/app/(auth)' 'src/app/(admin)' 'src/app/(admin-auth)' 'src/components' 'src/lib' 'public' 'tailwind.config.ts' 'next.config.js' 'package.json' && exit 0 || exit 1
  ```
- **afrizonemart-supplier-portal** (separate Vercel project, same repo):
  ```bash
  git diff HEAD^ HEAD --quiet -- 'src/app/(supplier)' 'src/components/supplier' 'src/components/piq' 'src/lib/api/supplier' 'src/lib/api/piq' && exit 0 || exit 1
  ```

  (Wire when supplier surface is large enough to make split builds worth the extra Vercel project.)

---

## 12. Open questions (need Magnus answer)

- [ ] **Foundation spec** — does `AZM_SupplierPortal_ClaudeBuildGuide_May2026_FullSpec.docx` exist? If yes, hand it over so Stages 1–3 can be built before PIQ.
- [ ] **PIQ question set format** — when Magnus provides the real questions, what format? (Word doc, Google Sheet, JSON, plain bullets?) Knowing upfront helps the conversion step.
- [ ] **Stage 4 → 5 advance** — automatic the moment a PIQ is approved and minimum met, OR admin approves the advance manually? Spec allows either; pick one.
- [ ] **Subdomain at launch?** Same domain `/supplier` for v1 (recommended). Move to `suppliers.afrizonemart.com` later, or do it day 1?
- [ ] **Supplier sign-up — open or invite-only?** Anyone can register at `/supplier/register`, or admin must add them first? Affects Stage 1 design.

---

## 13. Reference

- **Addendum**: `AZM_SupplierPortal_PIQ_Addendum_May2026_Stage4Spec.docx` (May 2026, v1.0). This tracker captures Stage 4 in full.
- **Foundation guide**: `AZM_SupplierPortal_ClaudeBuildGuide_May2026_FullSpec.docx` (referenced; needed for Stages 1–3, 5–10).
- **Existing tracker**: `ARCHITECTURE_TRACKER.md` — platform-wide implementation log. Cross-link new supplier work in there too when it lands.

---

*Authored 2026-05-05 by Claude in collaboration with Magnus (CTO, Afrizonemart). Last updated 2026-05-05.*
