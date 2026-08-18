# Supplier assessment automation — outstanding work

Handoff as of **2026-08-18**. Design and rationale live in
`SUPPLIER_ASSESSMENT_AUTOMATION.md`; this file is only what is *left to do*.

---

## 0. Blocking / time-sensitive

### 0.1 🔴 SPF does not authorise Resend — live deliverability bug
`afrizonemart.com` publishes:

```
MX   → inbound-smtp.us-east-1.amazonaws.com   (Amazon SES inbound)
SPF  → v=spf1 include:amazonses.com ~all
```

The app sends through **Resend**, which is not in that SPF record, so **every
supplier email currently fails SPF**. `~all` is a softfail so mail may still
land, but it skews toward spam. With 83 real businesses on the list this needs
fixing before any campaign runs.

Fix — one merged TXT record (SPF must never be split across two records):

```
v=spf1 include:amazonses.com include:_spf.resend.com ~all
```

Add Resend's DKIM records at the same time.

### 0.2 🔴 No mailbox behind `suppliers@afrizonemart.com`
Mail **is** accepted (SES inbound), but SES has no inbox — it hands messages to
a receipt rule (S3 / Lambda / forward). Replies are likely sitting in an S3
bucket or being dropped.

1. Check the **SES console** (us-east-1 → Email receiving → Rule sets) to see
   where mail goes today. Do this *before* changing MX — something may already
   be parsing replies from S3, and switching MX would silently break it.
2. Stand up a real mailbox. Google Workspace is the natural choice (a
   `google-site-verification` TXT record already exists). Replace the SES MX
   with Google's five MX records.
3. Create `suppliers@afrizonemart.com` as a **shared inbox / group**, not one
   person's account.

`SUPPLIER_EMAIL_SEQUENCE.md` §6 lists reply-to as an open decision and its
Principle 6 depends on a human reading replies — this closes that.

### 0.3 Demo data for the presentation
All 10 stages are **unlocked** for `adia@adiafoods.ng` (`currentStage: 10`), but
almost every stage is **empty**: 1 audit, and 0 PIQs / facility visits / review
calls / purchase orders / production bookings.

Seed believable content per stage so each screen shows the flow working:

| Stage | Needs |
|---|---|
| 4 Product Questionnaire | 2–3 PIQs in mixed states (approved / under review) |
| 5 Orientation | a completed review call + orientation record |
| 6 Product Audit | ✅ done — Adia Foods, 92/100 REJECTED, awaiting authorisation |
| 7 Partnership | a signed consent / agreement record |
| 8 Activation & Listing | a production booking (Take50) + a published listing |
| 9 Trade | 1–2 purchase orders |
| 10 Continuous | a review / feedback entry |

Extend `scripts/seed-test-audit.ts` (same `[TEST DATA]` marker + `--remove`
convention) or add a sibling `scripts/seed-demo-journey.ts`.

Also worth adding: **1–2 more audits in other outcome states** (APPROVED,
PROVISIONAL) so the audit queue isn't a single row. No published report in the
corpus is anything but REJECTED, so those two report variants have never been
seen end to end.

---

## 1. Deployment split (production vs local demo)

Goal: production redeployed **without** mock data; the seeded demo stays local.

- **Harden the seed scripts.** They currently guard on `NODE_ENV === 'production'`
  only. That is not enough — a local shell pointed at the production
  `DATABASE_URL` would happily seed it. Add a check that the target database is
  not the production host, and require an explicit `--yes-seed-demo` flag.
- Decide whether `scripts/seed-supplier.ts`, `seed-amineru.ts`,
  `seed-test-audit.ts` ship in the deploy at all.
- Confirm the Vercel ignored-build-step config in
  `SUPPLIER_PORTAL_TRACKER.md` §11.6 still matches the current path layout.
- Production needs `ANTHROPIC_API_KEY` (or the narrative slots stay empty) and
  a Chromium-capable runtime for the PDF renderer (`puppeteer`, ~300 MB).

---

## 2. Commit the work

Both repos hold a large uncommitted body of work with **no rollback point**.
Land in themed slices rather than one blob:

1. assessment engine (scoring, rules, profile, catalogue, resolver, protocols)
2. report generation (findings, report, report-html, pdf)
3. narrative drafting (Claude integration)
4. delivery (notify + templates + authorise wiring)
5. admin UI fixes (page padding, audit editor rewire)
6. migration + seed scripts

---

## 3. Known issues / decisions still open

- **Ritzy / Varli / P.P. score discrepancy.** Each lands exactly 0.5 from its
  published score, and the published values round inconsistently (82 and 85 up,
  65 down). Most likely those auditors used the 1–3 Major band rather than a
  flat 2. Pinned in `tests/assessment-scoring.test.ts` with a `TODO(QA)` —
  needs the assessment team to confirm.
- **267 checkpoints across 6 protocols have no severity assigned.** They are
  `BY_DEGREE`, bounded Minor–Major, and cannot auto-fail a supplier.
  `checkpointsAwaitingSeverity()` returns the worklist. Refs are per-protocol so
  nothing can be inherited safely.
- **Voltron tier ↔ deliverable mapping** unconfirmed (`voltron-model.md` §3) —
  blocks encoding Bronze/Silver/Gold.
- **Black soap** parses only 4 section titles of ~10 (checkpoints all present).
- **Honey** parses 58 from DOCX vs 61 from PDF — reconcile against the signed
  original.
- **Consent agreement has no publication clause** — it does not authorise AZM to
  publish scores or share reports with third parties, yet the cohort report
  names suppliers and scores to GIZ. Legal gap, flagged not fixed.
- **`npm run build` fails in the API repo** — `tsc` OOMs even at 6 GB. Predates
  this work; will bite a deploy. The assessment module typechecks clean in
  isolation.
- **Filter/tab styling** differs across the six supplier admin pages (three
  treatments). Left alone deliberately — filters and tabs are arguably distinct.

---

## 4. Environment notes (for a fresh session)

- Postgres: Docker container **`azm-pg`** on **5433**. Do **not** run
  `docker compose up` — the compose file uses a *different* named volume and
  starts empty. Backup taken at `.backups/pre-assessment-20260817-152557.dump`.
- The DB has **no `_prisma_migrations` table** — it is managed by `db push`, so
  `prisma migrate deploy` fails against it. Apply migration SQL directly, then
  `prisma db push` to confirm no drift.
- API `npm run dev` → :4000. Web `npm run dev -- -p 8085` → :8085.
- Test accounts (dev only, delete before prod):
  `admin@afrizonemart.test` / `Admin123!` (ADMIN) and
  `adia@adiafoods.ng` / `Supplier123!` (supplier, all stages unlocked).
- Admin sign-in is at **`/admin/login`**, not `/login`.
- The login rate limiter is **in-memory** — restart the API to clear a lockout;
  no waiting required.
- Email is allowlisted to `divineokonitu01@gmail.com` outside production, so
  supplier emails do not actually deliver locally.
