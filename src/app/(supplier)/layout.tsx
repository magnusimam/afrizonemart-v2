import type { Metadata } from 'next';
import { RequireSupplier } from '@/components/supplier/RequireSupplier';
import { SupplierShell } from '@/components/supplier/SupplierShell';

export const metadata: Metadata = {
  title: 'Supplier Portal — Afrizonemart',
  robots: { index: false, follow: false },
};

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSupplier>
      <SupplierShell>{children}</SupplierShell>
    </RequireSupplier>
  );
}
