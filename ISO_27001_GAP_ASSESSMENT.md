# ISO/IEC 27001:2022 Gap Assessment — Afrizonemart 2.0

**Date:** 2026-05-11
**Author:** Magnus (CTO) + Claude
**Scope:** Afrizonemart 2.0 platform — `afrizonemart-api` (Node/Express + Prisma + Postgres on Railway) and `afrizonemart-v2` (Next.js storefront/admin on Vercel)
**Standard:** ISO/IEC 27001:2022 (clauses 4–10) + Annex A 2022 revision (93 controls across 4 themes)

---

## Headline

Technical controls are in unusually good shape; the ISMS process/documentation half of the standard is essentially absent.

- ~75% of Annex A's 93 controls have technical evidence in code.
- ~5% of clauses 4–10 (the management-system half) are covered.
- The only governance doc on disk is `SECURITY_AUDIT_TRACKER.md` — useful as evidence of A.8.8 vulnerability triage, but it is not a policy.

---

## PART 1 — Security Artifact Inventory (what we have)

### 1. Authentication & Access Control

**JWT implementation & configuration**
- `afrizonemart-api/src/modules/auth/jwt.ts` — HS256 algorithm pinned, issuer/audience claims fixed to `afrizonemart`, access token (15m) + refresh token (30d) with `jti` claim; sign/verify options centralised via `VERIFY_OPTIONS` constant.
- `afrizonemart-api/src/middleware/auth.ts` — JWT Bearer token extraction, signature verification via `jsonwebtoken`, `req.user` attachment with `id`/`email`/`role`; separate `requireAuth` + `optionalAuth` middleware.
- `afrizonemart-api/src/config/env.ts` — `JWT_SECRET` required ≥32 chars, enforced at startup; `JWT_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` configurable per env.

**Password hashing & strength**
- `afrizonemart-api/src/modules/auth/service.ts` — `bcryptjs` with `BCRYPT_ROUNDS=12`; refresh token also bcrypt-hashed before storing on `User.refreshTokenHash`.
- `afrizonemart-api/src/modules/auth/auth.schema.ts` — Zod schema: password ≥8, ≤128 chars (prevents bcrypt amplification DoS), must include digit/uppercase/symbol via `.refine()` (Audit M6).
- `afrizonemart-v2/src/lib/auth/password.ts` — Client-side validation mirrors server rules; `PASSWORD_RULE_HINT` displayed before round-trip.

**Rate limiting (auth surface)**
- `afrizonemart-api/src/middleware/rate-limit.ts` — Cost-tier-specific limiters:
  - `authStrictLimiter` 10/15min (login/verify)
  - `authRegisterLimiter` 30/hr
  - `authPasswordResetLimiter` 10/hr
  - `authPhoneOtpLimiter` 5/hr
  - `authChallengeLimiter` 60/hr
- `express-rate-limit` with JSON error envelope, `Retry-After` header.

**Login lockout (per-account, Audit M7)**
- `afrizonemart-api/src/modules/auth/service.ts` — `User.lockedUntil` + `User.failedLoginAttempts` tracked; 5 failed attempts trigger 15-min lockout (configurable exponential backoff); lockout check runs **before** bcrypt to prevent timing-based enumeration.

**Role-Based Access Control (RBAC)**
- `afrizonemart-api/src/lib/permissions.ts` — Capability-based model with `Capability` union (`products.write`, `orders.refund`, `staff.manage`, etc.), `CAPABILITY_LABELS` registry, `StaffRole` enum (`CUSTOMER`/`SELLER`/`ADMIN`/`STAFF`), `effectiveCapabilities()` resolution per role.
- `afrizonemart-api/src/middleware/require-capability.ts` — Middleware gate on one+ capabilities; `ADMIN` bypasses DB hit, `STAFF` triggers single `User.permissions` lookup for immediate revoke effect.
- `afrizonemart-api/src/middleware/require-role.ts` — Role-only gate (simpler than require-capability).
- `afrizonemart-v2/src/lib/permissions.ts` — Mirrored capability constants for sidebar/section filtering (manually kept in sync with API).

**Google OAuth / multi-factor**
- `afrizonemart-api/src/modules/auth/google.service.ts` — Google ID Token verification via `google-auth-library`; `GoogleAuthChallenge` creation with server-issued nonce (10-min TTL) to prevent replay (Audit H7).
- `afrizonemart-api/src/modules/auth/phone.service.ts` — Twilio Verify SMS OTP flow; phone validation with E.164 regex; Twilio's per-phone rate-limiting acts as second layer.
- `afrizonemart-v2/src/lib/api/auth.ts` — Frontend abstractions: `createGoogleChallenge()`, `signInWithGoogle(idToken, nonce)`, `startPhoneVerification()`, `verifyPhoneAndSignIn()`.

