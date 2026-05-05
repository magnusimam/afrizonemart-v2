# Afrizonemart 2.0 — Production Deploy Runbook

The end-state we're shipping to:

- **Frontend**: Next.js on **Vercel**, served at `https://afrizonemart.com` and `https://www.afrizonemart.com`.
- **API**: Express on **Railway**, served at `https://api.afrizonemart.com`.
- **Database**: Postgres on **Railway** (already provisioned for dev — we'll create a fresh prod DB).
- **Images**: Cloudflare **R2** bucket served at `https://images.afrizonemart.com`.
- **Email**: Resend (already configured, sender `no-reply@afrizonemart.com` verified).
- **Payments**: Squad sandbox until live keys are added; webhook URL flips at deploy time.

Estimated wall-clock: **90–120 min** (most of it is propagation + clicks in dashboards).

---

## 0. Generate fresh production secrets (do this first, paste into a notes app)

```bash
# JWT secret — 64 random chars
openssl rand -hex 32
# Run twice if you also want to rotate the access-token secret separately
```

You'll paste this into Railway in step 3.

---

## 1. Cloudflare R2 — bucket + public domain (~10 min)

1. Cloudflare dashboard → **R2** → **Create bucket**
   - Name: `afrizonemart-uploads`
   - Location: Automatic (or pick EU/EEUR for closer-to-Africa latency)
2. Open the bucket → **Settings** → **Public access** → **Connect Domain**
   - Domain: `images.afrizonemart.com`
   - Cloudflare will auto-add the DNS record (since afrizonemart.com is on CF).
3. **R2 → Manage API Tokens → Create API token**
   - Permission: **Object Read & Write**
   - Bucket: `afrizonemart-uploads` (scope to bucket only)
   - Save the **Access Key ID** and **Secret Access Key** — you'll only see the secret once.
4. Note the **Account ID** (top-right of the R2 dashboard).

You now have: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=afrizonemart-uploads`, `R2_PUBLIC_URL_BASE=https://images.afrizonemart.com`.

---

## 2. Railway — production API + Postgres (~25 min)

1. Railway dashboard → **New Project** → name it `afrizonemart-prod`.
2. **Add → Database → PostgreSQL**. Wait for provisioning. Click into it → **Connect** tab → copy the `DATABASE_URL` (the internal `postgres.railway.internal` one is fastest; the public proxy URL also works).
3. **Add → GitHub Repo** → pick `afrizonemart-api`. Railway auto-detects `railway.toml`.
   - Set **Root Directory** to `/` (or `afrizonemart-api/` if it's a monorepo subfolder).
4. **Service → Settings → Networking → Generate Domain** for a temporary `.up.railway.app` URL (we'll point the custom domain in step 5).
5. **Service → Variables** — paste in:

   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<from step 2>

   JWT_SECRET=<from step 0>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=30d

   LOG_LEVEL=info
   SENTRY_DSN=                       # optional, leave blank to skip Sentry

   WEB_URL=https://afrizonemart.com
   API_PUBLIC_URL=https://api.afrizonemart.com
   CORS_ORIGINS=https://afrizonemart.com,https://www.afrizonemart.com

   # Uploads — R2
   UPLOADS_BACKEND=r2
   UPLOADS_MAX_BYTES=8388608
   R2_ACCOUNT_ID=<from step 1>
   R2_ACCESS_KEY_ID=<from step 1>
   R2_SECRET_ACCESS_KEY=<from step 1>
   R2_BUCKET=afrizonemart-uploads
   R2_PUBLIC_URL_BASE=https://images.afrizonemart.com

   # Squad — start with sandbox keys; swap to live when you're ready.
   # Get the value from Squad dashboard or Vercel/Railway env vars.
   SQUAD_SECRET_KEY=<sandbox_sk_...>
   SQUAD_ENVIRONMENT=sandbox

   # Resend — get from https://resend.com/api-keys or Vercel env vars.
   RESEND_API_KEY=<re_...>
   EMAIL_FROM=Afrizonemart <no-reply@afrizonemart.com>
   EMAIL_REPLY_TO=support@afrizonemart.com
   ```

6. **Deploy** — Railway pulls the repo, runs the build, then runs `prisma migrate deploy && node dist/server.js`. Watch the logs; expect `database.connected`, `notifications.dispatcher.started`, `server.listening` within ~90s.
7. Hit `https://<railway-domain>/api/health` — should return 200 with DB OK.
8. **Service → Settings → Networking → Custom Domain** → add `api.afrizonemart.com`. Railway shows a CNAME target — add it as a CNAME record in Cloudflare DNS, **proxy disabled (gray cloud)** initially so Railway can issue the cert.

---

## 3. Seed production data (one-time, ~10 min)

Use Railway's shell or run locally with the prod `DATABASE_URL` exported:

```bash
cd afrizonemart-api
DATABASE_URL=<prod-url> npx tsx prisma/seed.ts
DATABASE_URL=<prod-url> npx tsx scripts/make-admin.ts <your-admin-email> <your-admin-password>
```

The seed creates 9 categories + 44 demo products. Replace via the admin UI once live.

---

## 4. Vercel — production frontend (~15 min)

1. Vercel dashboard → **Add New → Project** → import `afrizonemart-v2` from GitHub.
2. Vercel auto-detects Next.js. Build command + output directory are correct by default.
3. **Environment Variables** (apply to Production + Preview + Development):

   ```env
   NEXT_PUBLIC_API_URL=https://api.afrizonemart.com
   ```

4. **Deploy**. First build takes ~2–3 min.
5. Hit the temporary `.vercel.app` URL — site should load, products should fetch from prod API.
6. **Project Settings → Domains** → add `afrizonemart.com` and `www.afrizonemart.com`.
   - Vercel will tell you to either change nameservers (don't — DNS is on Cloudflare) or add A/CNAME records. Add the records in Cloudflare:
     - `afrizonemart.com` → `A` → `216.198.79.1`, proxy **disabled**
     - `afrizonemart.com` → `A` → `64.29.17.1`, proxy **disabled** (Vercel needs both apex IPs as of 2026)
     - `www.afrizonemart.com` → `CNAME` → `cname.vercel-dns.com`, proxy **disabled**
   - **Do NOT use the old `76.76.21.21` apex IP** — Vercel deprecated it in 2026; cert provisioning silently fails (no error, just no TLS on 443). Verify with `curl -sS https://api.vercel.com/v6/domains/<DOMAIN>/config?teamId=<TEAM> -H "Authorization: Bearer <TOKEN>"` — `recommendedIPv4 rank 1` is the source of truth.
7. Vercel will issue the cert within 1–5 min. Leave proxy **disabled** — turning on the orange cloud on the apex breaks Vercel's HTTP-01 cert renewal flow. CF caching is optional and not worth the breakage.

---

## 5. Squad — production webhook (~3 min)

In your Squad dashboard:
- **Settings → Webhooks** → set the webhook URL to `https://api.afrizonemart.com/api/payments/webhook`
- Save. Future Squad payment events will hit prod and flip orders to PAID without the polling fallback.

(Sandbox is fine for launch. To go live: in Squad, switch to live mode and grab the live secret key, then update Railway's `SQUAD_SECRET_KEY` and set `SQUAD_ENVIRONMENT=live`.)

---

## 6. Resend — verify domain status (~2 min)

- Resend dashboard → **Domains** → `afrizonemart.com` should show **Verified**. If not, recheck the SPF/DKIM/DMARC records in Cloudflare DNS (proxy must be **disabled** for these TXT/MX records).
- Send a test from the dashboard's domain page to confirm.

---

## 7. Post-deploy smoke tests (~10 min)

Run these against `https://afrizonemart.com`:

1. **Homepage loads** — categories + product grid render with images from `images.afrizonemart.com`.
2. **Sign up** — register a new account → check inbox for "Welcome" email.
3. **Place an order** — add to cart → checkout → pay with Squad sandbox card → success page polls and flips to PAID → check inbox for "Order confirmed" + "Payment received" emails.
4. **Admin login** — log in with the admin you made in step 3 → `/admin` → orders tab shows the order you just placed.
5. **Admin status flip** — change order status to SHIPPED → check inbox for "Order shipped" email.
6. **Forgot password** — log out, click "Forgot password" → check inbox → click reset link → set new password → log in.
7. **Image upload** — admin → products → edit → upload a new image → confirm URL is `https://images.afrizonemart.com/...` and renders on the product page.

If any of those fail, check Railway logs first — every notable event has a structured `event.name` log line.

---

## Rollback

- **Frontend**: Vercel → Deployments → click previous deployment → "Promote to Production". Instant.
- **API**: Railway → Deployments → previous deployment → "Redeploy". ~60s.
- **DB**: Railway Postgres → **Backups**. Daily snapshots, restore is point-and-click.
- **Migrations**: never run `prisma migrate reset` on prod. To undo a migration, write a new migration that reverses it.

---

## Things deliberately deferred (do post-launch)

- Squad live keys + `SQUAD_ENVIRONMENT=live` switch.
- Frontend Sentry (only API has it).
- OpenTelemetry / Prometheus metrics.
- CI/CD: today every push to main auto-deploys. Add branch protection + required preview checks once team grows.

---

## Optional: Google sign-in setup

Enables the "Continue with Google" button on `/login` and `/register`. Without this the button is hidden — the rest of auth still works.

1. **Google Cloud Console → Create OAuth credentials**
   - Open https://console.cloud.google.com/apis/credentials
   - Click **+ Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Afrizonemart Web`
   - **Authorized JavaScript origins** (add all that apply):
     - `https://afrizonemart.vercel.app`
     - `https://afrizonemart.com` (when cutover happens)
     - `http://localhost:3000` (for local dev)
   - **Authorized redirect URIs**: leave blank (we use One Tap, not redirect flow)
   - Click **Create** → copy the **Client ID**.

2. **Set env vars**
   - **Railway** (`api` service):
     - `GOOGLE_CLIENT_ID=<the client id>`
   - **Vercel** (`afrizonemart` project, all environments):
     - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<the SAME client id>` (this one is exposed to the browser — that's fine, it's not a secret)
   - Redeploy both. The button appears.

3. **OAuth Consent Screen** (only needed once per project)
   - Set User type to **External**, fill in app name, support email, logo, scopes (`email`, `profile`, `openid`).
   - Until you submit for verification you're in "Testing" mode and can only sign in with the test users you list. For prod, click **Publish App** — Google reviews in ~24h for the basic scopes we use.

---

## Optional: SMS phone auth (Twilio Verify)

Enables phone-number sign-up/sign-in. Without these env vars, the `/api/auth/phone/*` endpoints return a clear "phone auth not configured" error and the storefront's phone tab shows a friendly fallback.

1. **Sign up at twilio.com** (free trial gives ~$15 credit; you can verify ~150 phones for free)

2. **Console → Verify → Services**
   - Click **Create new** → Friendly name `Afrizonemart Auth`
   - Code length: **6 digits**
   - Code TTL: **10 minutes** (default fine)
   - Save → copy the **Service SID** (starts with `VA…`)

3. **Console → Account → API keys & tokens**
   - Copy the **Account SID** (starts with `AC…`)
   - Copy the **Auth Token** (the live one, not test)

4. **Set env vars on Railway** (`api` service):
   ```env
   TWILIO_ACCOUNT_SID=AC…
   TWILIO_AUTH_TOKEN=…
   TWILIO_VERIFY_SID=VA…
   ```
   Redeploy.

5. **Cost note**: Twilio Verify charges ~$0.05 per successful verification (varies by destination country — Nigeria is ~$0.06, US is ~$0.05). Trial credit covers ~150 verifies. Add a top-up at small scale; switch to Africa's Talking later for cheaper Africa-volumes.

6. **Trial limitations**: trial accounts can only send SMS to numbers you've **verified** in the Twilio console. Add your test phone there before testing locally.

---

## Phone sign-in user model note

When a user signs up with their phone, we store a synthetic email like `phone2348012345678@phone.afrizonemart.local` so the `User.email NOT NULL UNIQUE` invariant holds. The user can later add a real email + password from `/account/settings` (TODO). Their primary identifier is `User.phone`.

When a user signs in with Google, the email is real (verified by Google), and we link `User.googleId` so they can come back via Google even if their email later changes.

---

## Optional: Frontend Sentry

Captures every uncaught error in the browser + server runtime. Activates when `NEXT_PUBLIC_SENTRY_DSN` is set.

1. Sign in / create org at https://sentry.io
2. **+ New project** → platform **Next.js** → name `afrizonemart-frontend`
3. Copy the **DSN** (looks like `https://abc@o123.ingest.us.sentry.io/456`)
4. **Vercel** → project → Settings → Environment Variables:
   - `NEXT_PUBLIC_SENTRY_DSN=<your DSN>` (production + preview + development)
5. Redeploy. Errors start flowing.

---

## Optional: PostHog analytics

Page-views + custom events (sign-ups, add-to-cart, purchases). Activates when `NEXT_PUBLIC_POSTHOG_KEY` is set.

1. Sign in / create org at https://posthog.com (EU cloud or US — your choice)
2. Settings → Project API Keys → copy the **Project API Key** (starts with `phc_`)
3. **Vercel** env vars (all three environments):
   - `NEXT_PUBLIC_POSTHOG_KEY=phc_…`
   - `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` (or `https://us.i.posthog.com`)
4. Redeploy. Tracking starts immediately.

The `trackEvent()` and `identifyUser()` helpers in `components/providers/AnalyticsProvider.tsx` are how to fire conversion events. Already covers `$pageview` automatically. To add `add_to_cart`, `purchase`, etc., import and call from the relevant client component.

---

## Deferred — Meilisearch (real product search)

Storefront search currently uses a Postgres `ILIKE %q%` query. Fast for 200 products, slow at 5k+, no typo tolerance, no facets.

When ready (~2 days of work):

1. **Add a Meilisearch service** to the Railway prod project:
   - Railway → Add → Docker image → `getmeili/meilisearch:v1.10`
   - Generate a master API key, set `MEILI_MASTER_KEY` env var on the service
   - Note its internal URL (e.g. `meilisearch.railway.internal:7700`)
2. **Add env vars** to the API service:
   - `MEILI_HOST=http://meilisearch.railway.internal:7700`
   - `MEILI_API_KEY=<master key>`
3. **Indexer worker** in `afrizonemart-api/src/modules/search/`:
   - Subscribe to `product.created` / `product.updated` / `product.deleted` events
   - Push to Meilisearch index `products` with searchable + filterable attrs
   - One-time backfill script for existing products
4. **API endpoint** `/api/search?q=…&category=…&origin=…&limit=…` proxies to Meili
5. **Storefront** swap the Postgres-based search for the new endpoint
6. Optional: typo-tolerance, faceted filtering, search-as-you-type

Until then, the storefront search bar continues to work — just not as well.
