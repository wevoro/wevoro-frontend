'use client';

import { AdminEditUserModal } from '@/components/global/admin/admin-edit-user-modal';
import AdminHeader from '@/components/global/admin/admin-header';
import { AdminSidebar } from '@/components/global/admin/admin-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin/login');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />

      <SidebarInset className='overflow-y-auto overflow-x-hidden h-full'>
        <AdminHeader />
        <main className='p-6 bg-[#f9f9f9] min-h-[calc(100vh-97px)]'>
          {children}
        </main>
      </SidebarInset>
      <AdminEditUserModal />
    </SidebarProvider>
  );
}
