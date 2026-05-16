/**
 * 2026-05-16 bugfix — centralised registry of every `NEXT_PUBLIC_*`
 * env var the storefront reads, plus a runtime validator.
 *
 * **Why this exists:** on 2026-05-13 a Vercel team transfer dropped
 * the project's env vars without anyone noticing. `NEXT_PUBLIC_API_URL`
 * fell back to the default (`http://localhost:4000`) and customer
 * login silently fetched localhost instead of prod. The Google sign-in
 * button vanished because `NEXT_PUBLIC_GOOGLE_CLIENT_ID` was empty.
 * Both failures were invisible — no banner, no Sentry alert.
 *
 * The watchdog component in `components/common/ConfigWatchdog.tsx`
 * mounts in the root layout, walks this registry on first render,
 * and renders a loud banner (+ Sentry note in prod) when any
 * required var is missing.
 *
 * **Convention:** every time you add a new `process.env.NEXT_PUBLIC_*`
 * read elsewhere in the codebase, add an entry here so the watchdog
 * keeps catching the gap.
 */

export type PublicEnvKey =
  | 'NEXT_PUBLIC_API_URL'
  | 'NEXT_PUBLIC_SITE_URL'
  | 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'
  | 'NEXT_PUBLIC_SENTRY_DSN'
  | 'NEXT_PUBLIC_GTM_ID';

export interface PublicEnvSpec {
  key: PublicEnvKey;
  /// Required vars surface a loud banner when missing in prod.
  /// Optional vars only log a console hint (no banner) so absence
  /// doesn't spam customers if the feature is intentionally off.
  required: boolean;
  /// One-line description of what breaks when this is missing.
  /// Shows in the banner so the next person debugging knows
  /// exactly what to set.
  affects: string;
}

export const PUBLIC_ENV: PublicEnvSpec[] = [
  {
    key: 'NEXT_PUBLIC_API_URL',
    required: true,
    affects:
      'Every API call (login, register, cart, orders). Without this the storefront silently calls http://localhost:4000.',
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    affects:
      'SEO canonicals, sitemap URLs, unsubscribe link redirects.',
  },
  {
    key: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    required: false,
    affects:
      'Google sign-in button on /login and /register. Without it the button is hidden silently.',
  },
  {
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    affects: 'Frontend error reporting to Sentry.',
  },
  {
    key: 'NEXT_PUBLIC_GTM_ID',
    required: false,
    affects: 'Google Tag Manager — analytics + ad pixels.',
  },
];

/// Read every NEXT_PUBLIC_* var at module-load time. Returns an
/// object the watchdog component renders. Done eagerly (not on
/// demand) so the snapshot the banner shows matches what every
/// other module saw — no chance of "I see the var set in console
/// but the watchdog says missing".
export function readPublicEnvSnapshot(): Record<PublicEnvKey, string | null> {
  return {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? null,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? null,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID ?? null,
  };
}

export interface MissingEnvReport {
  required: PublicEnvSpec[];
  optional: PublicEnvSpec[];
  /// 2026-05-16 — values that aren't empty but have leading/trailing
  /// whitespace. Caught a real production bug:
  /// `NEXT_PUBLIC_API_URL="https://api.afrizonemart.com\n"` made every
  /// fetch go to a broken URL because the trailing newline got
  /// appended to the URL. The old watchdog passed because the value
  /// was non-empty.
  corrupted: Array<{ spec: PublicEnvSpec; rawLength: number; trimmedLength: number }>;
}

export function diffPublicEnv(
  snapshot: Record<PublicEnvKey, string | null>,
): MissingEnvReport {
  const required: PublicEnvSpec[] = [];
  const optional: PublicEnvSpec[] = [];
  const corrupted: MissingEnvReport['corrupted'] = [];
  for (const spec of PUBLIC_ENV) {
    const value = snapshot[spec.key];
    if (!value || value.trim().length === 0) {
      if (spec.required) required.push(spec);
      else optional.push(spec);
      continue;
    }
    /// Non-empty but the trimmed length differs → stray whitespace
    /// snuck in (typically from `echo "..."` setting the env or a
    /// dashboard paste with a trailing newline). Surface it so the
    /// operator can re-set without the noise.
    if (value.trim().length !== value.length) {
      corrupted.push({
        spec,
        rawLength: value.length,
        trimmedLength: value.trim().length,
      });
    }
  }
  return { required, optional, corrupted };
}
