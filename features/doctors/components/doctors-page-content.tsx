'use client';

import Link from 'next/link';
import { useMemo, useTransition, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import UpsertDoctorForm from '@/components/upsert-doctor-form';
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
import { deactivateDoctorAction } from '@/features/doctors/actions/deactivate-doctor';
import { reactivateDoctorAction } from '@/features/doctors/actions/reactivate-doctor';
import { getDoctorsColumns } from '@/features/doctors/components/doctors-columns';
import {
  doctorStatusFilterOptions,
  type DoctorStatusFilter,
} from '@/features/doctors/lib/doctor-filters';
import { mapDoctorToFormValues } from '@/features/doctors/lib/doctor-mappers';
import type { DoctorPaginationMeta } from '@/features/doctors/lib/doctor-pagination';
import type {
  DoctorListItem,
  DoctorSpecialityOption,
} from '@/features/doctors/lib/doctor-view-model';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/features/auth/lib/user-role';
import { hasPermission } from '@/features/auth/lib/permissions';

type DoctorsPageContentProps = {
  doctors: DoctorListItem[];
  specialities: DoctorSpecialityOption[];
  currentFilter: DoctorStatusFilter;
  pagination: DoctorPaginationMeta;
  userRole: UserRole;
  accessNotice?: string | null;
};

export function DoctorsPageContent({
  doctors,
  specialities,
  currentFilter,
  pagination,
  userRole,
  accessNotice,
}: DoctorsPageContentProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(null);
  const [doctorToDeactivate, setDoctorToDeactivate] = useState<DoctorListItem | null>(null);
  const [, startTransition] = useTransition();

  const initialData = useMemo(
    () => mapDoctorToFormValues(selectedDoctor),
    [selectedDoctor],
  );

  const canManage = hasPermission(userRole, 'doctor.manage');
  const columns = getDoctorsColumns({
    onEdit: handleEditDoctor,
    onDeactivate: handleDeactivateDoctor,
    onReactivate: handleReactivateDoctor,
    canEdit: canManage,
  });

  function handleDeactivateDoctor(doctor: DoctorListItem) {
    setDoctorToDeactivate(doctor);
  }

  function confirmDeactivateDoctor() {
    if (!doctorToDeactivate) return;

    startTransition(async () => {
      const result = await deactivateDoctorAction(doctorToDeactivate.id);

      setDoctorToDeactivate(null);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleReactivateDoctor(doctor: DoctorListItem) {
    startTransition(async () => {
      const result = await reactivateDoctorAction(doctor.id);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCreateDoctor() {
    setSelectedDoctor(null);
    setIsSheetOpen(true);
  }

  function handleEditDoctor(doctor: DoctorListItem) {
    setSelectedDoctor(doctor);
    setIsSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open);

    if (!open) {
      setSelectedDoctor(null);
    }
  }

  function handleFormSuccess() {
    setIsSheetOpen(false);
    setSelectedDoctor(null);
  }

  function buildDoctorsHref(page: number) {
    const params = new URLSearchParams();

    if (currentFilter !== 'active') {
      params.set('status', currentFilter);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    const queryString = params.toString();

    return queryString ? `/doctors?${queryString}` : '/doctors';
  }

  const hasDoctors = doctors.length > 0;

  return (
    <>
      <AlertDialog
        open={!!doctorToDeactivate}
        onOpenChange={(open) => { if (!open) setDoctorToDeactivate(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar médico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar <strong>{doctorToDeactivate?.name}</strong>? O médico não poderá receber novos agendamentos enquanto estiver inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivateDoctor}>
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
                <span className="font-medium text-primary">Médicos</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground">
                Médicos
              </h1>
              <p className="text-sm text-muted-foreground">
                Acesse a listagem detalhada de seus médicos
              </p>
            </div>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            {canManage ? (
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  className="gap-2 bg-primary text-primary-foreground shadow-sm"
                  onClick={handleCreateDoctor}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Médico
                </Button>
              </SheetTrigger>
            ) : null}

            <UpsertDoctorForm
              key={selectedDoctor?.id ?? 'new-doctor'}
              initialData={initialData}
              specialities={specialities}
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
          {doctorStatusFilterOptions.map((filterOption) => {
            const href =
              filterOption.value === 'active'
                ? '/doctors'
                : `/doctors?status=${filterOption.value}`;

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

        {hasDoctors ? (
          <DataTable
            columns={columns}
            data={doctors}
            pagination={pagination}
            itemLabel="médicos"
            buildPageHref={buildDoctorsHref}
            rowClassName={(doctor) =>
              !doctor.isActive ? 'bg-rose-50/80 hover:bg-rose-50/80' : undefined
            }
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {currentFilter === 'inactive'
                ? 'Nenhum médico inativo'
                : currentFilter === 'all'
                  ? 'Nenhum médico encontrado'
                  : 'Nenhum médico cadastrado'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {currentFilter === 'inactive'
                ? 'Quando houver médicos desativados, eles aparecerão aqui para consulta e possível reativação.'
                : currentFilter === 'all'
                  ? 'Assim que houver médicos cadastrados, eles aparecerão nesta tabela com dados de contato e disponibilidade.'
                  : 'Cadastre o primeiro médico e configure os dias e horários de atendimento.'}
            </p>
            {canManage ? (
              <Button
                className="mt-6 gap-2 bg-primary text-primary-foreground"
                onClick={handleCreateDoctor}
              >
                <Plus className="h-4 w-4" />
                Adicionar médico
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
