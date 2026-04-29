import * as Sentry from '@sentry/nextjs';

/**
 * Sentry on the Edge runtime — minimal config for middleware errors.
 */
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENV ?? 'production',
    tracesSampleRate: 0.1,
  });
}
