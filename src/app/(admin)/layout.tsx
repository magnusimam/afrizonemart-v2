import { AdminShell } from '@/components/admin/AdminShell';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { ToastViewport } from '@/components/admin/Toast';
import { SafeBoundary } from '@/components/common/SafeBoundary';

export const metadata = {
  title: 'Afrizonemart Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
      <SafeBoundary name="admin:toast" fallback={null}>
        <ToastViewport />
      </SafeBoundary>
    </RequireAdmin>
  );
}
