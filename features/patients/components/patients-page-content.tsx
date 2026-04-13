'use client';

import { useMemo, useTransition, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  patientStatusFilterOptions,
  type PatientStatusFilter,
} from '@/features/patients/lib/patient-filters';
import { cn } from '@/lib/utils';
import { deactivatePatientAction } from '@/features/patients/actions/deactivate-patient';
import { reactivatePatientAction } from '@/features/patients/actions/reactivate-patient';
import { getPatientsColumns } from '@/features/patients/components/patients-columns';
import { UpsertPatientForm } from '@/features/patients/components/upsert-patient-form';
import { mapPatientToFormValues } from '@/features/patients/lib/patient-mappers';
import type { PatientPaginationMeta } from '@/features/patients/lib/patient-pagination';
import type { PatientListItem } from '@/features/patients/lib/patient-view-model';
import type { UserRole } from '@/features/auth/lib/user-role';
import { hasPermission } from '@/features/auth/lib/permissions';

type PatientsPageContentProps = {
  patients: PatientListItem[];
  currentFilter: PatientStatusFilter;
  pagination: PatientPaginationMeta;
  userRole: UserRole;
  accessNotice?: string | null;
};

export function PatientsPageContent({
  patients,
  currentFilter,
  pagination,
  userRole,
  accessNotice,
}: PatientsPageContentProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [patientToDeactivate, setPatientToDeactivate] = useState<PatientListItem | null>(null);
  const [, startTransition] = useTransition();

  const initialData = useMemo(
    () => mapPatientToFormValues(selectedPatient),
    [selectedPatient],
  );

  function handleDeactivatePatient(patient: PatientListItem) {
    setPatientToDeactivate(patient);
  }

  function confirmDeactivatePatient() {
    if (!patientToDeactivate) return;

    startTransition(async () => {
      const result = await deactivatePatientAction(patientToDeactivate.id);

      setPatientToDeactivate(null);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleReactivatePatient(patient: PatientListItem) {
    startTransition(async () => {
      const result = await reactivatePatientAction(patient.id);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCreatePatient() {
    setSelectedPatient(null);
    setIsSheetOpen(true);
  }

  function handleEditPatient(patient: PatientListItem) {
    setSelectedPatient(patient);
    setIsSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open);

    if (!open) {
      setSelectedPatient(null);
    }
  }

  function handleFormSuccess() {
    setIsSheetOpen(false);
    setSelectedPatient(null);
  }

  function buildPatientsHref(page: number) {
    const params = new URLSearchParams();

    if (currentFilter !== 'active') {
      params.set('status', currentFilter);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    const queryString = params.toString();

    return queryString ? `/patients?${queryString}` : '/patients';
  }

  const canManage = hasPermission(userRole, 'patient.manage');
  const hasPatients = patients.length > 0;
  const columns = getPatientsColumns({
    onEdit: handleEditPatient,
    onDeactivate: handleDeactivatePatient,
    onReactivate: handleReactivatePatient,
    canEdit: canManage,
  });

  return (
    <>
      <AlertDialog
        open={!!patientToDeactivate}
        onOpenChange={(open) => { if (!open) setPatientToDeactivate(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar <strong>{patientToDeactivate?.name}</strong>? O paciente não poderá ser usado em novos agendamentos enquanto estiver inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivatePatient}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                Access a detailed overview of key metrics and patient outcomes
              </p>
            </div>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            {canManage ? (
              <SheetTrigger asChild>
                <Button
                  className="gap-2 bg-primary text-primary-foreground shadow-sm"
                  onClick={handleCreatePatient}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar paciente
                </Button>
              </SheetTrigger>
            ) : null}

            <UpsertPatientForm
              key={selectedPatient?.id ?? 'new-patient'}
              initialData={initialData}
              onSuccess={handleFormSuccess}
              canEdit={canManage}
            />
          </Sheet>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {accessNotice ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {accessNotice}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {patientStatusFilterOptions.map((filterOption) => {
            const href =
              filterOption.value === 'active'
                ? '/patients'
                : `/patients?status=${filterOption.value}`;

            return (
              <Button
                key={filterOption.value}
                asChild
                variant={
                  currentFilter === filterOption.value ? 'default' : 'outline'
                }
                className={cn(
                  'min-w-24',
                  currentFilter === filterOption.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white',
                )}
              >
                <Link href={href}>{filterOption.label}</Link>
              </Button>
            );
          })}
        </div>

        {hasPatients ? (
          <DataTable
            columns={columns}
            data={patients}
            pagination={pagination}
            itemLabel="pacientes"
            buildPageHref={buildPatientsHref}
            rowClassName={(patient) =>
              !patient.isActive ? 'bg-rose-50/80 hover:bg-rose-50/80' : undefined
            }
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {currentFilter === 'inactive'
                ? 'Nenhum paciente inativo'
                : currentFilter === 'all'
                  ? 'Nenhum paciente encontrado'
                  : 'Nenhum paciente cadastrado'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {currentFilter === 'inactive'
                ? 'Quando houver pacientes desativados, eles aparecerão aqui para consulta e possível reativação.'
                : currentFilter === 'all'
                  ? 'Assim que houver pacientes cadastrados, eles aparecerão nesta tabela com nome, contato e sexo.'
                  : 'Assim que você cadastrar pacientes, eles aparecerão nesta tabela com nome, contato e sexo.'}
            </p>
            {canManage ? (
              <Button
                className="mt-6 gap-2 bg-primary text-primary-foreground"
                onClick={handleCreatePatient}
              >
                <Plus className="h-4 w-4" />
                Adicionar paciente
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
