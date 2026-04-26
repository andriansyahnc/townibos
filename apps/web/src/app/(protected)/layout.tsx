"use client";
import { useSidebar } from '@/context/SidebarContext';
import { ModulesProvider } from '@/context/ModulesContext';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import Backdrop from '@/layout/Backdrop';
import { AuthGuard } from '@/components/auth-guard';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const margin = isMobileOpen
    ? 'ml-0'
    : isExpanded || isHovered
    ? 'lg:ml-[250px]'
    : 'lg:ml-[72px]';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppSidebar />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${margin}`}>
        <AppHeader />
        <main className="p-4 md:p-6 max-w-screen-2xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ModulesProvider>
        <AdminLayout>{children}</AdminLayout>
      </ModulesProvider>
    </AuthGuard>
  );
}
