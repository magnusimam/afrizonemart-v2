'use client';

import { RouteError } from '@/components/common/RouteError';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="We couldn't load the sign-in page"
    />
  );
}
