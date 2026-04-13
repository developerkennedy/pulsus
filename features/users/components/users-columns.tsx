'use client';

import { PowerOff, SquarePen, Zap } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/formatters';
import type { UserListItem } from '@/features/users/lib/user-view-model';

export function getUsersColumns({
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  onEdit: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
  onReactivate: (user: UserListItem) => void;
}): ColumnDef<UserListItem>[] {
  return [
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
      accessorKey: 'roleLabel',
      header: 'Cargo',
    },
    {
      accessorKey: 'doctorName',
      header: 'Médico vinculado',
      cell: ({ row }) =>
        row.original.role === 'doctor'
          ? row.original.doctorName ?? 'Sem vínculo'
          : 'Não se aplica',
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => formatPhone(row.original.phone) || 'Não informado',
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
        const user = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            {user.isActive ? (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Desativar ${user.name}`}
                onClick={() => onDeactivate(user)}
              >
                <PowerOff className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                aria-label={`Reativar ${user.name}`}
                onClick={() => onReactivate(user)}
              >
                <Zap className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
              aria-label={`Editar ${user.name}`}
              onClick={() => onEdit(user)}
            >
              <SquarePen className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];
}
