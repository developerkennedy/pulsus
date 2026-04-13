'use client';

import { PowerOff, SquarePen, Zap } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/formatters';
import { formatDoctorPrice } from '@/features/doctors/lib/doctor-formatters';
import type { DoctorListItem } from '@/features/doctors/lib/doctor-view-model';

export function getDoctorsColumns({
  onEdit,
  onDeactivate,
  onReactivate,
  canEdit,
}: {
  onEdit: (doctor: DoctorListItem) => void;
  onDeactivate: (doctor: DoctorListItem) => void;
  onReactivate: (doctor: DoctorListItem) => void;
  canEdit: boolean;
}): ColumnDef<DoctorListItem>[] {
  const baseColumns: ColumnDef<DoctorListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.original.name}</p>
          <p className="text-xs font-normal text-slate-500">
            {row.original.email}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'specialty',
      header: 'Especialidade',
    },
    {
      accessorKey: 'license',
      header: 'Registro',
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => formatPhone(row.original.phone) || 'Não informado',
    },
    {
      accessorKey: 'consultationFee',
      header: 'Valor da consulta',
      cell: ({ row }) => `R$ ${formatDoctorPrice(row.original.consultationFee)}`,
    },
    {
      id: 'availability',
      header: 'Disponibilidade',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-sm text-slate-900">{row.original.schedule}</p>
          <p className="text-xs text-slate-500">{row.original.hours}</p>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
            row.original.isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700',
          )}
        >
          {row.original.isActive ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const doctor = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            {doctor.isActive ? (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Desativar ${doctor.name}`}
                onClick={() => onDeactivate(doctor)}
              >
                <PowerOff className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                aria-label={`Reativar ${doctor.name}`}
                onClick={() => onReactivate(doctor)}
              >
                <Zap className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
              aria-label={`Editar ${doctor.name}`}
              onClick={() => onEdit(doctor)}
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
