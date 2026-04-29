import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { ToastViewport } from '@/components/admin/Toast';
import { SafeBoundary } from '@/components/common/SafeBoundary';

export const metadata = {
  title: 'Afrizonemart Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen bg-page">
        <SafeBoundary name="admin:sidebar"><AdminSidebar /></SafeBoundary>
        <div className="flex-1 overflow-x-auto">
          <SafeBoundary name="admin:page">{children}</SafeBoundary>
        </div>
        <SafeBoundary name="admin:toast" fallback={null}>
          <ToastViewport />
        </SafeBoundary>
      </div>
    </RequireAdmin>
  );
}
