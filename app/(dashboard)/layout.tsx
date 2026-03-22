import type { ReactNode } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="min-h-svh overflow-hidden bg-slate-50">
        {children}
      </SidebarInset>
    </>
  );
}
