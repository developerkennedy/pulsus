'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  Users,
  FileText,
  ChevronsUpDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
      },
      {
        title: 'Agendamentos',
        url: '/appointments',
        icon: Calendar,
      },
      {
        title: 'Médicos',
        url: '/doctors',
        icon: Stethoscope,
      },
      {
        title: 'Pacientes',
        url: '/patients',
        icon: Users,
      },
    ],
  },
  {
    label: 'Outros',
    items: [
      {
        title: 'Planos',
        url: '#',
        icon: FileText,
      },
    ],
  },
];

export function AppSidebar() {
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
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9 px-3 text-sm">
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </a>
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
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold">
                  CC
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-medium">Clínica Care</span>
                  <span className="text-xs text-muted-foreground">
                    clinica@example.com
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
