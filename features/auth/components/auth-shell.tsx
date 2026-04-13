import type { ReactNode } from 'react';
import Link from 'next/link';
import { CalendarDays, ShieldCheck, Stethoscope, Users } from 'lucide-react';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

const highlights = [
  {
    icon: CalendarDays,
    title: 'Agenda centralizada',
    description:
      'Controle consultas, encaixes e disponibilidade em um só lugar.',
  },
  {
    icon: Users,
    title: 'Pacientes organizados',
    description: 'Cadastros, histórico operacional e atendimento com contexto.',
  },
  {
    icon: ShieldCheck,
    title: 'Acesso seguro',
    description: 'Sessões protegidas e base pronta para escalar por clínica.',
  },
];

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="grid min-h-svh bg-slate-50 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r bg-linear-to-br from-blue-700 via-blue-600 to-cyan-500 px-10 py-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_26%)]" />
        <div className="relative flex w-full flex-col justify-between">
          <div className="space-y-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18 backdrop-blur-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">Pulsus</p>
                <p className="text-sm text-blue-100/90">
                  Gestão médica para clínicas em crescimento
                </p>
              </div>
            </Link>

            <div className="max-w-xl space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-100/80">
                Plataforma SaaS
              </p>
              <h1 className="text-2xl leading-tight font-semibold">
                Atendimento, agenda e operação clínica com a mesma linguagem do
                seu time.
              </h1>
              <p className="max-w-lg text-base text-blue-50/85 mb-4">
                A autenticação entra agora para preparar o produto para
                agendamentos, equipes internas e crescimento por clínica.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-blue-100/85">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10 xl:px-14">
        <div className="mx-auto w-full space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8 space-y-2">
              <p className="text-sm font-medium text-blue-600">Pulsus</p>
              <h2 className="text-3xl font-semibold text-slate-950">{title}</h2>
              <p className="text-sm leading-6 text-slate-500">{description}</p>
            </div>

            {children}
          </div>

          <div className="text-center text-sm text-slate-500">{footer}</div>
        </div>
      </section>
    </div>
  );
}
