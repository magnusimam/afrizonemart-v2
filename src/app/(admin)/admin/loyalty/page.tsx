import { redirect } from 'next/navigation';

/**
 * /admin/loyalty has no overview page in PR 1 — the two sub-pages
 * (config + accounts) are the surface. Land users on config by
 * default since that's the first thing operators want to verify
 * when they enable the program.
 */
export default function LoyaltyIndexPage() {
  redirect('/admin/loyalty/config');
}
