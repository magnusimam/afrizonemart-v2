# Supplier journey — walkthrough log

Walking the portal stage by stage the way a supplier experiences it, fixing
what's broken as I go. One entry per issue: what I saw, why it mattered, what
I changed.

**Method:** throwaway supplier account driven against the live dev API
(`:4000`) + reading the components that render each step. Test accounts are
deleted afterwards; the real 85 suppliers and 91 PIQs are never touched.

Legend: 🔴 data loss / security · 🟠 breaks the flow · 🟡 friction

---

## Pass 1

### W-01 🟠 "Save & continue" left the journey entirely
**Stage 1 · Discovery**

Submitting Discovery redirected to `/supplier/dashboard` 1.2s later. A button
labelled *Save & continue* saved, then threw the supplier out of the flow they
were mid-way through.

**Fix** — `StageFormLive` now routes onward instead of to the dashboard.
The two remaining "Back to dashboard" buttons (Stages 5 and 7) are untouched:
those are explicit choices, not redirects.

### W-02 🟠 "Continue" jumped to the wrong stage
**Stage 1 → 2**

First fix routed to the profile's `currentStage`, which is the supplier's
*furthest* stage — so completing Discovery on a Stage-4 account skipped
Expression of Interest and landed on the PIQ surface.

**Fix** — destination is `stage + 1`, capped at 10. Continue means the next
step in the journey, never a jump forward. `completeStage` never moves anyone
backwards, so the next stage is always unlocked.

### W-03 🟡 Every journey form arrived empty
**Stages 2 & 3**

Apply captures company name, contact name, email, phone, country and category.
The very next screen — Expression of Interest — opened blank and asked for all
of it again, seconds later.

This broke the project's own rule (`PORTAL_ROADMAP` §3a: *never ask the same
thing twice*, with an editable **"Autofilled"** chip). The chip still exists in
the form engine; nothing had ever fed it. The autofill worked against the mock
data and was silently dropped in the cutover to live.

**Fix** — `getStageAnswers` seeds stages 2 and 3 from the `SupplierProfile`.
Two rules that make it safe:
- **Saved answers always beat the seed.** A supplier who corrects a pre-filled
  value never has the profile overwrite their edit on the next load.
- **Empty fields are dropped**, never seeded blank. An "Autofilled" chip on an
  empty box reads as a bug.

Stage 3's field ids were initially guessed wrong (`company_name` etc.); checked
against `PROFILE_FORM` and corrected to `legal_name`, `registration_number`,
`tax_id`, `year_established`, `num_employees`, `factory_type`,
`factory_address` before shipping.

### W-04 🔴 File uploads uploaded nothing
**Stages 2, 3 and every PIQ file question**

The worst one. The file input stored **`file.name` and discarded the file**:

```js
onChange={(e) => onChange(e.target.files?.[0]?.name)}
```

A supplier attaches their business licence, sees a green *"Selected:
licence.pdf"*, submits — and AZM holds the string `"licence.pdf"` and nothing
else. The confirmation actively reinforced the false impression that it had
worked. Same for EOI product images, banking documents, certification
documents, and the efficacy/toxicology uploads on the PIQ.

**Fix** — real uploads, both halves:
- **API** `POST /api/suppliers/me/document` (supplier-scoped). Accepts images
  *and* PDFs, because compliance paperwork is almost always a PDF, while the
  existing listing-photo endpoint is image-only. Images keep the full
  sniff/allowlist path; PDFs go through raw passthrough behind an explicit mime
  allowlist and multer's size limit. Stored under a new `supplier-docs/` prefix
  so paperwork is never mixed into public catalogue imagery.
- **Web** `FileField` in `PIQFormEngine` uploads on select, shows an uploading
  state, surfaces the real error on failure, links each stored file, and allows
  removal. The answer value is now the stored URL — matching the shape the
  imported PIQ answers already use.

Verified: PDF → `images.afrizonemart.com/supplier-docs/…`; `.exe` → 400
"Only image or PDF uploads are allowed"; no token → 401.

### W-05 🟠 An empty questionnaire could be submitted for review
**Stage 4 · PIQ**

Created a PIQ and immediately submitted it — no answers, 0% complete. The API
returned 200 and set it `UNDER_REVIEW`. That is exactly how the "Autosave Test"
record (12% complete) reached the real review queue.

The web form *does* block this correctly — it lists missing required fields and
jumps to the first gap. But the check is client-side only, so the API accepted
whatever it was sent.

