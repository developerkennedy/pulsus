'use client';

import { PowerOff, SquarePen, Zap } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { formatPhone } from '@/lib/formatters';
import type { PatientListItem } from '@/features/patients/lib/patient-view-model';

export function getPatientsColumns({
  onEdit,
  onDeactivate,
  onReactivate,
  canEdit,
}: {
  onEdit: (patient: PatientListItem) => void;
  onDeactivate: (patient: PatientListItem) => void;
  onReactivate: (patient: PatientListItem) => void;
  canEdit: boolean;
}): ColumnDef<PatientListItem>[] {
  const baseColumns: ColumnDef<PatientListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
    },
    {
      accessorKey: 'phone',
      header: 'Número de celular',
      cell: ({ row }) => formatPhone(row.original.phone) || 'Não informado',
    },
    {
      accessorKey: 'gender',
      header: 'Sexo',
      cell: ({ row }) => (
        <span className="text-slate-900">{row.original.gender}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const patient = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            {patient.isActive ? (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Desativar ${patient.name}`}
                onClick={() => onDeactivate(patient)}
              >
                <PowerOff className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                aria-label={`Reativar ${patient.name}`}
                onClick={() => onReactivate(patient)}
              >
                <Zap className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
              aria-label={`Editar ${patient.name}`}
              onClick={() => onEdit(patient)}
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
