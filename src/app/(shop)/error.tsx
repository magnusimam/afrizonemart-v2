'use client';

import { RouteError } from '@/components/common/RouteError';

export default function ShopError({
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
      title="We couldn't load this page"
    />
  );
}
