#!/usr/bin/env node
/**
 * Submit (or re-submit) the sitemap to Google Search Console.
 *
 * Google has no official CLI and deprecated the old `/ping?sitemap=`
 * endpoint in 2023 — the only programmatic path is the Search Console
 * Sitemaps API. This script signs a service-account JWT with Node's
 * built-in crypto (zero npm dependencies), exchanges it for an access
 * token, PUTs the sitemap, then reads its status back to confirm.
 *
 * ── One-time setup ────────────────────────────────────────────────
 * 1. Google Cloud Console → create a project (or reuse one) → enable
 *    the "Google Search Console API".
 * 2. Create a Service Account → add a JSON key → download it.
 * 3. In Search Console → Settings → Users and permissions → add the
 *    service-account email (xxx@yyy.iam.gserviceaccount.com) as an
 *    **Owner** of the afrizonemart.com property.
 *    (The property must already be verified — do that in the dashboard.)
 *
 * ── Run ───────────────────────────────────────────────────────────
 *   GSC_SA_KEY=./gsc-service-account.json \
 *   GSC_SITE_URL="sc-domain:afrizonemart.com" \
 *   node scripts/submit-sitemap.mjs [sitemapUrl]
 *
 *   • GSC_SITE_URL — exactly as the property appears in Search Console:
 *       - Domain property:  "sc-domain:afrizonemart.com"
 *       - URL-prefix property: "https://afrizonemart.com/"
 *   • sitemapUrl (optional arg) — defaults to
 *       https://afrizonemart.com/sitemap.xml
 *     Pass a second run for /sitemap-images.xml if you want both.
 *
 * Exit code is non-zero on any failure so it can gate CI.
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/webmasters';

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const keyPath = process.env.GSC_SA_KEY;
const siteUrl = process.env.GSC_SITE_URL;
const sitemapUrl = process.argv[2] ?? 'https://afrizonemart.com/sitemap.xml';

if (!keyPath) die('Set GSC_SA_KEY to the service-account JSON key path.');
if (!siteUrl) die('Set GSC_SITE_URL (e.g. "sc-domain:afrizonemart.com").');

let sa;
try {
  sa = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch (e) {
  die(`Could not read/parse key file at ${keyPath}: ${e.message}`);
}
if (!sa.client_email || !sa.private_key) {
  die('Key file is missing client_email / private_key — not a service-account JSON?');
}

const b64url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Mint a Google OAuth access token from the service account (RS256 JWT). */
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .sign(sa.private_key)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok) die(`Token exchange failed: ${data.error ?? res.status} — ${data.error_description ?? ''}`);
  return data.access_token;
}

async function main() {
  const token = await getAccessToken();
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl,
  )}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const auth = { Authorization: `Bearer ${token}` };

  // PUT submits (or re-submits) the sitemap.
  const put = await fetch(base, { method: 'PUT', headers: auth });
  if (!put.ok && put.status !== 204) {
    const body = await put.text();
    die(`Submit failed (${put.status}): ${body.slice(0, 300)}`);
  }
  console.log(`✓ Submitted ${sitemapUrl} to ${siteUrl}`);

  // GET reads the status back so the run confirms Google accepted it.
  const get = await fetch(base, { headers: auth });
  if (get.ok) {
    const s = await get.json();
    const errors = s.errors ?? 0;
    const warnings = s.warnings ?? 0;
    const submitted = s.contents?.[0]?.submitted ?? '?';
    console.log(
      `  status — submitted URLs: ${submitted}, errors: ${errors}, warnings: ${warnings}` +
        (s.lastDownloaded ? `, lastDownloaded: ${s.lastDownloaded}` : ' (not crawled yet)'),
    );
  }
}

main().catch((e) => die(e.message));
