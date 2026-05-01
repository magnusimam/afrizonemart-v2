import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin sign-in — Afrizonemart',
  // Keep the admin sign-in out of search results entirely. The page
  // doesn't link to anything customers care about and surfacing it
  // would only invite credential-stuffing.
  robots: { index: false, follow: false },
};

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
