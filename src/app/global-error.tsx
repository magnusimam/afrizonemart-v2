'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * `global-error.tsx` is the last line of defence — it catches errors
 * thrown by the root layout itself (e.g., GeoProvider, AnalyticsProvider).
 * It MUST render its own <html> and <body> because the regular layout
 * has crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#FAFAF7',
          color: '#1A1A1A',
          margin: 0,
          padding: 0,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '80px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(245,166,35,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={28} color="#F5A623" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0D1F4E', margin: '0 0 12px' }}>
            Afrizonemart is temporarily unavailable
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 8px' }}>
            We&apos;ve logged the error and our team is on it. Please try again
            in a moment.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: '#0D1F4E',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: 1,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
