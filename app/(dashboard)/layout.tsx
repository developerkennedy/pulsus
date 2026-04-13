import type { ReactNode } from 'react';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { getServerSession } from '@/features/auth/lib/get-server-session';
import { isUserRole } from '@/features/auth/lib/user-role';
import { db } from '@/lib/db';
import { clinics } from '@/lib/db/schema';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  if (session.user.isActive === false) {
    redirect('/sign-in');
  }

  const clinicId = session.user.clinicId ?? null;
  const userRole = isUserRole(session.user.role) ? session.user.role : null;
  const clinic = clinicId
    ? await db.query.clinics.findFirst({
        where: eq(clinics.id, clinicId),
        columns: {
          name: true,
        },
      })
    : null;

  return (
    <>
      <AppSidebar
        clinicName={clinic?.name ?? null}
        userName={session.user.name}
        userEmail={session.user.email}
        userRole={userRole}
      />
      <SidebarInset className="min-h-svh overflow-hidden bg-slate-50">
        {children}
      </SidebarInset>
    </>
  );
}
