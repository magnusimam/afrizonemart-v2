#!/usr/bin/env node

/**
 * Storefront smoke test — hits a handful of critical routes against a
 * given base URL and exits non-zero if any return 5xx. Run after every
 * deploy (or against a Vercel preview before merging) to catch the
 * runtime failures that build-success can hide.
 *
 * Usage:
 *   node scripts/smoke.mjs https://afrizonemart.com
 *   node scripts/smoke.mjs https://<vercel-preview>.vercel.app
 *
 * Why this exists: 2026-05-08 incident. A transitive npm dep
 * (@exodus/bytes) silently flipped to ESM-only via semver bump
 * during an unrelated `npm install`. Build succeeded; every
 * /product/<slug> 500'd at SSR runtime. We only noticed when the
 * CTO manually clicked through. This script catches that class of
 * failure before merge.
 *
 * What gets checked:
 *   - homepage (/)
 *   - cart (/cart)
 *   - login (/login)
 *   - checkout flow (/checkout/shipping)
 *   - admin login (/admin/login)
 *   - product detail (/product/<known-slug>) — the 2026-05-08 break
 *   - blog detail (/blog/<known-slug>) — also uses sanitize-html
 *   - search (/search?q=test)
 *
 * The script is plain Node (no deps) so it runs anywhere — local
 * machine, GitHub Actions, Vercel post-deploy hook.
 */

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error('Usage: node scripts/smoke.mjs <base-url>');
  console.error('Example: node scripts/smoke.mjs https://afrizonemart.com');
  process.exit(2);
}

// Normalize: strip trailing slash.
const base = baseUrl.replace(/\/$/, '');

/**
 * Critical routes. Each entry is `[path, label]`. If a path needs
 * a known-good slug (product, blog), pick one that's seeded /
 * unlikely to be deleted.
 *
 * Add new routes here when shipping a new top-level page.
 */
const routes = [
  ['/', 'home'],
  ['/cart', 'cart'],
  ['/login', 'login'],
  ['/checkout/shipping', 'checkout-shipping'],
  ['/admin/login', 'admin-login'],
  // Product detail — the 2026-05-08 incident path. Uses RICHTEXT
  // sanitization on the SSR path. Pick a slug that's been live for
  // a while and unlikely to be deleted.
  ['/product/golden-penny-semovita-5kg', 'product-detail'],
  // Blog detail — also uses sanitize-html. Skip if no posts exist.
  // If 404, that's fine — it means the slug was deleted, not 500.
  ['/blog/welcome-to-afrizonemart', 'blog-detail (404 ok)'],
  // Search — exercises the search route handler.
  ['/search?q=test', 'search'],
];

const FAIL_ON = new Set([500, 502, 503, 504]);
// 404s and 401s are acceptable for some routes (slug deleted,
// admin redirects, etc.). The script only fails on 5xx.

async function checkOne(path, label) {
  const url = `${base}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'azm-smoke/1.0' },
    });
    const ms = Date.now() - start;
    const failed = FAIL_ON.has(res.status);
    return {
      path,
      label,
      status: res.status,
      ms,
      failed,
    };
  } catch (err) {
    const ms = Date.now() - start;
    return {
      path,
      label,
      status: 0,
      ms,
      failed: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

(async () => {
  console.log(`Smoke test against: ${base}\n`);
  const results = await Promise.all(routes.map(([p, l]) => checkOne(p, l)));

  const failures = results.filter((r) => r.failed);

  for (const r of results) {
    const tag = r.failed ? '✗' : '✓';
    const detail = r.error ? ` — ${r.error}` : '';
    console.log(`  ${tag} ${String(r.status).padEnd(3)}  ${String(r.ms).padStart(5)}ms  ${r.path}  (${r.label})${detail}`);
  }

  console.log();
  if (failures.length > 0) {
    console.error(`FAIL — ${failures.length}/${results.length} routes returned 5xx or errored`);
    console.error('Pull the full stack: vercel logs <url> | grep -A 20 Error');
    process.exit(1);
  }
  console.log(`PASS — all ${results.length} routes returned non-5xx`);
  process.exit(0);
})();