**Session management**
- Refresh token stored as httpOnly cookie (never in JS); access token in JSON body.
- `afrizonemart-api/src/modules/auth/repository.ts` — Refresh token hash persisted on `User.refreshTokenHash`; stale token rejected.
- Refresh cookie path widened to `/api` (Audit M8) — forwards-compatible, no forced logouts.
- No explicit session timeout beyond token expiry implemented.

---

### 2. Audit Logging

**Audit log model & service**
- `afrizonemart-api/prisma/schema.prisma` — `AuditLog` table: `id`, `actorUserId`, `actorEmail`, `entityType`, `entityId`, `action`, `changes` (JSON), `createdAt`; snapshot of actor email at log-time (survives user deletion).
- `afrizonemart-api/src/modules/audit/service.ts` — `logAudit()` function (best-effort, swallows failures); `adminListAudit()` with filtering by `actorUserId`/`entityType`/`action`/date-range, pagination.

**Logged events**
- `afrizonemart-api/src/modules/orders/admin.service.ts` — Order refund + status-change logged.
- `afrizonemart-api/src/modules/payments/service.ts` — Payment webhook processed + payment mutation logged.
- `ProductPriceChange` audit table — every Product price mutation routed through `applyPriceChange()` helper (the only function allowed to mutate `Product.price`).
- `InboundWebhookEvent` — webhook replay-protection table (Audit H3).
- No comprehensive event mapping table found; `logAudit()` calls scattered across admin.service.ts files.

**Audit admin interface**
- `afrizonemart-api/src/modules/audit/admin.routes.ts` — `GET /api/admin/audit` with query filters + pagination.
- `afrizonemart-api/src/modules/audit/admin.controller.ts` — Lists audit entries (requires `audit.read` capability).

**Audit retention**
- No explicit retention policy (no DELETE cron, no archival) — logs accumulate indefinitely in Postgres.

---

### 3. Encryption at Rest / Secrets

