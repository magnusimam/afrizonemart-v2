# Afrizonemart Supplier Portal — Roadmap & Automation Tracker

> Living document. The **north star**: automate the entire manual supplier
> onboarding/engagement process we run today, so it is faster and scales.
> Everything below is the *real-life* flow (authoritative) — where it differs
> from the current 10-stage `SUPPLIER_STAGES`, the real-life flow wins and the
> stages will be reconciled.

Status legend: ✅ done · 🟡 in progress · ⬜ not started · 💡 idea/exploratory

---

## 0. Near-term execution plan (agreed)

1. ✅/🟡 **Consolidate mock data** into one API-shaped `src/lib/supplier/mock.ts`
   (single source for company, currentStage, PIQs, activity). Removes the
   `currentStage = 4` duplication across dashboard / stage page / PIQs.
2. ⬜ **Responsive + accessibility QA pass** across all new pages.
3. ⬜ **PIQ revision loop** (`REVISION_REQUIRED`): per-field feedback display +
   resubmit. The biggest missing functional feature.

(Then proceed down the journey-automation backlog below.)

---

## 1. The real-life journey (what we actually do → what we automate)

### Stage 1 — Discovery
Outreach / referrals / scouting. First contact.

### Stage 2 — Expression of Interest
Supplier signals interest (or responds to outreach).

### Stage 3 — Registration & Profiling
Company profile captured.

### Stage 4 — Product Questionnaire (PIQ)
One PIQ per product. ✅ Schema-driven wizard built.
- ✅ **Revision loop** (`REVISION_REQUIRED`): per-field reviewer notes shown
  inline in the wizard (flagged → "Resolved" once edited), an action banner with
  addressed-count, flagged-step dots, and a "Resubmit for review" button. My PIQs
  shows an "N changes requested" badge. Mock data: `PIQ_REVIEWS` in `mock.ts`.
- **On submit:** send acknowledgement + congratulations email. ⬜
- This whole process is **email-heavy** — see §2 (Email system).

### Stage 5 — Review call  → then Orientation
- Today: a human joins a **call** with the supplier, reviews the PIQ, asks
  questions. Outcome: either "update a few things in the PIQ" (→ revision loop)
  or "you're good → move to Orientation".
- 💡 **Automate the call with an ElevenLabs conversational calling agent** that
  conducts the review call, asks the questions, and records outcomes. ⬜
- **Orientation = a live webinar** experience. 💡 Implemented as a
  **pre-recorded video played as if live** ("evergreen webinar"): countdown
  ("starts in 1 hour / 30 min"), then a "live" player with a **simulated live
  chat** (scripted/seeded comments on a timeline) where attendees can also post.
  Most users can't tell it's a replay. After it ends, Q&A, then advance. ⬜

### Stage 6 — Facility Visit (current name: "Product Audit")
- Supplier **selects a date** from available slots.
- Booking is sent to the **Afrizonemart admin dashboard**; visible to
  **superadmin** + the **Facility Visit team/department role**. ⬜
- They coordinate, agree a date → **email to supplier with visit details**
  (time, etc.). ⬜
- **Digitized facility-visit form** (today done on paper) lives on the **admin
  side**, filled by the visiting team during the visit, then saved.
  ⚠️ **Form differs per product type / category** — *user to provide the form(s).* ⬜
- After inputs saved, the team **auto-generates a detailed visit report** →
  decision: proceed to **Partnership**, OR route to **Cally Valley**.

### "Cally Valley" program (branch out of the visit report)
- Where **Project Voltron** services live (tiers + payment options).
- The report determines: what you **lack**, what you **must** have (compulsory),
  what AZM **can help** with, and the **cost** (e.g. subscription like
  ₦30,000/month for a 5–6 month program to fix gaps).
- 💡 **Intelligent, template-driven report generation**: from the facility-form
  inputs, auto-produce the report using a template; team can **share to the
  supplier's dashboard**, **email** it, and supplier can **download** it. ⬜
  ⚠️ *User to provide:* Cally Valley detailed documentation + report template. 

### Stage 7 — Partnership
Agreement reached.

### "It's Made in Africa" production (after Partnership, before Activation)
- AZM crew makes a **documentary** of the production process + **"How it's
  made"**, and an interview series **"Meet the Producer"**. ⬜
  ⚠️ *User to provide:* It's-Made-in-Africa details.

### Stage 8 — Activation & Listing
- Supplier **re-uploads reference product images** per AZM spec (how to shoot).
- AZM **lists the product**; details routed to the **Product Upload team** in the
  Afrizonemart admin panel. ⬜

### Stage 9 — Trade Engagement
- AZM places a **bulk order**, or supplier sends **product samples** to start.

### Stage 10 — Continuous Engagement
- Ongoing purchasing. Supplier **unlocks the "Afrizonemart Supplier" badge**. ⬜

---

## 2. Cross-cutting automation systems

