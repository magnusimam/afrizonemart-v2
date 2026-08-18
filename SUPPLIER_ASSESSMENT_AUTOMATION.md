# Supplier Assessment Automation — specification

**Goal:** take the facility-assessment process AZM runs by hand today and make it
machinery, so the platform can go from ~100 suppliers to 10,000 without adding
assessors in proportion.

The human stays exactly where judgement is genuinely required — **rating what
they see in a facility**. Everything on either side of that becomes automatic.

| Manual today | Automated |
|---|---|
| A human reads the PIQ prose and picks a checklist | `resolve(profile, catalogue)` — deterministic, instant |
| Auditor fills a Word checklist on site (or on paper) | Structured field capture, offline-first, typed ratings |
| Someone computes the score by hand | Pure function, tested against 12 real historical audits |
| Someone writes a 12-section report in Word | Generated: boilerplate + templated + LLM-drafted narrative |
| Someone emails it | Automatic on authorise → supplier **and** admin, PDF attached |
| CAPA deadlines tracked in someone's head | Per-severity clocks, cron-driven reminders |
| Upgrade needs discussed ad hoc | Findings map to VOLTRON interventions → priced, subsidised offer |

**Status:** specification. Nothing below is built yet.
Related: `SUPPLIER_PORTAL_TRACKER.md`, `SUPPLIER_WALKTHROUGH_LOG.md`,
`SUPPLIER_BACKEND_PLAN.md`, and `PRODUCTION_CUTOVER.md` (API repo).

---

## 1. The pipeline

```
PIQ submission (supplier, Stage 4)
   ↓  derive → supplier confirms
ASSESSMENT PROFILE          structured facts: substrates, processes, claims, markets
   ↓  resolve(profile, catalogue)  ← snapshot, never recompute
CHECKLIST INSTANCE          the customised checklist for THIS visit
   ↓  auditor on site, offline-tolerant
FIELD CAPTURE               rating + finding note + evidence + photos per checkpoint
   ↓  pure function
SCORING                     score, counts, outcome
   ↓  generate
REPORT                      12 sections; methodology explained to the supplier
   ↓  auditor reviews + edits narrative, then authorises
DELIVERY                    PDF emailed to supplier + admin; visible in portal
   ↓
CAPA TRACKING               45/60/90/120-day clocks, reminders, closure evidence
   ↓
VOLTRON                     findings → interventions → tier → subsidised subscription
```

---

## 2. The governing assessment model

### 2.1 Rating scale

| Code | Name | Points | Blocks listing | Meaning |
|---|---|---|---|---|
| `C` | Critical | **0** | **Yes, absolutely** | Dangerous, illegal, or both. *One Critical fails the whole assessment regardless of score.* |
| `M` | Major | **−1 to −3** (auditor picks; default 2) | Not instantly | Significant control gap. CAPA within 90 days. Max 3 permitted for any approval. |
| `Mi` | Minor | **−0.5** | No | Isolated non-critical deviation. CAPA within 60 days. |
| `O` | Observation | **0** | No | Best-practice gap. Advisory only. |
| `Cpt` | Compliant | — | No | Meets requirement with objective evidence. The target. |
| `N/A` | Not applicable | excluded | No | Product type doesn't trigger it. |

### 2.2 Scoring — reverse-engineered from 12 published reports, verified

```
score = 100 − Σ(major_points) − (0.5 × minor_count)

Criticals deduct NOTHING.      Observations deduct NOTHING.
N/A does NOT change the base — the base is always 100.
Score carries halves.
```

**Criticals deducting nothing is counter-intuitive but correct.** They do not
reduce the score; they *override the outcome*. Eden Foods scored 91/100 and was
rejected outright on two Criticals.

Verified against Eden (91), USEDIAMEG (70), ZAO (94.5), Ritzy (82) and five
cohort rows — every one solves to ≈2.0 points per Major.

### 2.3 Outcome bands

| Outcome | Condition |
|---|---|
| **REJECTED** | any Critical ≥ 1 — *overrides everything* |
| **REJECTED** | score < 70 |
| **PROVISIONAL** | 70 ≤ score < 85, zero Criticals, ≤ 3 Majors |
| **APPROVED** | score ≥ 85, zero Criticals, ≤ 3 Majors |

Two hard gates repeated in every published report: *"Zero (0) Critical findings
on re-audit"* and *"No more than three (3) Major findings on re-audit."*

