import { SquarePen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { PatientListItem } from '@/features/patients/lib/patient-view-model';

type PatientsPageContentProps = {
  patients: PatientListItem[];
};

export function PatientsPageContent({
  patients,
}: PatientsPageContentProps) {
  const hasPatients = patients.length > 0;

  return (
    <>
      <header className="border-b bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <p className="text-xs text-muted-foreground">
                Menu Principal <span className="mx-1">›</span>{' '}
                <span className="font-medium text-primary">Pacientes</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground">
                Pacientes
              </h1>
              <p className="text-sm text-muted-foreground">
                Acesse a listagem completa dos pacientes cadastrados na clínica.
              </p>
            </div>
          </div>

          <Button className="bg-primary text-primary-foreground">
            Adicionar paciente
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {hasPatients ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="rounded-l-xl px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Nome
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      E-mail
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Número de celular
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sexo
                    </th>
                    <th className="rounded-r-xl px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="group">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-medium text-slate-900">
                        {patient.name}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm text-slate-600">
                        {patient.email}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm text-slate-600">
                        {patient.phone}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm text-slate-600">
                        {patient.gender}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-primary"
                          aria-label={`Editar ${patient.name}`}
                        >
                          <SquarePen className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Nenhum paciente cadastrado
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Assim que você cadastrar pacientes, eles aparecerão nesta tabela
              com nome, contato e sexo.
            </p>
            <Button className="mt-6 bg-primary text-primary-foreground">
              Adicionar paciente
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
