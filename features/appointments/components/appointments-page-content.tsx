'use client';

import Link from 'next/link';
import { useMemo, useTransition, useState } from 'react';
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
import { Dialog } from '@/components/ui/dialog';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getAppointmentsColumns } from '@/features/appointments/components/appointments-columns';
import { UpsertAppointmentForm } from '@/features/appointments/components/upsert-appointment-form';
import { updateAppointmentStatusAction } from '@/features/appointments/actions/update-appointment-status';
import {
  appointmentStatusFilterOptions,
  type AppointmentStatusFilter,
} from '@/features/appointments/lib/appointment-filters';
import { getAppointmentRowClass } from '@/features/appointments/lib/appointment-formatters';
import { mapAppointmentToFormValues } from '@/features/appointments/lib/appointment-mappers';
import type { AppointmentPaginationMeta } from '@/features/appointments/lib/appointment-pagination';
import type {
  AppointmentDoctorOption,
  AppointmentListItem,
  AppointmentPatientOption,
} from '@/features/appointments/lib/appointment-view-model';
import type { UpsertAppointmentStatus } from '@/features/appointments/schemas/upsert-appointment-schema';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/features/auth/lib/user-role';
import { hasPermission } from '@/features/auth/lib/permissions';

type AppointmentsPageContentProps = {
  appointments: AppointmentListItem[];
  doctors: AppointmentDoctorOption[];
  patients: AppointmentPatientOption[];
  currentFilter: AppointmentStatusFilter;
  pagination: AppointmentPaginationMeta;
  userRole: UserRole;
  accessNotice?: string | null;
};

export function AppointmentsPageContent({
  appointments,
  doctors,
  patients,
  currentFilter,
  pagination,
  userRole,
  accessNotice,
}: AppointmentsPageContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentListItem | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    appointment: AppointmentListItem;
    status: UpsertAppointmentStatus;
  } | null>(null);
  const [, startTransition] = useTransition();

  const initialData = useMemo(
    () => mapAppointmentToFormValues(selectedAppointment),
    [selectedAppointment],
  );

  const canManage = hasPermission(userRole, 'appointment.manage');
  const columns = getAppointmentsColumns({
    onEdit: handleEditAppointment,
    onStatusChange: handleStatusChange,
    canEdit: canManage,
  });
  const canCreateAppointments = canManage && doctors.length > 0 && patients.length > 0;

  function handleStatusChange(
    appointment: AppointmentListItem,
    status: UpsertAppointmentStatus,
  ) {
    if (status === 'cancelled' || status === 'no-show') {
      setPendingStatusChange({ appointment, status });
      return;
    }

    executeStatusChange(appointment.id, status);
  }

  function confirmStatusChange() {
    if (!pendingStatusChange) return;

    executeStatusChange(pendingStatusChange.appointment.id, pendingStatusChange.status);
    setPendingStatusChange(null);
  }

  function executeStatusChange(appointmentId: string, status: UpsertAppointmentStatus) {
    startTransition(async () => {
      const result = await updateAppointmentStatusAction(appointmentId, status);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCreateAppointment() {
    setSelectedAppointment(null);
    setIsDialogOpen(true);
  }

  function handleEditAppointment(appointment: AppointmentListItem) {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setIsDialogOpen(open);

    if (!open) {
      setSelectedAppointment(null);
    }
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    setSelectedAppointment(null);
  }

  function buildAppointmentsHref(page: number) {
    const params = new URLSearchParams();

    if (currentFilter !== 'scheduled') {
      params.set('status', currentFilter);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    const queryString = params.toString();

    return queryString ? `/appointments?${queryString}` : '/appointments';
  }

  const hasAppointments = appointments.length > 0;

  const confirmLabel =
    pendingStatusChange?.status === 'cancelled' ? 'Cancelar agendamento' : 'Registrar não comparecimento';

  const confirmDescription =
    pendingStatusChange?.status === 'cancelled'
      ? `Tem certeza que deseja cancelar o agendamento de ${pendingStatusChange?.appointment.patientName}? Esta ação não pode ser desfeita.`
      : `Tem certeza que deseja registrar não comparecimento de ${pendingStatusChange?.appointment.patientName}?`;

  return (
    <>
      <AlertDialog
        open={!!pendingStatusChange}
        onOpenChange={(open) => { if (!open) setPendingStatusChange(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmLabel}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <UpsertAppointmentForm
          key={selectedAppointment?.id ?? 'new-appointment'}
          initialData={initialData}
          doctors={doctors}
          patients={patients}
          onSuccess={handleFormSuccess}
        />
      </Dialog>

      <header className="border-b bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <p className="text-xs text-muted-foreground">
                Menu Principal <span className="mx-1">›</span>{' '}
                <span className="font-medium text-primary">Agendamentos</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground">
                Agendamentos
              </h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe os agendamentos da clínica com status, horário e
                vínculo com médicos e pacientes.
              </p>
            </div>
          </div>

          {canManage ? (
            <Button
              className="gap-2 bg-primary text-primary-foreground shadow-sm"
              disabled={!canCreateAppointments}
              onClick={handleCreateAppointment}
            >
              <Plus className="h-4 w-4" />
              Adicionar agendamento
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {accessNotice ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {accessNotice}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {appointmentStatusFilterOptions.map((filterOption) => {
              const href =
                filterOption.value === 'scheduled'
                  ? '/appointments'
                  : `/appointments?status=${filterOption.value}`;

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

          {!canCreateAppointments ? (
            <p className="text-sm text-amber-700">
              Para criar agendamentos, cadastre ao menos um médico e um
              paciente ativos.
            </p>
          ) : null}
        </div>

        {hasAppointments ? (
          <DataTable
            columns={columns}
            data={appointments}
            pagination={pagination}
            itemLabel="agendamentos"
            buildPageHref={buildAppointmentsHref}
            rowClassName={(appointment) =>
              getAppointmentRowClass(appointment.status)
            }
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {currentFilter === 'scheduled'
                  ? 'Nenhum agendamento marcado'
                  : currentFilter === 'completed'
                  ? 'Nenhum agendamento concluído'
                  : currentFilter === 'cancelled'
                    ? 'Nenhum agendamento cancelado'
                    : currentFilter === 'no-show'
                      ? 'Nenhum não comparecimento registrado'
                      : 'Nenhum agendamento encontrado'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {canCreateAppointments
                ? 'Assim que os agendamentos forem criados, eles aparecerão aqui com paciente, médico, horário e status.'
                : 'Antes de agendar, garanta que a clínica tenha pelo menos um médico e um paciente ativos.'}
            </p>
            {canManage ? (
              <Button
                className="mt-6 gap-2 bg-primary text-primary-foreground"
                onClick={handleCreateAppointment}
                disabled={!canCreateAppointments}
              >
                <Plus className="h-4 w-4" />
                Adicionar agendamento
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
