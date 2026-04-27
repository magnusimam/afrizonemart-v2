import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { ToastViewport } from '@/components/admin/Toast';

export const metadata = {
  title: 'Afrizonemart Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen bg-page">
        <AdminSidebar />
        <div className="flex-1 overflow-x-auto">{children}</div>
        <ToastViewport />
      </div>
    </RequireAdmin>
  );
}
