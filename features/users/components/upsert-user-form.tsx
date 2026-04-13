'use client';

import { useEffect, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select } from '@/components/ui/select';
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { createUserAction } from '@/features/users/actions/create-user';
import { updateUserAction } from '@/features/users/actions/update-user';
import { deactivateUserAction } from '@/features/users/actions/deactivate-user';
import { reactivateUserAction } from '@/features/users/actions/reactivate-user';
import { getUserFormFieldError } from '@/features/users/lib/user-form-errors';
import {
  createUserFormSchema,
  updateUserFormSchema,
  getCreateUserFormDefaultValues,
  getUpdateUserFormDefaultValues,
  userRoleOptions,
  type CreateUserFormValues,
  type UpdateUserFormValues,
  type UpsertUserFormState,
} from '@/features/users/schemas/upsert-user-schema';
import type { UserDoctorOption } from '@/features/users/lib/user-view-model';

type UpsertUserFormProps = {
  initialData?: Partial<UpdateUserFormValues> & { email?: string };
  doctorOptions: UserDoctorOption[];
  onSuccess?: () => void;
};

function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}

export function UpsertUserForm({
  initialData,
  doctorOptions,
  onSuccess,
}: UpsertUserFormProps) {
  const isEditMode = !!initialData?.id;
  const [isPending, startTransition] = useTransition();
  const [isDeactivating, startDeactivationTransition] = useTransition();
  const [isReactivating, startReactivationTransition] = useTransition();
  const [formState, setFormState] = useState<UpsertUserFormState | null>(null);

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: getCreateUserFormDefaultValues(),
  });

  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserFormSchema),
    defaultValues: getUpdateUserFormDefaultValues(initialData),
  });

  useEffect(() => {
    if (isEditMode) {
      updateForm.reset(getUpdateUserFormDefaultValues(initialData));
    } else {
      createForm.reset(getCreateUserFormDefaultValues());
    }
  }, [createForm, updateForm, initialData, isEditMode]);

  const createSelectedRole = useWatch({
    control: createForm.control,
    name: 'role',
  });
  const updateSelectedRole = useWatch({
    control: updateForm.control,
    name: 'role',
  });

  function renderDoctorOptions(currentUserId?: string) {
    return doctorOptions.map((doctor) => {
      const isTakenByAnotherUser =
        doctor.linkedUserId !== null && doctor.linkedUserId !== currentUserId;
      const statusLabel = doctor.isActive ? '' : ' • inativo';

      return (
        <option
          key={doctor.id}
          value={doctor.id}
          disabled={isTakenByAnotherUser}
        >
          {doctor.name} - {doctor.specialityName}
          {statusLabel}
          {isTakenByAnotherUser ? ' • já vinculado' : ''}
        </option>
      );
    });
  }

  function onCreateSubmit(values: CreateUserFormValues) {
    setFormState(null);

    startTransition(async () => {
      const result = await createUserAction({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role as 'admin' | 'receptionist' | 'doctor',
        doctorId: values.role === 'doctor' ? values.doctorId : undefined,
        phone: values.phone ?? '',
      });

      if (result.success) {
        setFormState(null);
        toast.success(result.message, { duration: 5000 });
        createForm.reset(getCreateUserFormDefaultValues());
        onSuccess?.();
        return;
      }

      setFormState(result);
      toast.error(result.message, { duration: 5000 });
    });
  }

  function onUpdateSubmit(values: UpdateUserFormValues) {
    setFormState(null);

    startTransition(async () => {
      const result = await updateUserAction({
        id: values.id,
        name: values.name,
        role: values.role as 'admin' | 'receptionist' | 'doctor',
        doctorId: values.role === 'doctor' ? values.doctorId : undefined,
        phone: values.phone ?? '',
        isActive: values.isActive,
      });

      if (result.success) {
        setFormState(null);
        toast.success(result.message, { duration: 5000 });
        onSuccess?.();
        return;
      }

      setFormState(result);
      toast.error(result.message, { duration: 5000 });
    });
  }

  function handleDeactivateUser() {
    if (!initialData?.id) return;

    setFormState(null);

    startDeactivationTransition(async () => {
      const result = await deactivateUserAction(initialData.id as string);

      if (result.success) {
        setFormState(null);
        toast.success(result.message, { duration: 5000 });
        onSuccess?.();
        return;
      }

      toast.error(result.message, { duration: 5000 });
    });
  }

  function handleReactivateUser() {
    if (!initialData?.id) return;

    setFormState(null);

    startReactivationTransition(async () => {
      const result = await reactivateUserAction(initialData.id as string);

      if (result.success) {
        setFormState(null);
        toast.success(result.message, { duration: 5000 });
        onSuccess?.();
        return;
      }

      toast.error(result.message, { duration: 5000 });
    });
  }

  const title = isEditMode ? 'Editar usuário' : 'Novo usuário';
  const isActiveUser = initialData?.isActive ?? true;
  const description = isEditMode
    ? 'Atualize os dados do usuário da clínica.'
    : 'Preencha os dados para adicionar um novo usuário à clínica.';

  const anyPending = isPending || isDeactivating || isReactivating;

  if (isEditMode) {
    return (
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
          className="flex h-full flex-col overflow-hidden"
        >
          <div className="grid flex-1 auto-rows-min gap-5 overflow-y-auto px-4 pb-4">
            <input type="hidden" {...updateForm.register('id')} />

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Nome"
                htmlFor="name"
                error={getUserFormFieldError(
                  formState,
                  updateForm.formState.errors.name?.message,
                  'name',
                )}
              >
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  {...updateForm.register('name')}
                />
              </FormField>

              <FormField
                label="E-mail"
                htmlFor="email"
              >
                <Input
                  id="email"
                  type="email"
                  value={initialData?.email ?? ''}
                  disabled
                  className="bg-slate-100"
                />
              </FormField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Cargo"
                htmlFor="role"
                error={getUserFormFieldError(
                  formState,
                  updateForm.formState.errors.role?.message,
                  'role',
                )}
              >
                <Select id="role" {...updateForm.register('role')}>
                  <option value="" disabled>
                    Selecione o cargo
                  </option>
                  {userRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Telefone"
                htmlFor="phone"
                error={getUserFormFieldError(
                  formState,
                  updateForm.formState.errors.phone?.message,
                  'phone',
                )}
              >
                <Controller
                  name="phone"
                  control={updateForm.control}
                  render={({ field }) => (
                    <PhoneInput
                      id="phone"
                      value={field.value ?? ''}
                      onValueChange={({ value }) => field.onChange(value)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </FormField>
            </div>

            {updateSelectedRole === 'doctor' ? (
              <FormField
                label="Médico vinculado"
                htmlFor="doctorId"
                hint="Esse vínculo define quais dados o usuário médico poderá visualizar."
                error={getUserFormFieldError(
                  formState,
                  updateForm.formState.errors.doctorId?.message,
                  'doctorId',
                )}
              >
                <Select id="doctorId" {...updateForm.register('doctorId')}>
                  <option value="">Selecione o médico</option>
                  {renderDoctorOptions(initialData?.id)}
                </Select>
              </FormField>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label
                htmlFor="isActive"
                className="flex cursor-pointer items-start gap-3"
              >
                <input
                  id="isActive"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  {...updateForm.register('isActive')}
                />
                <div className="space-y-1">
                  <span className="block text-sm font-medium text-slate-900">
                    Usuário ativo
                  </span>
                  <span className="block text-xs text-slate-500">
                    Define se o usuário pode acessar o sistema e realizar ações.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <SheetFooter className="border-t bg-white">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant={isActiveUser ? 'destructive' : 'default'}
                  className="w-full"
                  disabled={anyPending}
                >
                  {isActiveUser ? 'Desativar usuário' : 'Reativar usuário'}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isActiveUser
                      ? 'Desativar usuário?'
                      : 'Reativar usuário?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isActiveUser
                      ? 'O usuário não poderá mais acessar o sistema enquanto estiver inativo.'
                      : 'O usuário voltará a ter acesso ao sistema.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeactivating || isReactivating}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant={isActiveUser ? 'destructive' : 'default'}
                    onClick={
                      isActiveUser
                        ? handleDeactivateUser
                        : handleReactivateUser
                    }
                    disabled={isDeactivating || isReactivating}
                  >
                    {isActiveUser
                      ? isDeactivating
                        ? 'Desativando...'
                        : 'Confirmar desativação'
                      : isReactivating
                        ? 'Reativando...'
                        : 'Confirmar reativação'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={anyPending || updateForm.formState.isSubmitting}
            >
              {isPending ? 'Salvando...' : 'Atualizar usuário'}
            </Button>
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={anyPending}
              >
                Cancelar
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    );
  }

  return (
    <SheetContent className="w-full sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>

      <form
        onSubmit={createForm.handleSubmit(onCreateSubmit)}
        className="flex h-full flex-col overflow-hidden"
      >
        <div className="grid flex-1 auto-rows-min gap-5 overflow-y-auto px-4 pb-4">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Nome"
              htmlFor="name"
              error={getUserFormFieldError(
                formState,
                createForm.formState.errors.name?.message,
                'name',
              )}
            >
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                {...createForm.register('name')}
              />
            </FormField>

            <FormField
              label="E-mail"
              htmlFor="email"
              error={getUserFormFieldError(
                formState,
                createForm.formState.errors.email?.message,
                'email',
              )}
            >
              <Input
                id="email"
                type="email"
                placeholder="usuario@clinica.com"
                {...createForm.register('email')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Senha"
              htmlFor="password"
              hint="Mínimo de 8 caracteres."
              error={getUserFormFieldError(
                formState,
                createForm.formState.errors.password?.message,
                'password',
              )}
            >
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...createForm.register('password')}
              />
            </FormField>

            <FormField
              label="Cargo"
              htmlFor="role"
              error={getUserFormFieldError(
                formState,
                createForm.formState.errors.role?.message,
                'role',
              )}
            >
              <Select id="role" {...createForm.register('role')}>
                <option value="" disabled>
                  Selecione o cargo
                </option>
                {userRoleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
                </Select>
              </FormField>
            </div>

          {createSelectedRole === 'doctor' ? (
            <FormField
              label="Médico vinculado"
              htmlFor="doctorId"
              hint="Vincule o usuário ao cadastro do médico para liberar acesso escopado."
              error={getUserFormFieldError(
                formState,
                createForm.formState.errors.doctorId?.message,
                'doctorId',
              )}
            >
              <Select id="doctorId" {...createForm.register('doctorId')}>
                <option value="">Selecione o médico</option>
                {renderDoctorOptions()}
              </Select>
            </FormField>
          ) : null}

          <FormField
            label="Telefone"
            htmlFor="phone"
            error={getUserFormFieldError(
              formState,
              createForm.formState.errors.phone?.message,
              'phone',
            )}
          >
            <Controller
              name="phone"
              control={createForm.control}
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  value={field.value ?? ''}
                  onValueChange={({ value }) => field.onChange(value)}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>
        </div>

        <SheetFooter className="border-t bg-white">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isPending || createForm.formState.isSubmitting}
          >
            {isPending ? 'Salvando...' : 'Salvar usuário'}
          </Button>
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
