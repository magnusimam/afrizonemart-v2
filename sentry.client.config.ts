import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from '@/lib/sentry-scrub';

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
    sendDefaultPii: false,
    integrations: [
      Sentry.replayIntegration({
        // Phase 11.3 (audit M3): mask everything in session replays
        // by default. Without it, every replay captures form inputs
        // (passwords, card numbers) and chat-style PII.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Trim noisy errors that aren't actionable
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Failed to fetch',
    ],
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });
}
