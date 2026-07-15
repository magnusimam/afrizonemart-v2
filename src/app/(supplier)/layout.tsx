import { RequireSupplier } from '@/components/supplier/RequireSupplier';
import { SupplierShell } from '@/components/supplier/SupplierShell';
import { ToastViewport } from '@/components/admin/Toast';
import { SafeBoundary } from '@/components/common/SafeBoundary';

export const metadata = {
  title: 'Afrizonemart Supplier Portal',
};

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSupplier>
      <SupplierShell>{children}</SupplierShell>
      <SafeBoundary name="supplier:toast" fallback={null}>
        <ToastViewport />
      </SafeBoundary>
    </RequireSupplier>
  );
}