### 2.4 CAPA deadlines — per severity, deterministic

| Severity | Deadline |
|---|---|
| Critical | **45 days** |
| Minor | **60 days** |
| Major | **90 days** |
| Observation | **120 days** |

Not a flat 90 days. These map exactly onto the report's roadmap phases
(Phase 1 D0–45 / Phase 2 D0–90 / Phase 3 D0–120).

### 2.5 Existing implementation is already correct

`admin.audit.service.ts:30-53` computes exactly this. **One change needed:** it
hard-codes 2.0 points per Major; the protocol allows 1–3 and auditors do vary
(Ritzy's findings average 1.92). Major points become a per-finding input,
defaulting to 2.

### 2.6 Instruments explicitly NOT used

- `AZM Prototype Conformity Assessment and Supplier Readiness.docx` — a different
  system (Pass 3 / Fix 1 / Fail 0, max 84, bands <60/60–85/>85). **No published
  report uses it.** Treated as a superseded prototype.

---

## 3. The checkpoint catalogue

**Commitment: the catalogue is data, not code.** The supplier team — not an
engineer — must be able to add a checkpoint. Anything else fails at scale.

### 3.1 The three checkpoint classes

The protocol's own analysis identifies exactly three behaviours. Each becomes a
distinct mechanism.

**a. Always Critical, product-independent — fixed**
`A.2` NAFDAC registration · `B.4` Metal detection · `J.2` Written recall
procedure.
→ Hard-coded severity. The auditor may rate only `Cpt` or `C`. No downgrade,
no override.

**b. Conditionally Critical — driven by the Assessment Profile**
Critical only if the product triggers it; otherwise the checkpoint **drops out
entirely** rather than appearing as N/A clutter.

| Trigger | Activates |
|---|---|
| cassava | `D.4` HCN reduction, `F.3` HCN batch testing |
| legumes / composite + shared lines | `D.3` allergen segregation, `H.3` allergen declaration |
| fortification claimed | `A.5` certificate, `F.5` assay per batch, `H.4` NRV declaration |
| maize / sorghum / groundbean | `C.3` aflatoxin intake screening, `F.2` escalation |
| fermented (ogi, fufu, lafun) | `D.6` fermentation monitoring |
| instant / gelatinised | `D.5` gelatinisation validated |
| declared export markets | `K.1`, `K.2` |

**c. Severity-by-degree — the auditor's judgement**
Most of Sections B–I. The same missing control rates Minor, Major or Observation
depending on whether it is a documentation gap, a real physical exposure, or a
confirmed event.
→ The checkpoint carries an **allowed range**; the UI offers only ratings in
that range; **choosing above the default requires a justification note.** This
is what keeps severity consistent once a field team replaces two experts — the
single biggest quality risk in this whole programme.

**d. Red Flag escalation** — a *confirmed* exceedance (aflatoxin, HCN), mould
with no quarantine, or clearly unsafe water forces Critical regardless of the
checkpoint's normal band. A separate `confirmedFinding` flag on the response.

### 3.2 Checkpoint shape

```ts
interface Checkpoint {
  ref: string;                 // "A.2" — stable, human-quotable, appears in the report
  section: string; order: number;
  text: string;                // verbatim requirement
  guidance?: string;           // what "good" looks like — inline help
  evidence?: EvidenceKind[];   // certificate | photo | log | coa | measurement

  severityClass: 'FIXED_CRITICAL' | 'CONDITIONAL' | 'BY_DEGREE';
  defaultIfAbsent: Rating;
  allowedRange?: Rating[];     // BY_DEGREE only
  majorPoints?: 1 | 2 | 3;     // default deduction when rated M

  appliesWhen?: Rule;          // absent = always
  escalateWhen?: EscalationRule[];

  // report-generation libraries, keyed by ref
  defaultOwnerDept: string;    // "Production / Engineering"
  defaultClosureText: string;  // reused verbatim in §4 tables and §8 CAPA
  cardTemplate?: string;       // §4.1/4.2 detail card skeleton

  standards?: string[]; limits?: LimitSpec[];
}
```

### 3.3 The rule language

Deliberately tiny — a DSL invites a debugger.

```ts
type Rule =
  | { all: Rule[] } | { any: Rule[] } | { not: Rule }
  | { fact: string; op: 'eq'|'in'|'contains'|'gt'|'lt'|'isTrue'; value?: unknown };
```

```jsonc
// D.4 — HCN reduction for cassava
{ "fact": "substrates", "op": "contains", "value": "cassava" }

// D.3 — allergen segregation: legumes AND shared lines
{ "all": [
    { "any": [ { "fact": "substrates", "op": "contains", "value": "soy" },
               { "fact": "substrates", "op": "contains", "value": "groundnut" } ]},
    { "fact": "sharedProductionLines", "op": "isTrue" } ]}
```

**Every resolution records its reason.** A checklist item stores
`includedBecause: "substrates contains cassava"`, rendered in the report. That
turns an opaque score into an explainable one — the difference between a report
people trust and one they argue with.

### 3.4 Resolve once, snapshot, never recompute

When a report is challenged eight months later — and at 10,000 suppliers it will
be — we must show the *exact* checklist used, which catalogue version was in
force, and why each checkpoint was on it. Live re-resolution against a
since-edited catalogue would silently give a different answer.

---

## 4. Assessment Profile — the missing input

**The PIQ as it exists cannot drive this.** It is a merchandising questionnaire —
every "why this matters" note in the guideline is about discoverability and
conversion. The facts the engine needs are free text or absent:

- *"Contains cassava?"* → `Ingredients` is comma-separated prose. **Garri, fufu
  and lafun are all cassava and never say the word.**
- *"Claims fortification?"* → not asked at all.
- *"Fermented?" / "Instant?"* → not asked at all.
- Category is `Food / Fashion / Tech / Home / Health / Other`, but we have
  separate templates for edible oils, flours, baby cereal, snacks, honey and
  black soap — **all six are "Food" or "Health".**

### 4.1 The new structured block

Every field an enum or multi-select, never prose:

| Field | Type | Drives |
|---|---|---|
| `productClass` | taxonomy leaf | which category template applies |
| `substrates[]` | multi-select | C.3, D.4, D.6, F.2, F.3 |
| `processes[]` | multi-select | D.1, D.5, D.6, E.1 |
| `labelClaims[]` | multi-select | A.5, F.5, H.4 |
| `allergensPresent[]` | multi-select | D.3, H.3 |
| `sharedProductionLines` | boolean | D.3 escalation |
| `targetMarkets[]` | multi-select | K.1, K.2 |
| `packagingType[]` | multi-select | H.1 |
| `metalContactSteps` | boolean | B.4, D.2 |
| `waterUsedInProcess` | boolean | E.3 |

### 4.2 Derive, then confirm

Pre-fill from what the PIQ already holds (a product named "Garri", or cassava in
the ingredient list, pre-ticks `cassava`), then show the supplier for
**confirmation**. Keeps the added burden small, and a supplier confirming a
pre-tick is a far stronger evidentiary position than us inferring it silently.

The existing PIQ engine already supports conditional questions
(`conditional: {dependsOn, showWhen[]}` in `piq-config.ts`), so this extends the
current form rather than needing a new one.

### 4.3 Governance
- **Snapshotted onto the checklist at resolve time** — editing the profile later
  must not retroactively change a completed audit.
- **Not freely supplier-editable once an audit is open.** Same reasoning as W-15:
  a silent change between assessment and signature invalidates both.

### 4.4 We already have 30+ worked examples
The `Distribution Audit Master Index` classifies real products into categories
with a *"Why It Sits Here"* rationale — *"Cassava flour: root processing requires
validation of cyanide reduction"*, *"ELEXPEANUT: roasted nuts require strict
aflatoxin monitoring"*. That is a ready-made validation set for the routing
rules: the engine's category choice should reproduce the human's.

---

## 5. Field capture

**Offline-first, device-agnostic.** Works on a phone in a factory with no signal,
and equally on a laptop or tablet. Ratings queue locally; when connectivity
returns it syncs automatically and the report becomes generatable. Online mode
syncs continuously.

Per checkpoint the auditor records:
- **rating** (constrained to the checkpoint's allowed range)
- **finding note** — free text. *These get quoted verbatim into the report*
  (real reports quote assessor notes in caps: `"NOT YET, IN VIEW"`,
  `"THEY BATCH PER FARM FOR NOW"`), so this field is load-bearing, not a comment.
- **status gloss** — 2–6 words for the dashboard ("Verified on-site",
  "Not logged per batch", "Practised informally")
- **evidence** — photos, document references
- **walkthrough section ref + result** (OK / NOK / Not Observed) — the published
  reports cite a *second* instrument (`Walkthrough Section 5.1`) distinct from
  the matrix; it must be captured or the Evidence Basis text can't be generated.
- **justification** — mandatory when rating above the checkpoint default

Plus assessment-level: attendees, facility details, GPS, photos, pre-visit
document submission record.

**Gaps must be first-class.** Not every business is set up the same way, so the
auditor can mark a checkpoint N/A with a reason, and add an ad-hoc finding that
isn't in the catalogue (the real reports contain one — an un-ref'd CAPA row for
a hazard the matrix didn't cover).

---

## 6. Report generation

Twelve sections, identical skeleton across protocols — only the checkpoint
catalogue differs. **One generator, many protocols.**

**The checkpoint ref is the join key.** A single finding record populates six
sections: §3 dashboard → §4 card/row → §6 gap register → §7 roadmap → §8 CAPA →
§9 milestones.

### 6.1 The split

**~20% boilerplate · ~68% templated · ~12% authored**, once per-checkpoint
template libraries exist (the metal-detection and recall cards are 85–95%
identical across every real report).

Fully derivable, zero authoring: §3 dashboard, §4.3 Minor, §4.4 Observations,
§6 gap register, §8 CAPA, §9a milestones, §9b conditions, §10 standards.

Libraries, each a pure lookup keyed by checkpoint ref: `closureText`,
`capaOwner`, `cardTemplate`; plus `technicalNote` keyed by ingredient/process
and `standardRef`.

### 6.2a Drafting implementation

`assessment/narrative.ts`, Claude Opus 5 via the official SDK.

- **Structured output** — one call returns all four passages against a JSON
  schema, rather than four calls or a prefill (prefills are rejected on this
  model anyway).
- **Adaptive thinking at high effort.** These are judgement calls attached to a
  rejection decision; the latency is worth it.
- **Prompt caching.** The house-style guide is a frozen constant carrying the
  cache breakpoint, and nothing supplier-specific precedes it — so the prefix is
  byte-identical across reports and read at a tenth of the price after the
  first. A test asserts two different suppliers produce identical prefixes *and*
  genuinely different briefs, so the check isn't vacuous.
- **Refusal handling with fallbacks.** Safety classifiers return a normal 200
  with `stop_reason: "refusal"`, not an error — plausible here, since the source
  material is full of contamination, toxin and adulteration language. Server-side
  fallback is opted into so a false positive doesn't lose the request.
- **Failure is never fatal.** No API key, a decline, malformed JSON, a missing
  field, or a network error all return `null` and leave the slots empty — the
  auditor writes them by hand exactly as today. A report is never blocked.
- **Cohort claims are gated.** Comparative superlatives ("the lowest Minor count
  in this cycle") run through every shipped report and can't be verified without
  peer data, so with no cohort supplied the brief forbids comparisons outright.

**Config:** `ANTHROPIC_API_KEY` (absent ⇒ feature off),
`ASSESSMENT_NARRATIVE_MODEL` (default `claude-opus-5`).

### 6.2 The authored ~1,000 words — LLM drafts, auditor edits

The executive-summary narrative, conditional callouts and §9 decision paragraph
are generated from the matrix + assessor field notes + cohort context, then
**presented to the auditor to edit before authorising**. The existing two-step
`Complete → Authorise` gate is exactly the right review point: completing scores
and locks the matrix, authorising releases the report and emails the supplier.

Never auto-release unreviewed. These reports make rejection decisions about real
businesses.

### 6.3 House rules for the generator
- **British spelling throughout** — practised, formalise, programme, colour,
  sulphite. Never American.
- Never accusatory. Pattern: **acknowledge what exists → name precisely what is
  missing → state the consequence.**
- Risk Implication closes by naming the standard/authority or the concrete
  consumer harm.
- The methodology (§2 Risk-Based Scoring Legend) is **printed in every report**,
  so the supplier can see how the score was calculated — a stated requirement.
- Comparative cohort sentences ("the lowest Minor count of any supplier in this
  cycle") are pervasive → **the generator needs cohort context**, or they must be
  suppressed.

### 6.4 No precedent for a pass
All twelve historical assessments are REJECTED. **APPROVED and PROVISIONAL
report variants have no house example** and must be written from scratch.

### 6.5 PDF and delivery — BUILT

`report-html.ts` renders the whole 12-section document to self-contained HTML —
inline CSS, no fonts, no images, no scripts. `pdf.ts` prints that same markup
with headless Chrome. **One renderer feeds both the emailed PDF and the portal
view**, which is the entire reason for using a browser rather than a PDF
library: a second layout definition would drift, and the first person to notice
would be a supplier holding an attachment that disagrees with their portal.

Verified end to end: a real report renders to a valid 345 KB PDF.

**Browser lifecycle.** Launched lazily on first use, shared across renders, and
closed on `SIGTERM`/`SIGINT` — Chromium is a child process and orphaned
instances otherwise accumulate across restarts. A crashed browser is discarded
and relaunched rather than wedging every subsequent report. Container args
(`--no-sandbox`, `--disable-dev-shm-usage`) are set because the default sandbox
needs privileges a slim image doesn't grant and `/dev/shm` is typically 64 MB.

**Everything degrades.** A failed render returns null; the audit still
completes, the supplier still gets their verdict email, and the report is still
readable in the portal — just without an attachment. Blocking a signed
assessment because Chromium wouldn't start would be far worse than a missing
PDF.

**Escaping is load-bearing.** Supplier names come from a self-service form,
assessor notes are typed on a phone in a factory, and the narrative is
model-drafted. All three reach this markup and all three are escaped, with
tests firing hostile input through each path.

**Delivery.** On authorise the report goes to the supplier *and* to the QA
inbox, PDF attached to both. The admin copy is a separate template — the
supplier's opens *"Hi {name}, our team has completed the audit of your
facility"*, which reads as nonsense in a QA inbox — and each recipient is sent
independently so one bad address in the config doesn't cost the others their
copy. An admin-copy failure never surfaces as a failed authorisation; the
supplier has already been served.

Recipients: `ASSESSMENT_REPORT_ADMIN_RECIPIENTS`, defaulting to
`EMAIL_REPLY_TO` so a released report always leaves an internal record.

**`reportSlug` added to `SupplierAudit`** (same migration). Stored rather than
derived, per the finding in §6.3: the shipped reports are inconsistent about it
(Eden Foods → `EDEN`, Oluwatoyin Integrated Farms → `ZAO`), so no rule
reproduces them. A crude fallback covers audits with none recorded.

---

## 7. Delivery & CAPA tracking

- On authorise: PDF to the **supplier and admin**, report visible in the portal.
- CAPA clocks start at issue: Critical 45 / Minor 60 / Major 90 / Observation 120.
- Supplier submits closure evidence per finding; admin reviews and closes.
- Reminder cron reuses the proven pattern already in the repo: bounded windows,
  idempotency marker after successful send, batch cap, **dry-run by default**.
- Re-assessment path: a re-audit is a new assessment carrying a `supersedes`
  link, so history survives (this also answers the outstanding W-12 amendment
  question).

---

## 8. VOLTRON

**V.O.L.T.R.O.N** — *Value-Oriented Linkage for Trade, Revenue, Offtake and New
Enterprise Growth.* AZM's commercialisation engine: the upgrading programme that
takes a supplier from "we make something" to "market-ready, listed, receiving
repeat orders."

*(All GIZ/donor-proposal framing — the pilot targets, budget envelope, logframe,
partnership governance — is deliberately excluded. It belongs to a funding
document, not the product.)*

### 8.1 Commercial model — priced, with subsidy

Each tier has a **real list price**. Donor or grant funding **subsidises a
percentage** for eligible suppliers; the supplier pays the balance. Pro-bono is
simply the case where subsidy = 100%.

This reconciles the signed consent agreement (clause C.5 promises pro-bono under
the VOLTRON Initiative) with a commercial product: existing funded suppliers see
100% subsidy and pay nothing, while unfunded suppliers see a real price. It is
also the structure the concept note already describes — 50% grant, 50%
convertible.

```
Subscription { tier, listPrice, subsidySource, subsidyPct, supplierPays, status, term }
```

### 8.2 The three tiers

| Tier | Standard |
|---|---|
| **Bronze** | Domestic market ready |
| **Silver** | AfCFTA market ready |
| **Gold** | Global market ready |

### 8.3 The nine intervention areas

1. **Product Science** — PIQ · facility audit · SOP creation · improvement development plan · experts coaching · legal standards
2. **Product vetting** — performance (strength, durability, longevity) · authenticity guaranty · quality warranty · safety standards (ISO 45001 / ISO 22000 / GFSI) · certificate of claim
3. **Product certification readiness** — MANCAP/SON · NAFDAC/NAQS · traceability / AfCFTA ROO · ISO 9001 QMS · product reviews
4. **IP/IPR asset development** — unique identifier · market differentiation · validated Geographic Indication "Made in Africa" badge
5. **Packaging & labelling** — consumer sales psychography · regulatory compliant · package design/redesign · language support · destination market
6. **Product promotions** — 2 ads per product · brand website · sales funnel engineering · ISO 14001
7. **Supplier agreement** — procurement order conditions · sample quantity · market intelligence · bulk purchase orders
8. **"It's Made in Africa" documentary** — 1–2 min *Meet the Producer* · 3 min *Product Storytelling* · 5–10 min *How It Is Made*
9. **On-demand business support** — 9a legal interlocutor · 9b taxation · 9c insurance · 9d product management data

### 8.4 Why it belongs next to the audit

The audit already states precisely what is wrong. Every finding is a gap, and
every gap maps to an intervention someone must be paid to close:

```
audit finding → intervention area → tier that covers it → subsidised subscription
```

**The assessment is the lead-generation mechanism for the upgrading service.**
That is the commercial engine of this entire build.

Most intervention rungs already exist in the portal — the PIQ (Stage 4), the
facility audit (Stage 6), Take50 production (Stage 8), purchase orders
(Stages 9–10). VOLTRON is largely a **commercial framing layer** over
capabilities we have or are building. Genuinely new: the subscription object,
the subsidy model, and the finding→intervention mapping.

### 8.5 ⚠️ Open — tier ↔ deliverable mapping
The source matrix has two unreconciled axes: 3–6 deliverables per intervention
row, and a separate Bronze/Silver/Gold header, with no visible assignment of
deliverable to tier. **Working assumption: cumulative ladder** (Bronze = early
rungs, Silver adds middle, Gold adds the rest), matching domestic → AfCFTA →
global. Must be confirmed before encoding — it decides what each tier sells.

---

## 8a. Wiring status

**Done and under test (163 tests passing, module typechecks clean):**

| Piece | State |
|---|---|
| Scoring engine | built; live `POST /complete` now uses it |
| Rules engine | built |
| Assessment Profile types | built |
| Checkpoint catalogue + core protocol (43) | built |
| Checklist resolver + snapshot | built |
| Generated protocols (7, 310 checkpoints) | built |
| `POST /:supplierId/checklist` — issue a checklist | built |
| Completion judged against the issued checklist | built |
| Findings derivation (`findings.ts`) | built |
| Report generator (`report.ts`) | built |
| LLM narrative drafting (`narrative.ts`) | built |
| Report HTML renderer (`report-html.ts`) | built |
| PDF renderer (`pdf.ts`, headless Chrome) | built |
| Delivery on authorise — supplier + QA copy, PDF attached | built |
| Migration `20260817000000_audit_score_halves` | **written, not applied** |

### Three live behaviour changes
Each corrects the code to match the published reports, and each is covered by
`tests/audit-service-scoring.test.ts`:

1. **Scores keep halves.** Previously rounded to an integer because the column
   was an `Int`; ZAO's report says 94.5 and the stored record said 95.
2. **Major severity is per finding** (1–3 band), previously hard-coded to 2.
3. **The ≤3 Major cap now gates PROVISIONAL too**, not just APPROVED.

### On the column type — `Float`, not `Decimal`
Scores are constrained to whole numbers and halves, and **0.5 is exactly
representable in binary floating point**, so there is no drift to guard against
(that risk applies to values like 0.1). `Decimal` would additionally change the
Prisma client type from `number` to a Decimal object, rippling `.toNumber()`
through every caller that reads the score for an email, dashboard or trade gate.

### Migration not yet applied
The dev Postgres was unreachable. The migration widens `indicativeScore` to
`DOUBLE PRECISION` (lossless — existing integers survive) and adds
`protocolCode`, `protocolVersion`, `checklistSnapshot` and `assessmentProfile`.
Historical scores stay rounded: the true half was lost when they were written
and cannot be recovered from the stored value.

---

## 9. Build order

1. **Checkpoint catalogue + rules engine + scoring** (API, pure logic, heavily
   tested against the 12 historical assessments)
2. **Assessment Profile** — PIQ extension, derive-then-confirm
3. **Checklist resolution + snapshot**
4. **Field capture** — offline-first admin surface
5. **Report generation** — libraries first, then the LLM narrative pass
6. **PDF + delivery**
7. **CAPA tracking + reminders**
8. **VOLTRON** — subscription, subsidy, finding→intervention mapping
9. **Cohort/executive reporting** (admin + funder facing)

Steps 1–3 are the foundation; nothing downstream is meaningful without them.

---

## 9a. ⚠️ The deployed audit templates are a stale generation

**This is the most serious finding of the analysis and it changes the build
order.** Verified in code and locked into `tests/assessment-legacy-adapter.test.ts`.

`audit-templates.ts` — the templates auditors actually use today — was generated
from an **older, shorter** set of category checklists than the governing Audit
Protocol and the current sample documents. For flours (category A) it holds 31
checkpoints across sections A–L, against the protocol's 43 across A–K.

**14 governed controls have no equivalent at all:**
`A.4` HACCP · `A.5` fortification certificate · **`B.4` metal detection** ·
`C.4` one-step traceability · **`D.4` cassava HCN reduction** · `D.5`
gelatinisation · `D.6` fermentation monitoring · `E.4` PPE · `F.4` microbial
analysis · `F.5` fortification assay · `G.3` stability studies · `I.3` FIFO/FEFO
· `J.3` complaint log · `K.2` Certificate of Origin.

**And 6 refs mean something completely different in each:**

| Ref | Governing protocol | Deployed template |
|---|---|---|
| A.3 | SON / NIS compliance | Trademark / IP protection |
| **C.3** | **Aflatoxin screening at intake** | Traceability system |
| H.3 | Full label declarations | Shelf-life claims |
| H.4 | Micronutrient NRV declaration | Label ingredient declarations |
| **J.2** | **Written, drilled recall procedure** | Staff training records |
| K.1 | AfCFTA / FDA / EU alignment | Production waste disposal |

### Why this matters commercially, not just technically

1. **The Master Index routes cassava flour to this template** with the rationale
   *"root processing requires validation of cyanide reduction"* — and the
   template contains no cyanide checkpoint. Cassava suppliers cannot currently
   be assessed on the hazard they were routed there for.
2. **Metal detection (B.4) and intake aflatoxin screening (C.3) are both
   unassessable.** Those are precisely the findings that rejected Eden Foods and
   two of Ritzy's four Criticals. **A supplier cannot currently be failed for the
   things that actually failed real suppliers.**
3. **The shipped reports cite B.4, D.4 and J.2 — refs that do not exist in the
   deployed template.** The reports were written against the newer protocol
   while the code runs the older one. The two have been out of step all along.

### Consequence for the build

The legacy templates **cannot be the foundation**. The current document set (the
governing protocol plus the new category samples) is the source of truth. The
legacy file is retained only as a checkpoint-text corpus and as the thing the
coverage test measures against — `coverageGapsAgainstCore()` turns staleness
into a test failure rather than a discovery someone makes months later.

**Note the ref-collision trap:** a diff comparing ref *sets* reports J.2 as
covered. Inheriting severity by ref would have attached `FIXED_CRITICAL` recall
severity to a staff-training checkpoint, and auto-rejected suppliers for an
undocumented training matrix. The adapter therefore inherits nothing and reports
all 197 checkpoints as needing severity assignment.

---

## 9b. The replacement catalogue — BUILT

Generated from the current checklists by `supplier-docx/gen-protocols.py`, which
supersedes `gen.js`. Two source shapes, both parsed at **100 % capture**: every
rating cell yields exactly one checkpoint, and no ref sequence has a gap.

| Protocol | Checkpoints | Sections | Severity |
|---|---|---|---|
| `AFZ-QA-FPS-001` Flours, Swallows, Cereals & Powdered Staples | 43 | 11 | **inherits core** |
| `AFZ-QA-EOB-006` Edible Oils, Functional Botanicals & Infusions | 36 | 8 | unassigned |
| `AFZ-QA-SNK-001` Snacks, Nuts & Ready-to-Eat Dry Foods | 39 | 8 | unassigned |
| `AFZ-QA-FFC-001` Fashion, Footwear & Crafted Lifestyle | 36 | 8 | unassigned |
| `AFZ-QA-HRA-004` Honey & High-Risk Apiculture | 58 | 12 | unassigned |
| `AFZ-QA-HPC-006` African Black Soap, Cosmetics & Personal Care | 54 | 4 | unassigned |
| `AFZ-SQA-BCRL-001` Baby Cereal & Infant Foods | 44 | 8 | unassigned |
| **Total** | **310** | | |

**310 checkpoints against the stale file's 197** — a 57 % increase in what can
be assessed at all.

### Two independent validations
1. **Edible oils comes out at exactly 36**, which is the number ZAO's published
   diagnostic report states: *"The EOB protocol contains 36 checkpoints."*
2. **Flours matches the governing protocol ref for ref** — 43 checkpoints,
   sections A–K, per-section counts identical (A:5 B:4 C:4 D:6 E:4 F:5 G:3 H:4
   I:3 J:3 K:2). The governing Audit Protocol document simply *is* the flours
   protocol, which is what makes severity inheritance defensible there.

### What this fixes
- The three universal Criticals are restored to flours, including **B.4 metal
  detection**, which the deployed template could not assess.
- **D.4 / F.3 cassava cyanide control** exist again, so cassava suppliers can
  finally be assessed on the hazard the Master Index routes them for.
- **Baby cereal gets its own protocol** instead of being folded into flours.
  Infant food is the highest-consequence category on the platform and was being
  assessed without its trypsin-inhibitor, heavy-metal and sulphite checkpoints.

### Outstanding
- **267 checkpoints across six protocols still need severity assigned** by the
  standards team — listed by `checkpointsAwaitingSeverity()`. Until then they
  are `BY_DEGREE`, bounded Minor–Major, and **cannot auto-fail a supplier**.
  Nothing inherits by ref, because refs are independent between protocols
  (honey's C is moisture control, black soap's C is heavy metals).
- **Black soap yields only 4 section titles** of ~10. Checkpoints are all
  present and correctly reffed; only the section headings need filling in.
- **Honey parses 58 from the DOCX and 61 from the PDF.** The DOCX is cleaner and
  is what's used; the 3-checkpoint difference needs reconciling against the
  signed original.

---

## 10. Issues found in the existing code (pre-existing, uncommitted branch)

1. **`getAuditTemplate()` takes unvalidated free text** — both the visit form and
   the audit pass an arbitrary category string and silently receive `null`. No
   mapping exists from any product/profile field to templates A–F.
2. **Visit-form `observations` are never copied into the audit on submit** — the
   keys are client-invented and unvalidated, so field data is captured and then
   dropped.
3. **`completeAudit` requires *every* template checkpoint to be rated** — a
   customised subset (the entire point of this work) fails as written.
4. **Templates B–F have empty `preVisitDocs` / `standards` / `categoryChecks`**,
   so the visit form renders almost nothing for five of six categories.
5. **Template F contains 18 pseudo-checkpoints** scraped out of prose blobs (a
   classification matrix, a document list, a decision table) that are scored like
   real checkpoints and must be rated before completion.
6. **CAPA is an unlinked free-text blob** — no checkpoint link, no status enum,
   no due date type, no closure workflow.
7. **Cohort report lists Ritzy at 42; its own report says 82.** 42 is
   arithmetically impossible. A data error to correct at source.
8. **The consent agreement has no publication clause** — it does not authorise
   AZM to publish scores or share reports with third parties, yet the cohort
   report names suppliers and scores to GIZ. Legal gap, flagged not fixed.

---

## 11. Open questions

- **Tier ↔ deliverable mapping** (§8.5) — blocks encoding the tiers.
- **Category F vs the Master Index's five.** The index defines five categories
  (A–E); the code has six, with F = Fish/Meat/Eggs/High-Risk Animal. Honey is
  assessed under F (`AFZ-QA-HRA-004`). Baby cereal (`AFZ-SQA-BCRL-001`) and black
  soap (`AFZ-QA-HPC-006`) use codes outside the six. **Is the taxonomy 5, 6, or
  growing?** This determines whether category is an enum or a table.
- **Protocol code drift** — the same category appears as `AFZ-QA-OBI` in code and
  `AFZ-QA-EOB-006` in the published reports. Which is canonical?
- **Auditor identity on the report.** Published reports never name the assessor —
  only role titles. The schema now has `signedBy`. Do we start naming them?
- **Cohort context** for comparative sentences — what defines a "cycle"?
