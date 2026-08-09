import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supplier sign-in — Afrizonemart',
  robots: { index: false, follow: false },
};

export default function SupplierAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
