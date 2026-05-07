/**
 * Phase 11.3 — closes audit finding C3 (open redirect).
 *
 * Validates a `returnUrl` query param against the current origin
 * before passing it to `router.push`. Rejects:
 *   - Absolute URLs to other origins (`https://attacker.com/`)
 *   - Protocol-relative URLs (`//attacker.com/foo`) — these were the
 *     C3 exploit because `'//foo'.startsWith('/')` is true.
 *   - Backslash tricks some browsers normalise (`/\\evil.com`).
 *   - Anything that the WHATWG URL parser resolves to a different
 *     origin than the current page.
 *
 * Returns the safe path-and-query (`/account`, `/checkout?step=1`)
 * suitable for `router.push`, or the fallback when the input fails
 * any of the above checks.
 *
 * Use this for every place that consumes a redirect-after-login
 * (`returnUrl`, `next`, `continue`, etc.) — there is no
 * "I-just-want-to-trust-this-once" exception in any threat model
 * worth shipping.
 *
 * Optional `requirePrefix` constrains the path further — e.g. the
 * admin login passes `/admin` so a customer-page returnUrl is also
 * rejected. Useful when the gate's caller must stay inside a
 * specific route group.
 */
export function safeReturnUrl(
  rawUrl: string | null | undefined,
  fallback: string,
  options: { requirePrefix?: string } = {},
): string {
  if (!rawUrl) return fallback;

  // Origin reference — `window` exists because callers run in
  // 'use client' contexts. SSR callers must build a base URL another
  // way; throw rather than silently fall through.
  if (typeof window === 'undefined') return fallback;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl, window.location.origin);
  } catch {
    return fallback;
  }

  if (parsed.origin !== window.location.origin) return fallback;

  const path = parsed.pathname + parsed.search + parsed.hash;

  if (options.requirePrefix && !path.startsWith(options.requirePrefix)) {
    return fallback;
  }

  return path;
}
