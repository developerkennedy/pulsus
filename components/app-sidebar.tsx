'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  Users,
  FileText,
  Building2,
  ShieldCheck,
} from 'lucide-react';

import { SignOutButton } from '@/components/sign-out-button';
import {
  hasPermission,
  type AppPermission,
} from '@/features/auth/lib/permissions';
import type { UserRole } from '@/features/auth/lib/user-role';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Menu items for the sidebar
const menuGroups = [
  {
    label: 'Menu Principal',
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
        requiredPermission: 'dashboard.read' as AppPermission,
      },
      {
        title: 'Agendamentos',
        url: '/appointments',
        icon: Calendar,
        requiredPermission: 'appointment.read' as AppPermission,
      },
      {
        title: 'Médicos',
        url: '/doctors',
        icon: Stethoscope,
        requiredPermission: 'doctor.read' as AppPermission,
      },
      {
        title: 'Pacientes',
        url: '/patients',
        icon: Users,
        requiredPermission: 'patient.read' as AppPermission,
      },
    ],
  },
  {
    label: 'Outros',
    items: [
      {
        title: 'Usuários',
        url: '/users',
        icon: ShieldCheck,
        requiredPermission: 'user.read' as AppPermission,
      },
      {
        title: 'Planos',
        url: '/plans',
        icon: FileText,
        requiredPermission: 'billing.read' as AppPermission,
      },
    ],
  },
];

type AppSidebarProps = {
  clinicName?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: UserRole | null;
};

export function AppSidebar({
  clinicName,
  userName,
  userEmail,
  userRole,
}: AppSidebarProps) {
  const resolvedRole = userRole ?? 'receptionist';

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-button-primary">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Dr.agenda</span>
            <span className="text-xs text-muted-foreground">Clínica Care</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) =>
                    !item.requiredPermission
                      ? true
                      : hasPermission(resolvedRole, item.requiredPermission),
                  )
                  .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9 px-3 text-sm">
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {clinicName ?? 'Clínica'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {userName ?? 'Administrador'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {userEmail ?? 'sem-email@clinica.com'}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <SignOutButton />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
