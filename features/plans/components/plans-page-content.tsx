'use client';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isCurrent: boolean;
};

const plans: Plan[] = [
  {
    id: 'essential',
    name: 'Essential',
    description: 'Para profissionais autônomos ou pequenas clínicas',
    price: 59,
    isCurrent: true,
    features: [
      'Cadastro de até 3 médicos',
      'Agendamentos ilimitados',
      'Métricas básicas',
      'Cadastro de pacientes',
      'Confirmação manual',
      'Suporte via e-mail',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para clínicas em crescimento com mais demanda',
    price: 129,
    isCurrent: false,
    features: [
      'Cadastro de até 10 médicos',
      'Agendamentos ilimitados',
      'Métricas avançadas',
      'Cadastro de pacientes',
      'Confirmação automática',
      'Suporte prioritário',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes clínicas e redes de saúde',
    price: 249,
    isCurrent: false,
    features: [
      'Médicos ilimitados',
      'Agendamentos ilimitados',
      'Métricas completas e relatórios',
      'Cadastro de pacientes',
      'Confirmação automática',
      'Suporte dedicado 24/7',
    ],
  },
];

export function PlansPageContent() {
  return (
    <>
      <header className="border-b bg-white">
        <div className="flex items-center gap-4 px-6 py-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <p className="text-xs text-muted-foreground">
              Outros <span className="mx-1">›</span>{' '}
              <span className="font-medium text-primary">Planos</span>
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Planos</h1>
            <p className="text-sm text-muted-foreground">
              Escolha o plano ideal para a sua clínica
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col rounded-2xl border bg-white p-6 shadow-sm',
                plan.isCurrent && 'border-primary/30',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                {plan.isCurrent && (
                  <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-medium text-teal-700">
                    Atual
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900">
                  R${plan.price}
                </span>
                <span className="ml-1 text-sm text-slate-500">/ mês</span>
              </div>

              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={plan.isCurrent}
                >
                  {plan.isCurrent ? 'Plano atual' : 'Fazer Upgrade'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
