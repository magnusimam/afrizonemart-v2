import * as Sentry from '@sentry/nextjs';

/**
 * Frontend Sentry — initialised on the browser. Activates only when
 * NEXT_PUBLIC_SENTRY_DSN is set, so local dev stays quiet.
 *
 * To activate in prod: create a Sentry project, copy the DSN, set
 * NEXT_PUBLIC_SENTRY_DSN on Vercel, redeploy.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENV ?? 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Trim noisy errors that aren't actionable
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Failed to fetch',
    ],
  });
}
