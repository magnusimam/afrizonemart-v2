'use client';

import { RouteError } from '@/components/common/RouteError';

export default function AdminError({
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
      homeHref="/admin"
      title="An admin tool failed"
    />
  );
}