**Symmetric encryption (AES-256-GCM, Audit H9)**
- `afrizonemart-api/src/lib/crypto-secret.ts` — Application-layer AES-256-GCM for payment gateway credentials; `SECRETS_KEY` env (64 hex chars = 32 bytes, or any ≥32-char string SHA-256'd); versioned envelope `{ _enc: 'v1', iv, tag, ct }` stored as JSON in `PaymentGatewayConfig.credentials`.
- Plaintext legacy rows auto-detected and still decrypt (non-destructive migration); re-encryption on next admin save.
- Dev fallback: derives from `SHA-256(JWT_SECRET)` if `SECRETS_KEY` unset; prod requires explicit `SECRETS_KEY`.

**Environment variables (secrets management)**
- `afrizonemart-api/src/config/env.ts` — Zod-validated env loader; all sensitive keys listed (`JWT_SECRET`, `DATABASE_URL`, `SECRETS_KEY`, `SQUAD_SECRET_KEY`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `TWILIO_AUTH_TOKEN`, `GIG_PASSWORD`).
- `.env.example` — Template without secrets (example values only).
- Actual `.env` kept in root, listed in `.gitignore` (standard practice).

**Payment gateway credentials storage**
- `afrizonemart-api/src/modules/payments/admin.controller.ts` — `PaymentGatewayConfig.credentials` encrypted via `encryptCredentials()` before persist.
- `afrizonemart-api/src/modules/payments/service.ts` — Credentials decrypted via `decryptCredentials()` on fetch for gateway instantiation.

**Secrets rotation**
- No explicit key rotation procedure documented; manual `SECRETS_KEY` change would require a re-encryption pass.

---

### 4. Logging & Monitoring

**Structured JSON logger (Winston)**
- `afrizonemart-api/src/infra/logger.ts` — Winston with timestamp + errors + JSON format in prod, colorized human-readable in dev; `LOG_LEVEL` env config.
- Used throughout modules for `info('event.name', {...})`, `warn()`, `error()` calls.

**Request logging middleware**
- `afrizonemart-api/src/middleware/request-logger.ts` — Per-request structured log: `requestId` (`x-request-id` header or random), method, path, status, duration_ms, user-agent; `X-Request-Id` response header.

**Sentry integration (error capture)**
- `afrizonemart-api/src/infra/sentry.ts` — Init with DSN (optional), environment, `tracesSampleRate` (0.1 prod / 1.0 dev), `sendDefaultPii: false`, `beforeSend` hook for scrubbing.
- Sentry middleware wired at server start (just before error handler).
- **Sensitive field scrubbing (Audit M3):** `beforeSend` hook redacts `password`, `token`, `card` fields + `Authorization`, `Cookie`, `x-squad-encrypted-body` headers; deletes `event.request.cookies` entirely.
- `SENSITIVE_BODY_KEYS` (27 keys) + `SENSITIVE_HEADERS` (8 headers) lists maintained in code.
- **Note:** `SENTRY_DSN` is currently unset in production — Sentry is wired but receiving no events.

**Frontend Sentry**
- `afrizonemart-v2/sentry.client.config.ts` — Client-side Sentry when `NEXT_PUBLIC_SENTRY_DSN` set; `replayIntegration` with `maskAllText` + `blockAllMedia` to hide form/PII in session replays.
- `afrizonemart-v2/src/lib/sentry-scrub.ts` — Shared scrubbing logic mirroring API.
- `afrizonemart-v2/sentry.server.config.ts` + `sentry.edge.config.ts` — Server & Edge runtime configs also use scrubbing.
- Constraint: never statically import `@sentry/nextjs` in shared client components (causes ERR_REQUIRE_ESM SSR 500s); lazy-load inside `componentDidCatch` only.

**Health checks**
- `afrizonemart-api/src/modules/health/routes.ts` — `GET /api/health` returns DB connectivity status; liveness check.

---

### 5. Input Validation

**Zod schemas (all modules)**
- `afrizonemart-api/src/modules/auth/auth.schema.ts` — `registerBodySchema`, `loginBodySchema`, `forgotPasswordBodySchema`, `resetPasswordBodySchema`, `updateMeBodySchema` with email normalization (trim + lowercase), password rules, E.164 phone regex.
- Similar schemas across all modules: addresses, cart, products, orders, coupons, etc.

**Central error handler with field hiding (Audit M4)**
- `afrizonemart-api/src/middleware/error-handler.ts` — `ZodError` caught and formatted; detailed `fieldErrors` logged server-side but **not** echoed to client in production (`isProduction` check strips `details` key).
- Client gets only `{ code: 'VALIDATION_ERROR', message: 'Invalid request payload' }` in prod; dev shows details.

**Email normalization**
- Auth schema trims + lowercases before email validation (protects against duplicate accounts via case/whitespace).

**URL safety (webhook SSRF defense)**
- `afrizonemart-api/src/lib/url-safety.ts` — `isUrlSchemeAndHostnameSafe()` + `assertUrlIsPublic()` validate webhook URLs at save + dispatch time; rejects private IP ranges, localhost, `169.254.x.x` (link-local), `224.0.0.0/4` (multicast), metadata targets (`169.254.169.254`).
- `afrizonemart-api/src/modules/webhooks/admin.schema.ts` — Zod refine on `safeWebhookUrl`; `dispatcher.ts` re-checks at fetch time (DNS can resolve to different IPs between save/dispatch).

**Body size limits (per-path, Audit M10)**
- `afrizonemart-api/src/server.ts` — Global 1MB limit; `/api/admin/products/bulk*` routes have 8MB override (for CSV uploads).
- Prevents auth endpoints from soaking up megabytes of garbage before rate-limiting applies.

**Tests**
- `afrizonemart-api/tests/auth.schema.test.ts` — Vitest coverage: email lowercasing, password length, strong-password rule, token length checks.
- `tests/` folder includes business-rules, custom-fields, placement tests.

---

### 6. Webhook Security

**Signature verification (HMAC-SHA256)**
- `afrizonemart-api/src/modules/webhooks/dispatcher.ts` — `signPayload()` uses `createHmac('sha256', secret).update(body).digest('hex')`; signed as `X-Afrizonemart-Signature` header.
- Payload is JSON-stringified `{ event, payload, sentAt }` before signature (canonical form).

**Replay protection (Audit H3)**
- `afrizonemart-api/src/modules/payments/service.ts` — `InboundWebhookEvent` table with unique `(provider, bodyHash)`; webhook handler inserts row in same transaction as Payment/Order mutate.
- Identical replays hit unique constraint, logged as already-processed.

**SSRF defense on webhook URLs**
- Admin save: Zod refine checks `isUrlSchemeAndHostnameSafe` (rejects private/loopback).
- Dispatch: Re-check `assertUrlIsPublic` (DNS resolution can change).

**Retry logic**
- `afrizonemart-api/src/modules/webhooks/dispatcher.ts` — Failed deliveries queued with exponential backoff (1m, 5m, 30m); 3 max attempts; background worker polls every 30s for due retries.
- `WebhookDelivery` row logs `statusCode` + `responseBody` + `attempts` + timestamp.

**Known events**
- Hardcoded list: `order.placed`, `order.paid`, `order.shipped`, `order.cancelled`, `order.refunded`, `order.note_added`, `product.viewed`, `cart.updated`, `user.registered`, `user.logged_in` (10 events).
- Webhook schema allows literal match or wildcard `*`.

---

### 7. CORS / HTTP Headers / Body Limits

**CORS allowlist (explicit, Audit M12)**
- `afrizonemart-api/src/config/env.ts` — `CORS_ORIGINS` env (comma-separated list).
- `afrizonemart-api/src/server.ts` — Dynamic CORS callback:
  - No `Origin` header → allow (same-origin / server-to-server).
  - `Origin` in `CORS_ORIGINS` list → allow.
  - Vercel preview domain (regex: `afrizonemart-[a-z0-9]+-imammagnus40-8846s-projects.vercel.app`) → allow.
  - Dev environment + `isDevLocalhostOrigin` (localhost:3000/3001/3002/3737/4000) → allow.
  - Otherwise reject (CORS callback error).
- `credentials: true` enabled (cookies sent/received cross-origin).

**Helmet security headers (Audit H10)**
- `afrizonemart-api/src/server.ts` lines 87–103:
  - **HSTS:** 1-year `maxAge`, `includeSubDomains`, preload-eligible.
  - **frameguard:** `deny` (no framing; API responses are JSON, not embeddable).
  - **referrerPolicy:** `strict-origin-when-cross-origin` (don't leak URLs on outbound redirects).
  - **noSniff:** `true` (prevents browser MIME-type sniffing).
  - **CSP:** `default-src 'none'`, `img-src 'self' data:`, `frame-ancestors 'none'` (JSON API; static `/uploads/*` handler could leak HTML if MIME bypass).
  - **crossOriginResourcePolicy:** `cross-origin` (allows storefront to load `/uploads/*` from different origin in dev; R2 in prod).

**Body size limits**
- JSON: 1MB global (most routes).
- Form-urlencoded: 1MB.
- Bulk admin endpoints (`/api/admin/products/bulk*`): 8MB JSON override (CSV upload).
- Limit applied via `express.json({ limit: '...' })`.

**Verify callback (raw body capture)**
- Webhook handlers + payment handlers need rawBody for signature verification; `captureRawBody` callback saves Buffer before JSON parse.

**Static file serving (local disk, Audit M11)**
- `afrizonemart-api/src/server.ts` — When `UPLOADS_BACKEND=local`, serve `/uploads` via `express.static` with:
  - `dotfiles: 'deny'` (no `.env`/`.git` access).
  - `index: false` (no directory listing).
  - `redirect: false` (no trailing-slash redirects).

---

### 8. Storage (Uploads & Image Handling)

**Upload service architecture**
- `afrizonemart-api/src/modules/uploads/service.ts` — `uploadImage()` validates file size (`UPLOADS_MAX_BYTES` default 8MB), magic-byte sniffs MIME (Audit H8), rejects non-image types, generates safe key.
- Pluggable storage backend via `storage()` factory: `LocalDiskStorage` or `R2Storage`.

**MIME sniffing (Audit H8)**
- `afrizonemart-api/src/modules/uploads/sniff.ts` — `sniffImageMime()` inspects magic bytes (JPEG/PNG/WEBP/AVIF/GIF only); never trusts client `Content-Type` header.
- `ALLOWED_MIME` set: `{ image/jpeg, image/png, image/webp, image/avif, image/gif }`.
- Mismatch logged but not fatal (some clients mislabel legitimately).

**ALLOWED_FOLDERS whitelist**
- Folders: `products`, `categories`, `about`, `reviews`, `sellers`, `misc` (prevents arbitrary directory traversal).

**R2 storage backend (Audit M9)**
- `afrizonemart-api/src/modules/uploads/storage/r2.ts` — Cloudflare R2 via `@aws-sdk/client-s3`; bucket + publicUrlBase config.
- Keys formatted as `${folder}/${randomId}.${ext}`.
- Wildcard origins removed (M9).

**Local disk storage backend**
- `afrizonemart-api/src/modules/uploads/storage/local-disk.ts` — Development fallback; `UPLOADS_LOCAL_DIR` + `UPLOADS_PUBLIC_URL_BASE` env.

**Upload routes & controller**
- `afrizonemart-api/src/modules/uploads/controller.ts` — Requires `uploads.write` capability; multer for form-data parsing.
- POST endpoint returns `{ url, key, contentType, size }`.

**Cleanup on delete (2026-05-11)**
- `deleteImagesByUrl` helper wired into product delete + intern resubmit flows.
- Monthly orphan-scan cron deferred.

---

### 9. Backup / Disaster Recovery

**Database backups**
- Railway (hosting platform) — Postgres add-on includes automated backups (user-accessible via Railway dashboard); no explicit config in repo.
- No backup cron job or script in codebase.

**Migration strategy (code-as-config)**
- `afrizonemart-api/prisma/schema.prisma` — Single source of truth.
- `afrizonemart-api/railway.toml` — `startCommand: npx prisma migrate deploy` (production-safe; applies pending, never prompts).
- Migration history in `afrizonemart-api/prisma/migrations/` (timestamped SQL files).

**Restore procedures**
- Implicit: Railway restore from backup → schema applied via `prisma migrate deploy` on startup.
- No explicit runbook documented.

**Data export / audit trail export**
- No bulk export endpoint; audit logs are queryable via `adminListAudit()` but not exported/archived elsewhere.

---

### 10. Documentation On Disk

**Architecture**
- `afrizonemart-api/README.md` — Quick start, folder structure (DDD), module conventions, principles (API-First, Event-Driven, DDD, modularity, observability).
- `afrizonemart-v2/ARCHITECTURE_TRACKER.md` — 159KB detailed feature/module matrix; tracks implementation status per domain.

**Security audit tracker**
- `afrizonemart-v2/SECURITY_AUDIT_TRACKER.md` — 2026-05-07 audit report: 3 critical, 11 high, 12 medium, 5 low, 11 npm advisories; detailed remediation steps + cross-refs.
- Fixed: C1 (DOMPurify), H8 (magic-byte sniff), H3 (replay protection), H6 (JWT algo pin).
- Outstanding: C3, H1, H2, H4, H9, H10, H11 (Next.js upgrade).

**Build & deployment guides**
- `afrizonemart-api/CONTRIBUTING.md` — Code of conduct + development setup.
- `afrizonemart-v2/DEPLOY.md` — 14KB deployment guide (Vercel-specific).

**Privacy / Terms / Security Policy**
- **ABSENT** — no `SECURITY.md`, `PRIVACY.md`, or `TERMS_OF_SERVICE.md` at repo root or in `docs/`.

**Inline code comments (security principles)**
- Audit references (H1–H11, C1–C3, M1–M12, L1–L5, N1) embedded throughout code; Phase 11.3 indicates security-focused review cycle.

---

### 11. Dependencies (security-relevant runtime)

**`afrizonemart-api`**
- auth/crypto: `bcryptjs`, `jsonwebtoken`, `google-auth-library`, `@paralleldrive/cuid2`
- monitoring: `@sentry/node`, `winston`
- validation: `zod`
- http: `helmet`, `cors`, `express-rate-limit`, `cookie-parser`
- database: `@prisma/client`, `prisma`
- storage: `@aws-sdk/client-s3`, `multer`
- email: `@react-email/*`, `resend`, `twilio`
- server: `express`, `dotenv`
- advisories: none currently flagged; last build passed CI

**`afrizonemart-v2`**
- auth/crypto: `@sentry/nextjs`, `sanitize-html`
- monitoring: `posthog-js` (no PII by default)
- http: `axios`
- framework: `next 14.2.35`, `react 18`
- no Zod on the client; server is authoritative
- advisories: 10 in Next.js itself (minor/low); upgrade path tracked as H11

---

### 12. CI/CD

**API GitHub Actions** (`afrizonemart-api/.github/workflows/ci.yml`)
- Trigger: PR → main, push to main.
- typecheck job: Node 20, `npm ci`, `tsc --noEmit`, `next lint`.
- test job: Postgres 16 Docker service, `vitest`, `npm test`.
- Note: GH Actions billing currently blocked per memory `project_security_deploy_2026_05_08`.

**Frontend GitHub Actions** (`afrizonemart-v2/.github/workflows/ci.yml`)
- Trigger: PR → main, push to main.
- Jobs: typecheck + lint (`next lint`).

**Deployment (infrastructure-as-code)**
- API: `afrizonemart-api/railway.toml` — buildCommand `npm run prisma:generate && npm run build`; startCommand `npx prisma migrate deploy && node dist/server.js`; healthcheckPath `/api/health`; restartPolicy `ON_FAILURE` maxRetries 10.
- Frontend: `afrizonemart-v2/.vercel/project.json` (Vercel project metadata); git push → auto-deploy via Vercel GitHub integration.
- No explicit secret-management code (Railway/Vercel handle injections via dashboard).

---

### 13. Tests (security/auth-specific)

- `afrizonemart-api/tests/auth.schema.test.ts` — Vitest: email lowercasing, password length validation, strong-password rules.
- `afrizonemart-api/tests/business-rules.engine.test.ts` — Coupon/discount evaluation logic.
- `afrizonemart-api/tests/custom-fields.test.ts` — Field rendering safety.
- `afrizonemart-api/tests/placement.test.ts` — Product placement logic.
- No dedicated auth/RBAC/webhook integration tests; coverage is minimal.

---

## PART 2 — Annex A Mapping (93 controls, 2022 revision)

### Annex A.5 — Organizational Controls (37 controls)

Almost entirely missing. Documents that don't exist on disk:

| Control | Title | Status |
|---|---|---|
| A.5.1 | Information security policy | MISSING |
| A.5.2 | Information security roles & responsibilities | MISSING |
| A.5.3 | Segregation of duties | MISSING (informal only) |
| A.5.4 | Management responsibilities | MISSING |
| A.5.5 | Contact with authorities | MISSING |
| A.5.6 | Contact with special interest groups | MISSING |
| A.5.7 | Threat intelligence | MISSING |
| A.5.8 | Information security in project management | PARTIAL (tracker + audit log) |
| A.5.9 | Inventory of information and other assets | MISSING |
| A.5.10 | Acceptable use of information and other assets | MISSING |
| A.5.11 | Return of assets | MISSING |
| A.5.12 | Classification of information | MISSING |
| A.5.13 | Labelling of information | MISSING |
| A.5.14 | Information transfer | PARTIAL (TLS in transit by platform) |
| A.5.15 | Access control | PARTIAL (RBAC in code; no policy doc) |
| A.5.16 | Identity management | PARTIAL (in code; no policy doc) |
| A.5.17 | Authentication information | PARTIAL (M6 complexity rule; no policy) |
| A.5.18 | Access rights | PARTIAL (per-route capability gates) |
| A.5.19 | Information security in supplier relationships | MISSING |
| A.5.20 | Addressing information security within supplier agreements | MISSING |
| A.5.21 | Managing information security in the ICT supply chain | MISSING |
| A.5.22 | Monitoring, review and change management of supplier services | MISSING |
| A.5.23 | Information security for use of cloud services | MISSING |
| A.5.24 | Information security incident management planning and preparation | MISSING |
| A.5.25 | Assessment and decision on information security events | MISSING |
| A.5.26 | Response to information security incidents | MISSING |
| A.5.27 | Learning from information security incidents | MISSING |
| A.5.28 | Collection of evidence | PARTIAL (AuditLog) |
| A.5.29 | Information security during disruption | MISSING |
| A.5.30 | ICT readiness for business continuity | MISSING |
| A.5.31 | Legal, statutory, regulatory and contractual requirements | MISSING |
| A.5.32 | Intellectual property rights | MISSING |
| A.5.33 | Protection of records | PARTIAL (DB constraints; no retention policy) |
| A.5.34 | Privacy and protection of PII | MISSING (no privacy policy) |
| A.5.35 | Independent review of information security | MISSING |
| A.5.36 | Compliance with policies, rules and standards | MISSING |
| A.5.37 | Documented operating procedures | PARTIAL (README, DEPLOY.md) |

### Annex A.6 — People Controls (8 controls)

All missing — no HR/onboarding angle in repo. Intern queue + capability shift to interns (2026-05-11) needs a documented onboarding/termination flow.

| Control | Title | Status |
|---|---|---|
| A.6.1 | Screening | MISSING |
| A.6.2 | Terms and conditions of employment | MISSING |
| A.6.3 | Information security awareness, education and training | MISSING |
| A.6.4 | Disciplinary process | MISSING |
| A.6.5 | Responsibilities after termination or change of employment | MISSING |
| A.6.6 | Confidentiality or non-disclosure agreements | MISSING |
| A.6.7 | Remote working | MISSING |
| A.6.8 | Information security event reporting | MISSING |

### Annex A.7 — Physical Controls (14 controls)

Delegated to Vercel + Railway + Cloudflare — covered by their SOC 2 / ISO reports. You need to **collect their attestations** into a vendor folder; the standard accepts inheritance but requires evidence.

| Control | Title | Status |
|---|---|---|
| A.7.1 | Physical security perimeters | INHERITED (no evidence collected) |
| A.7.2 | Physical entry | INHERITED |
| A.7.3 | Securing offices, rooms and facilities | INHERITED |
| A.7.4 | Physical security monitoring | INHERITED |
| A.7.5 | Protecting against physical and environmental threats | INHERITED |
| A.7.6 | Working in secure areas | INHERITED |
| A.7.7 | Clear desk and clear screen | MISSING |
| A.7.8 | Equipment siting and protection | INHERITED |
| A.7.9 | Security of assets off-premises | MISSING |
| A.7.10 | Storage media | INHERITED |
| A.7.11 | Supporting utilities | INHERITED |
| A.7.12 | Cabling security | INHERITED |
| A.7.13 | Equipment maintenance | INHERITED |
| A.7.14 | Secure disposal or re-use of equipment | INHERITED |

### Annex A.8 — Technological Controls (34 controls)

Strong technical evidence; gaps are mostly process/operational.

| Control | Title | Status | Evidence |
|---|---|---|---|
| A.8.1 | User end-point devices | MISSING | no MDM/laptop policy |
| A.8.2 | Privileged access rights | STRONG | `lib/permissions.ts`, `require-capability.ts` |
| A.8.3 | Information access restriction | STRONG | RBAC + per-route capability gates (H1 follow-up) |
| A.8.4 | Access to source code | PARTIAL | GitHub repo permissions, no documented policy |
| A.8.5 | Secure authentication | STRONG | bcryptjs r12, JWT HS256 pinned w/ iss+aud, refresh-hash, M6 complexity, M7 lockout, H7 Google nonce |
| A.8.6 | Capacity management | MISSING | no usage/quotas docs |
| A.8.7 | Protection against malware | STRONG | H8 magic-byte sniff in `uploads/sniff.ts`, MIME allowlist |
| A.8.8 | Management of technical vulnerabilities | PARTIAL | tracker active, no Dependabot/Snyk SLA |
| A.8.9 | Configuration management | STRONG | Zod-validated `env.ts`, fail-fast on missing secrets |
| A.8.10 | Information deletion | PARTIAL | R2 `deleteImagesByUrl`; no DB row purge cron |
| A.8.11 | Data masking | MISSING | no DB-level masking for dev clones |
| A.8.12 | Data leakage prevention | STRONG | M3 Sentry PII scrubber (4 inits), M4 prod field-error hiding |
| A.8.13 | Information backup | PARTIAL | Railway snapshots exist; no restore test |
| A.8.14 | Redundancy of information processing facilities | MISSING | single-region API |
| A.8.15 | Logging | STRONG | Winston JSON + request-logger w/ `x-request-id` |
| A.8.16 | Monitoring activities | PARTIAL | Sentry installed but `SENTRY_DSN` unset in prod |
| A.8.17 | Clock synchronisation | INHERITED (Railway/Vercel NTP) |
| A.8.18 | Use of privileged utility programs | MISSING | no documented restriction |
| A.8.19 | Installation of software on operational systems | INHERITED (managed platforms) |
| A.8.20 | Networks security | STRONG | Helmet HSTS/CSP/frameguard |
| A.8.21 | Security of network services | STRONG | CORS allowlist + Vercel regex |
| A.8.22 | Segregation of networks | PARTIAL (Railway internal hostname) |
| A.8.23 | Web filtering | STRONG | M9 R2 wildcard, M11 dotfile deny, M12 dev CORS |
| A.8.24 | Use of cryptography | STRONG | AES-256-GCM via `crypto-secret.ts`, versioned envelope (H9) |
| A.8.25 | Secure development life cycle | PARTIAL | tracker process; no threat model, no SAST/secret-scan |
| A.8.26 | Application security requirements | STRONG | SECURITY_AUDIT_TRACKER active; Zod validation everywhere |
| A.8.27 | Secure system architecture and engineering principles | PARTIAL | 10 engineering principles doc; not mapped to controls |
| A.8.28 | Secure coding | STRONG | `applyPriceChange` single-writer pattern; central error handler |
| A.8.29 | Security testing in development and acceptance | PARTIAL | only 4 vitest files; no auth/RBAC/webhook integration coverage |
| A.8.30 | Outsourced development | N/A (in-house) |
| A.8.31 | Separation of development, test and production environments | PARTIAL | Vercel preview vs prod; no docs |
| A.8.32 | Change management | PARTIAL (tracker + PR flow) |
| A.8.33 | Test information | MISSING | no test-data sanitization policy |
| A.8.34 | Protection of information systems during audit testing | PARTIAL | `AuditLog` is append-only by convention only; no DB role separation |

---

## PART 3 — Clauses 4–10 (the ISMS itself)

These are the make-or-break for certification. Everything below is absent.

| Clause | Title | Status |
|---|---|---|
| 4.1 | Understanding the organization and its context | MISSING |
| 4.2 | Understanding the needs and expectations of interested parties | MISSING |
| 4.3 | Determining the scope of the ISMS | MISSING |
| 4.4 | Information security management system | MISSING |
| 5.1 | Leadership and commitment (signed by top management) | MISSING |
| 5.2 | Information security policy | MISSING |
| 5.3 | Organizational roles, responsibilities and authorities | MISSING |
| 6.1.1 | General planning | MISSING |
| 6.1.2 | Information security risk assessment methodology | MISSING |
| 6.1.3 | Information security risk treatment + **Statement of Applicability** | MISSING |
| 6.2 | Information security objectives and planning to achieve them | MISSING |
| 6.3 | Planning of changes | PARTIAL (tracker) |
| 7.1 | Resources | MISSING |
| 7.2 | Competence | MISSING |
| 7.3 | Awareness | MISSING |
| 7.4 | Communication | MISSING |
| 7.5 | Documented information control (versioning, approvals) | MISSING |
| 8.1 | Operational planning and control | PARTIAL (tracker) |
| 8.2 | Information security risk assessment (annual reassessment) | MISSING |
| 8.3 | Information security risk treatment | MISSING |
| 9.1 | Monitoring, measurement, analysis and evaluation (KPIs) | MISSING |
| 9.2 | Internal audit programme | MISSING |
| 9.3 | Management review (minutes) | MISSING |
| 10.1 | Continual improvement | MISSING |
| 10.2 | Nonconformity and corrective action log | PARTIAL (audit tracker) |

---

## PART 4 — Outstanding Items from `SECURITY_AUDIT_TRACKER.md`

High/critical items not yet closed:

| Ref | Title | Status |
|---|---|---|
| C1 | XSS via `dangerouslySetInnerHTML` | FIXED (DOMPurify) |
| C2 | Auth-store access-token exposure | PARTIAL |
| C3 | `returnUrl` validator (SSRF in OAuth redirects) | OPEN |
| H1 | `require-capability` universally wired | PARTIAL (follow-up done 2026-05-08; spot-check needed) |
| H2 | `timingSafeEqual` in payment signature verify | OPEN |
| H3 | Webhook replay protection | FIXED |
| H4 | Webhook amount/currency validation | OPEN |
| H6 | JWT algorithm pin + `iss`/`aud` | FIXED |
| H7 | Google sign-in nonce + `azp` | FIXED |
| H8 | Upload magic-byte sniff | FIXED |
| H9 | Credential encryption at rest | FIXED |
| H10 | Helmet + CSP/HSTS/frameGuard | FIXED |
| H11 | Next.js 14 → 16 upgrade (10 npm advisories) | OPEN |
| M1 | Coupon race | FIXED |
| M3 | Sentry PII scrubber | FIXED |
| M4 | Zod fieldErrors hidden in prod | FIXED |
| M5 | Stub gateway blocked in prod | FIXED |
| M6 | Password complexity | FIXED |
| M7 | Per-account login lockout | FIXED |
| M8 | Refresh cookie widened to `/api` | FIXED |
| M9 | R2 wildcard removed | FIXED |
| M10 | Body limits | FIXED |
| M11 | Dotfile deny | FIXED |
| M12 | Dev CORS allowlist | FIXED |

---

## PART 5 — Critical Absences (consolidated)

1. **No Incident Response Plan** — no documented procedure for breach response, data deletion requests, notification timelines.
2. **No Privacy Policy / Data Processing Agreement** — GDPR/NDPR/CCPA compliance not evident; subprocessor clauses missing.
3. **No Explicit Data Retention Policy** — audit logs, payment records, customer data accumulate indefinitely.
4. **No Key Rotation Procedure** — `SECRETS_KEY` change = manual re-encryption; `JWT_SECRET` change = issued tokens still valid until expiry.
5. **No Access Review Process** — no periodic audit of who has admin/staff roles.
6. **No Backup Restore Testing** — Railway backups exist but no documented restore runbook or test schedule.
7. **No Security Incident Logging Stream** — failed login attempts not logged separately; only rate-limit aggregate.
8. **No Asset Inventory** — no living document of all systems/data flows.
9. **No Vendor Assessment** — Resend, Twilio, GT Squad, Flutterwave, Vercel, Railway, Cloudflare, Sentry credentials handled but no SLAs/contracts tracked.
10. **No Physical/Facility Security Evidence** — implicit (Vercel/Railway managed) but undocumented in compliance sense.
11. **No Statement of Applicability** — required artifact under clause 6.1.3 d).
12. **No Risk Register** — required artifact under clause 6.1.2.
13. **No Management Review minutes** — required artifact under clause 9.3.
14. **No Internal Audit Programme** — required under clause 9.2.
15. **Sentry receiving no events in prod** (`SENTRY_DSN` unset) — A.8.16 monitoring gap.

---

## PART 6 — Recommended Sequence (90-day path to a credible posture)

**Week 1–2 — Foundation**
- Asset inventory + data flow diagram
- Vendor register with DPA links
- ISMS scope statement
- Information security policy (signed by Magnus as CTO)

**Week 3–4 — Risk & Access**
- Risk register (STRIDE on each module: auth, payments, uploads, webhooks, admin, intern queue)
- Access control policy (formalize RBAC + intern shift)
- Authentication policy (codify M6/M7 rules)

**Week 5–6 — Operations**
- Incident response runbook + tabletop exercise
- Backup-restore test (proves A.8.13)
- Set `SENTRY_DSN` in prod (closes A.8.16)
- Data retention policy + purge cron for `AuditLog` / `InboundWebhookEvent`

**Week 7–8 — Engineering hardening**
- Wire Dependabot + GitHub secret scanning (A.8.8 + A.8.25)
- Close outstanding audit items: C3, H2, H4, H11
- R2 orphan-scan cron (A.8.10)

**Week 9–10 — Documentation**
- Statement of Applicability covering all 93 Annex A controls
- Privacy policy + Terms of Service
- `SECURITY.md` at repo root

**Week 11–12 — Verification**
- Internal audit dry-run
- Management review meeting (Magnus + any stakeholders)
- Close gaps surfaced by internal audit

---

## PART 7 — Notes & Constraints (from session memory)

- Payment gateway is **GT Squad** (multi-currency); replaces earlier Paystack assumption.
- Email provider is **Resend** with verified `afrizonemart.com` (DNS in Cloudflare).
- Production: Vercel for storefront (new IPs `216.198.79.1` + `64.29.17.1`); Railway for API; apex cut over 2026-05-01.
- DB access from local CLI uses Postgres service `DATABASE_PUBLIC_URL`; `api` service exposes only internal hostname.
- GH Actions billing currently blocked (memory: `project_security_deploy_2026_05_08`) — manual CI workaround in place.
- 2026-05-08 security batch is the last verified deploy of H/M-tier fixes.
- Every animated/experimental feature must ship with kill-switch + `SafeBoundary` + plain-fallback trio (relevant to A.8.29 testing posture).

---

*End of assessment. Next session: pick a gap from PART 5 and build out the artifact.*
