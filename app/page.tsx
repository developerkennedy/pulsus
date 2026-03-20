'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Users, Calendar, DollarSign } from 'lucide-react';

export default function Home() {
  const stats = [
    {
      title: 'Total de Médicos',
      value: '5',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Agendamentos',
      value: '24',
      icon: Calendar,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Pacientes',
      value: '128',
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 12.500',
      icon: DollarSign,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="flex items-center gap-4 px-6 py-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo ao dr.agenda
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </h3>
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