- ⬜ **Transactional email engine** — acknowledgement, congratulations,
  reminders, incomplete-submission nudges, stage-progress updates, visit
  details, report delivery. ("We will send a lot of emails.")
- 💡 ⬜ **ElevenLabs calling agent** — automates the PIQ review call.
- 💡 ⬜ **Evergreen webinar** — pre-recorded video as live + simulated live chat
  + countdown, for Orientation.
- ⬜ **Facility-visit scheduling** — supplier date-picker ↔ admin (superadmin +
  Facility Visit role) ↔ confirmation email.
- ⬜ **Digitized facility-visit forms** (per category) on the admin side.
- ⬜ **Intelligent report generation** — template + form inputs → report;
  push to supplier dashboard + email + download.
- ⬜ **Cally Valley / Voltron** — tiers, gap-based service recommendations,
  subscription/payment plans.
- ⬜ **Admin ↔ supplier handoffs** — facility-visit team, product-upload team
  roles and queues in the admin dashboard.

---

## 3. Current build status (UI, mock-backed)

- ✅ Dashboard (journey map, hero, animated KPIs, right rail)
- ✅ My PIQs (stats strip, status cards, add-card, support banner)
- ✅ PIQ form engine (step wizard, progressive-disclosure guidance,
  country→subdivision cascade, new fields: GTIN, HS code, packaging, Halal/
  Organic, currency, Incoterms, samples)
- ✅ Support hub (hero, contact panel, FAQ accordion, Voltron grid, CTA)
- ✅ Profile (cover header + grouped detail cards)
- ✅ Sidebar (collapsible hover-expand rail; brand mark always visible)
- ⏳ Backend: **API repo not on this machine** — everything is mock until
  `/api/suppliers/me` (+ piqs/activity/etc.) land. Keep mock shaped like the API.

---

## 3a. Form design rule (decided 2026-06-11)

**Company-level facts → Registration & Profiling (asked once). Product-level
facts → PIQ (asked per product).** Never ask the same thing twice.
- Removed from Registration as PIQ duplicates: `production_capacity`,
  `destination_markets`, `certifications_docs`.
- Kept in Registration (not in PIQ, needed downstream): facility type/address
  (→ Facility Visit), bank details, business-license upload.
- **Autofill:** `KNOWN_ANSWERS` in `mock.ts` (facts from EOI/registration) is
  passed as `initialAnswers` to every form; the engine pre-fills them and shows
  an **"Autofilled"** chip (editable). When the API lands this becomes the
  supplier's merged answer record. Open question to revisit: collect **bank
  details** at Registration vs defer to Partnership/payment stage.

## 3b. Stage UIs built (mock, 2026-06-11)

All 10 stage pages now render dedicated UI (`src/components/supplier/stages/`),
wired via a `StageBody` switch in `stages/[stage]/page.tsx`. Each file has a
clearly-marked `── MOCK ──` block to delete when the API lands.
- 1–3: forms (Discovery / EoI / Registration). 4: PIQ surface.
- **5 Orientation** (`Stage5Orientation`): review-call card + evergreen webinar
  (countdown → "live" replay player + simulated drip live-chat + input).
- **6 Facility Visit** (`Stage6FacilityVisit`): slot picker → requested state;
  what-to-expect; post-visit report → Partnership/Cally Valley preview.
- **7 Partnership** (`Stage7Partnership`): terms + accept/sign.
- **8 Activation** (`Stage8Activation`): It's-Made-in-Africa note + spec'd image
  re-upload checklist → submit to Product Upload team.
- **9 Trade Engagement** (`Stage9TradeEngagement`): bulk-order card confirm +
  samples alternative.
- **10 Continuous** (`Stage10Continuous`): verified-supplier badge + stats.
Still TODO (need backend/automation): real scheduling→admin handoff, ElevenLabs
call, true evergreen-webinar backend, intelligent report gen, Cally Valley
tiers/payment, listing handoff, email engine. Gating (locked stages) relaxed for
preview — restore when live.

## 4. Pending inputs from user (to attach)

- ⬜ Facility-visit form(s), per product type/category.
- ⬜ Cally Valley detailed documentation (tiers, services, pricing).
- ⬜ Facility-visit **report template**.
- ⬜ "It's Made in Africa" production details.

---

## 5. 💡 Exploratory — Blockchain for the broader platform (future, not scoped)

Brainstorm; impact-ranked later. Not part of the supplier portal yet.
1. **Supply-chain transparency & anti-counterfeiting** — QR-scan full product
   history; NFT-linked authenticity certificates for premium goods.
2. **Lower fees / faster payments** — crypto settlement cuts gateway fees and
   speeds cross-border payouts.
3. **Smart contracts** — escrow that releases on delivery confirmation;
   automatic refunds on missed delivery deadlines.
4. **Decentralized marketplace** — P2P buyer/seller, lower take rate.
5. **Verified reviews** — only wallets that purchased can review (kills fake
   reviews via immutability).
- Reality check: regulatory uncertainty, asset volatility, UX/key-management.
