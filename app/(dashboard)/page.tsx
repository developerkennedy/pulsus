'use client';

import { Calendar, DollarSign, Users } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';

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
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    title: 'Receita Mensal',
    value: 'R$ 12.500',
    icon: DollarSign,
    color: 'bg-orange-100 text-orange-600',
  },
] as const;

export default function DashboardPage() {
  return (
    <>
      <header className="border-b bg-white">
        <div className="flex items-center gap-4 px-6 py-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <p className="text-xs text-muted-foreground">
              Menu Principal <span className="mx-1">›</span>{' '}
              <span className="font-medium text-primary">Dashboard</span>
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe os principais indicadores da clínica em um só lugar.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <section
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </h2>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
