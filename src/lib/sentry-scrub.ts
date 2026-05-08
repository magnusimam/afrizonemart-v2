/**
 * Phase 11.3 (audit M3) — Sentry PII scrubber for the storefront.
 *
 * Mirrors `afrizonemart-api/src/infra/sentry.ts`. Imported by all
 * three Next.js Sentry config files (client, server, edge) so the
 * sensitive-key list is single-source.
 *
 * Without this hook Sentry captures the full request: Authorization
 * headers, refresh-token cookies, password / token body fields. Every
 * prod error becomes a credential leak to a third-party SaaS.
 */

const SENSITIVE_BODY_KEYS = new Set(
  [
    'password',
    'newPassword',
    'currentPassword',
    'oldPassword',
    'secretKey',
    'secretHash',
    'token',
    'tokenHash',
    'accessToken',
    'refreshToken',
    'idToken',
    'nonce',
    'cardNumber',
    'cvv',
    'cvc',
    'creditCard',
    'pin',
  ].map((k) => k.toLowerCase()),
);

const SENSITIVE_HEADERS = new Set(
  [
    'authorization',
    'cookie',
    'set-cookie',
    'x-stub-signature',
    'x-squad-encrypted-body',
    'verif-hash',
    'x-flw-secret-hash',
  ].map((k) => k.toLowerCase()),
);

function scrubObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(scrubObject);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_BODY_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[k] = scrubObject(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function scrubHeaders(headers: unknown): unknown {
  if (!headers || typeof headers !== 'object') return headers;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    out[k] = SENSITIVE_HEADERS.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return out;
}

type SentryEventLike = {
  request?: {
    headers?: unknown;
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
  };
  contexts?: Record<string, unknown>;
  extra?: unknown;
};

export function scrubSentryEvent<T extends SentryEventLike>(event: T): T {
  if (event.request) {
    if (event.request.headers) {
      event.request.headers = scrubHeaders(event.request.headers);
    }
    delete event.request.cookies;
    if (event.request.data) {
      event.request.data = scrubObject(event.request.data);
    }
    if (event.request.query_string && typeof event.request.query_string === 'object') {
      event.request.query_string = scrubObject(event.request.query_string);
    }
  }
  if (event.contexts) {
    for (const k of Object.keys(event.contexts)) {
      event.contexts[k] = scrubObject(event.contexts[k]);
    }
  }
  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }
  return event;
}
