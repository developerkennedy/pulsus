'use client';

import { CircleCheck, CircleX, SquarePen, UserX } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import {
  formatAppointmentStatusLabel,
  getAppointmentStatusBadgeClass,
} from '@/features/appointments/lib/appointment-formatters';
import type { UpsertAppointmentStatus } from '@/features/appointments/schemas/upsert-appointment-schema';
import type { AppointmentListItem } from '@/features/appointments/lib/appointment-view-model';
import { cn } from '@/lib/utils';

export function getAppointmentsColumns({
  onEdit,
  onStatusChange,
  canEdit,
}: {
  onEdit: (appointment: AppointmentListItem) => void;
  onStatusChange: (appointment: AppointmentListItem, status: UpsertAppointmentStatus) => void;
  canEdit: boolean;
}): ColumnDef<AppointmentListItem>[] {
  const baseColumns: ColumnDef<AppointmentListItem>[] = [
    {
      accessorKey: 'patientName',
      header: 'Paciente',
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">
          {row.original.patientName}
        </span>
      ),
    },
    {
      accessorKey: 'doctorName',
      header: 'Médico',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.original.doctorName}</p>
          <p className="text-xs text-slate-500">{row.original.specialityName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'dateLabel',
      header: 'Data',
    },
    {
      accessorKey: 'timeLabel',
      header: 'Horário',
    },
    {
      accessorKey: 'reasonForVisit',
      header: 'Motivo',
      cell: ({ row }) => (
        <span className="line-clamp-1 text-slate-900">
          {row.original.reasonForVisit}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
            getAppointmentStatusBadgeClass(row.original.status),
          )}
        >
          {formatAppointmentStatusLabel(row.original.status)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const appointment = row.original;
        const isScheduled = appointment.status === 'scheduled';

        return (
          <div className="flex items-center justify-end gap-1">
            {isScheduled && (
              <>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label={`Marcar agendamento de ${appointment.patientName} como concluído`}
                  onClick={() => onStatusChange(appointment, 'completed')}
                >
                  <CircleCheck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                  aria-label={`Marcar agendamento de ${appointment.patientName} como não compareceu`}
                  onClick={() => onStatusChange(appointment, 'no-show')}
                >
                  <UserX className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Cancelar agendamento de ${appointment.patientName}`}
                  onClick={() => onStatusChange(appointment, 'cancelled')}
                >
                  <CircleX className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
              aria-label={`Editar agendamento de ${appointment.patientName}`}
              onClick={() => onEdit(appointment)}
            >
              <SquarePen className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return canEdit ? baseColumns : baseColumns.filter((col) => col.id !== 'actions');
}
