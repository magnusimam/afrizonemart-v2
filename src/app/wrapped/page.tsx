import { redirect } from 'next/navigation';

/**
 * /wrapped → current year's wrap. The dated route (/wrapped/[year])
 * is the canonical one so old wraps stay linkable after the year rolls.
 */
export default function WrappedIndexPage() {
  redirect(`/wrapped/${new Date().getUTCFullYear()}`);
}
