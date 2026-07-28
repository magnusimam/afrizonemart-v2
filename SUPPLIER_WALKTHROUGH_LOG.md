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

---

## Housekeeping done during the walk

- Deleted 2 dev PIQs ("Test New Product", "Autosave Test") that were sitting on
  **AB'S Menu's real record** — one was polluting the live review queue.
- Deleted both throwaway walkthrough accounts.
- Database back to exactly **85 suppliers · 91 real PIQs**.
