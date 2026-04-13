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
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { deactivateUserAction } from '@/features/users/actions/deactivate-user';
import { reactivateUserAction } from '@/features/users/actions/reactivate-user';
import { getUsersColumns } from '@/features/users/components/users-columns';
import {
  userStatusFilterOptions,
  type UserStatusFilter,
} from '@/features/users/lib/user-filters';
import { mapUserToFormValues } from '@/features/users/lib/user-mappers';
import type { UserPaginationMeta } from '@/features/users/lib/user-pagination';
import type {
  UserDoctorOption,
  UserListItem,
} from '@/features/users/lib/user-view-model';
import { cn } from '@/lib/utils';
import { UpsertUserForm } from '@/features/users/components/upsert-user-form';

type UsersPageContentProps = {
  users: UserListItem[];
  doctorOptions: UserDoctorOption[];
  currentFilter: UserStatusFilter;
  pagination: UserPaginationMeta;
};

export function UsersPageContent({
  users,
  doctorOptions,
  currentFilter,
  pagination,
}: UsersPageContentProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserListItem | null>(null);
  const [, startTransition] = useTransition();

  const initialData = useMemo(() => {
    if (!selectedUser) return undefined;

    return {
      ...mapUserToFormValues(selectedUser),
      email: selectedUser.email,
    };
  }, [selectedUser]);

  const columns = getUsersColumns({
    onEdit: handleEditUser,
    onDeactivate: handleDeactivateUser,
    onReactivate: handleReactivateUser,
  });

  function handleDeactivateUser(user: UserListItem) {
    setUserToDeactivate(user);
  }

  function confirmDeactivateUser() {
    if (!userToDeactivate) return;

    startTransition(async () => {
      const result = await deactivateUserAction(userToDeactivate.id);

      setUserToDeactivate(null);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleReactivateUser(user: UserListItem) {
    startTransition(async () => {
      const result = await reactivateUserAction(user.id);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCreateUser() {
    setSelectedUser(null);
    setIsSheetOpen(true);
  }

  function handleEditUser(user: UserListItem) {
    setSelectedUser(user);
    setIsSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open);

    if (!open) {
      setSelectedUser(null);
    }
  }

  function handleFormSuccess() {
    setIsSheetOpen(false);
    setSelectedUser(null);
  }

  function buildUsersHref(page: number) {
    const params = new URLSearchParams();

    if (currentFilter !== 'active') {
      params.set('status', currentFilter);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    const queryString = params.toString();

    return queryString ? `/users?${queryString}` : '/users';
  }

  const hasUsers = users.length > 0;

  return (
    <>
      <AlertDialog
        open={!!userToDeactivate}
        onOpenChange={(open) => { if (!open) setUserToDeactivate(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar <strong>{userToDeactivate?.name}</strong>? O usuário não poderá acessar o sistema enquanto estiver inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivateUser}>
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
                Outros <span className="mx-1">›</span>{' '}
                <span className="font-medium text-primary">Usuários</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground">
                Usuários
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie os usuários da sua clínica
              </p>
            </div>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                className="gap-2 bg-primary text-primary-foreground shadow-sm"
                onClick={handleCreateUser}
              >
                <Plus className="h-4 w-4" />
                Adicionar Usuário
              </Button>
            </SheetTrigger>

            <UpsertUserForm
              key={selectedUser?.id ?? 'new-user'}
              initialData={initialData}
              doctorOptions={doctorOptions}
              onSuccess={handleFormSuccess}
            />
          </Sheet>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {userStatusFilterOptions.map((filterOption) => {
            const href =
              filterOption.value === 'active'
                ? '/users'
                : `/users?status=${filterOption.value}`;

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

        {hasUsers ? (
          <DataTable
            columns={columns}
            data={users}
            pagination={pagination}
            itemLabel="usuários"
            buildPageHref={buildUsersHref}
            rowClassName={(user) =>
              !user.isActive ? 'bg-rose-50/80 hover:bg-rose-50/80' : undefined
            }
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {currentFilter === 'inactive'
                ? 'Nenhum usuário inativo'
                : currentFilter === 'all'
                  ? 'Nenhum usuário encontrado'
                  : 'Nenhum usuário cadastrado'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {currentFilter === 'inactive'
                ? 'Quando houver usuários desativados, eles aparecerão aqui para consulta e possível reativação.'
                : currentFilter === 'all'
                  ? 'Assim que houver usuários cadastrados, eles aparecerão nesta tabela.'
                  : 'Adicione o primeiro usuário para que ele possa acessar o sistema da clínica.'}
            </p>
            <Button
              className="mt-6 gap-2 bg-primary text-primary-foreground"
              onClick={handleCreateUser}
            >
              <Plus className="h-4 w-4" />
              Adicionar usuário
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