**Fix** — `submitPIQ` refuses a questionnaire with no answers at all.

The API can't run the *full* required-field check, because the question schema
lives in the web app rather than the API (`PIQConfig` as a server-side model is
the proper long-term fix — it's already sketched in the backend plan §2). The
empty case is the one that actually pollutes reviewers' queues, and it's now
closed. Verified: empty → 400, one answer → 200.

### W-06 🟡 A facility visit could be booked in the past
**Stage 6 · Facility visit**

`preferredDate` was validated as `z.string().min(1).max(120)` — any text at
all. Proposed `2020-01-01`, got 200: the visits team receives a booking request
for six years ago. `"next tuesday"` was equally acceptable.

**Fix** — a real ISO `YYYY-MM-DD`, from today to a year out. The "not in the
past" comparison is done date-only in UTC, so a supplier proposing *today* from
a timezone ahead of UTC isn't wrongly rejected.

Verified: past → 400, garbage → 400, 10 years out → 400, valid future → 200,
today → 200.

### W-07 🔴 The whole journey could be skipped with one request
**Every stage — server-side**

The worst issue in this pass. A brand-new supplier at Stage 1:

```
POST /api/suppliers/me/stages/9/complete   →  200, currentStage: 10
```

Straight from Discovery to Continuous Engagement — **no product audit, no
partnership agreement, no facility visit, no PIQ review.** `completeStage`
advanced `currentStage` with no check on where the supplier actually was.

`StageAccessGate` (fixed earlier this session) is client-side, so it stops the
UI but nothing else. The server had no ordering guard at all — meaning the
entire onboarding sequence, including the compliance steps the whole programme
exists to enforce, was bypassable with a single curl.

**Fix** — `completeStage` rejects any stage beyond the supplier's current one.
Re-completing an *earlier* stage stays allowed, since suppliers legitimately go
back to revise Discovery or their EoI, and the advance logic never moves anyone
backwards.

Verified: 1→9 → 400, 1→2 → 400 (even one ahead), complete current → 200 and
advances, re-complete earlier → 200 with no regression.

---

## Pass 2 — re-walking stages 1–10

Second lap after the pass-1 fixes, this time probing edges rather than the
happy path.

### Held up ✅

| Check | Result |
|---|---|
| Apply: duplicate email / bad email / weak password / empty or 1000-char company name | 409 / 400 / 400 / 400 / 400 |
| Supplier B reads, edits, or submits supplier A's PIQ | 404 on all three; A's record untouched |
| Supplier token against all 6 admin endpoints | 403 on every one |
| Supplier PATCHes their own stage via the admin route | 403 |
| Supplier token against `/api/billie` | 401 (not a service token) |
| Stage-order guard (W-07) re-tested | 1→9 and 1→2 both 400; current stage 200 |
| Every internal link in the supplier UI (11 routes) | all 200 |
| Admin → supplier round-trip: submit → queue → request-changes → supplier sees status, summary and per-field feedback | clean |

### W-08 🟡 Suppliers can't correct their own profile
**Profile page**

`PATCH /api/suppliers/me` exists and works, but the profile page's only
affordance is **"Request a change"** → a link to the support page. So a
supplier who mistypes their phone number has to email AZM about it, despite
the endpoint being ready.

**Not fixed — this is a policy call, not a defect.** For a supplier network,
letting a company silently rewrite its own legal name, registration number or
bank details between an audit and a partnership signature may be exactly what
you *don't* want. The sensible split is probably: self-serve for contact
details (phone, contact name, website), reviewed change-request for anything
that appears on the agreement or the audit report.

Tell me which fields fall on which side and I'll wire it.

### Rate limiting works — and it stopped me
Repeated `POST /api/auth/login` during testing returned
**429 "Too many sign-in attempts. Wait 15 minutes"**. Working as intended;
noting it because it blocked the last admin round-trip (facility-visit
confirm) at the end of pass 2. That path uses the same admin→supplier
mechanism as the PIQ review round-trip verified above, and is recorded as
verified end-to-end in `SUPPLIER_BACKEND_PLAN` §6j — but I did not personally
re-confirm it in this pass. Flagging rather than claiming it.

---

## Pass 3 — the PIQ lifecycle

### W-09 🔴 An approved product could still be edited
**Stage 4 · PIQ editor**

The editor never passed a `readOnly` flag, and `updatePIQ` had no status check
— so a supplier could open a PIQ in **any** state and rewrite its answers.

Two ways that hurts:
- **While a reviewer is reading it** (`SUBMITTED` / `UNDER_REVIEW`), the
  supplier can change answers underneath them. The reviewer then approves
  something they never actually saw.
- **After approval.** An `APPROVED` product's answers could be silently
  rewritten with no re-review. For a programme built on audits,
  certifications and market-standard checks, that makes approval — and the
  audit trail behind it — meaningless.

Double-submitting also re-sent the acknowledgement email each time.

**Fix** — one rule, enforced in both places. Editable = `DRAFT` or
`REVISION_REQUIRED` (the revision loop *needs* edits). Everything else is
locked:
- **API** — `updatePIQ` and `submitPIQ` reject non-editable statuses, with a
  message that says which case it is.
- **Web** — the editor passes `readOnly`, drops the autosave/submit handlers,
  and shows a panel explaining why it's locked instead of silently discarding
  keystrokes.

Verified across all four states: DRAFT edit → 200 · submit → 200 · edit while
UNDER_REVIEW → 400 (answers verified unchanged) · double-submit → 400 · edit
during REVISION_REQUIRED → 200 · resubmit → 200 · edit after APPROVED → 400 ·
re-submit after APPROVED → 400.

---

## Pass 4 — the admin side

Same question asked of the admin surfaces: where does the server trust the
client? The supplier-side PO transitions turned out to be properly guarded
(`ISSUED → ACKNOWLEDGED → FULFILLED` is enforced). Three gaps on the admin
side were not.

### W-10 🟠 A fulfilled purchase order could be cancelled
**Admin · Activation & trade**

`cancelPurchaseOrder` set `status = 'CANCELLED'` with no check. So a PO the
supplier had already **shipped against** could be flipped to cancelled —
asserting they never delivered goods that are physically gone. It also drops
silently out of `valueFulfilled` on their Stage-10 performance card, quietly
reducing their recorded trading history.

**Fix** — `FULFILLED` and already-`CANCELLED` orders are refused, pointing at
a return or credit note instead. Verified: fulfilled → 400, issued → 200,
double-cancel → 400.

### W-11 🟡 Purchase-order deadlines were unvalidated
**Admin · Activation & trade**

`dueDate` was a bare `z.string().optional()` handed to `new Date(...)`. A
past date produced a PO overdue the moment it was issued; a non-date produced
an `Invalid Date` and a Prisma 500 rather than a clean 400. Same shape as the
facility-visit bug (W-06). Now a real ISO date, today or later.

Verified: past → 400, `"whenever"` → 400, valid future → 201.

### W-12 🔴 A completed audit could be silently overwritten
**Admin · Product audits**

Both `saveAudit` and `completeAudit` used a bare `upsert` with no status
check. A **COMPLETED** audit could therefore be re-run: new findings, a new
score, a different outcome — and another `supplier.audit.complete` email to
the supplier — with no trace of the original.

This is the audit that decides whether a supplier proceeds to Partnership or
gets routed to CallyValley, and whose report the supplier can download as a
formal PDF. Overwriting it in place destroys the compliance record it exists
to be.

The admin UI already treats a completed audit as read-only. The API didn't —
exactly the same client-trusting split as the PIQ editor in W-09.

**Fix** — both routes refuse once status is `COMPLETED`. Verified against the
one real completed audit in the database (Adia Foods, PROVISIONAL, score 90):
save → 400, re-complete → 400, and its summary was confirmed unchanged
afterwards.

**Follow-up worth a decision:** correcting a genuine error in a completed
audit now requires a database touch. The right answer is an explicit
*amendment* — a new revision carrying its own record and superseding the last,
so the history survives. Worth building before the QC team is doing this at
volume.

---

## Noted, not a code bug

- **Orientation video is served by the API.** `GET /api/orientation/video`
  streams a **741MB** local file (range requests work — 206). Fine in dev, but
  in production this streams from the app server unless `ORIENTATION_VIDEO_URL`
  points at R2/CDN. Already tracked in `PRODUCTION_CUTOVER.md` §6; flagging it
  here because it surfaced during the walk.

---

## Housekeeping done during the walk

- Deleted 2 dev PIQs ("Test New Product", "Autosave Test") that were sitting on
  **AB'S Menu's real record** — one was polluting the live review queue.
- Deleted both throwaway walkthrough accounts.
- Database back to exactly **85 suppliers · 91 real PIQs**.
