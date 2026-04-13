'use client';

import { useEffect, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
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
import { deactivatePatientAction } from '@/features/patients/actions/deactivate-patient';
import { upsertPatientAction } from '@/features/patients/actions/upsert-patient';
import { getPatientFormFieldError } from '@/features/patients/lib/patient-form-errors';
import {
  getPatientFormDefaultValues,
  patientGenderOptions,
  toUpsertPatientPayload,
  upsertPatientFormSchema,
  type UpsertPatientFormInput,
  type UpsertPatientFormState,
  type UpsertPatientFormValues,
} from '@/features/patients/schemas/upsert-patient-schema';
import { reactivatePatientAction } from '@/features/patients/actions/reactivate-patient';

type UpsertPatientFormProps = {
  initialData?: Partial<UpsertPatientFormValues>;
  onSuccess?: () => void;
  canEdit?: boolean;
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

export function UpsertPatientForm({
  initialData,
  onSuccess,
  canEdit = true,
}: UpsertPatientFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeactivating, startDeactivationTransition] = useTransition();
  const [isReactivating, startReactivationTransition] = useTransition();
  const [formState, setFormState] = useState<UpsertPatientFormState | null>(
    null,
  );

  const form = useForm<
    UpsertPatientFormInput,
    undefined,
    UpsertPatientFormValues
  >({
    resolver: zodResolver(upsertPatientFormSchema),
    defaultValues: getPatientFormDefaultValues(initialData),
  });

  useEffect(() => {
    form.reset(getPatientFormDefaultValues(initialData));
  }, [form, initialData]);

  function onSubmit(values: UpsertPatientFormValues) {
    setFormState(null);

    startTransition(async () => {
      const payload = toUpsertPatientPayload(values);
      const result = await upsertPatientAction(payload);

      if (result.success) {
        setFormState(null);
        toast.success(result.message, { duration: 5000 });

        if (!initialData?.id) {
          form.reset(getPatientFormDefaultValues());
        }

        onSuccess?.();
        return;
      }

      setFormState(result);
      toast.error(result.message, { duration: 5000 });
    });
  }

  function handleDeactivatePatient() {
    if (!initialData?.id) {
      return;
    }

    setFormState(null);

    startDeactivationTransition(async () => {
      const result = await deactivatePatientAction(initialData.id as string);

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

  function handleReactivatePatient() {
    if (!initialData?.id) {
      return;
    }

    setFormState(null);

    startReactivationTransition(async () => {
      const result = await reactivatePatientAction(initialData.id as string);

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

  const title = initialData?.id ? 'Editar paciente' : 'Novo paciente';
  const isActivePatient = initialData?.isActive ?? true;
  const description = initialData?.id
    ? 'Atualize os dados do paciente e mantenha o cadastro em dia.'
    : 'Preencha os dados do paciente para disponibilizá-lo na agenda da clínica.';

  return (
    <SheetContent className="w-full sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col overflow-hidden"
      >
        <div className="grid flex-1 auto-rows-min gap-5 overflow-y-auto px-4 pb-4">
          <input type="hidden" {...form.register('id')} />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Nome"
              htmlFor="name"
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.name?.message,
                'name',
              )}
            >
              <Input
                id="name"
                type="text"
                placeholder="Ana Souza"
                {...form.register('name')}
              />
            </FormField>

            <FormField
              label="E-mail"
              htmlFor="email"
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.email?.message,
                'email',
              )}
            >
              <Input
                id="email"
                type="email"
                placeholder="paciente@exemplo.com"
                {...form.register('email')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="CPF"
              htmlFor="cpf"
              hint="Informe apenas os 11 dígitos do CPF."
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.cpf?.message,
                'cpf',
              )}
            >
              <Input
                id="cpf"
                type="text"
                inputMode="numeric"
                placeholder="12345678901"
                {...form.register('cpf')}
              />
            </FormField>

            <FormField
              label="Data de nascimento"
              htmlFor="dateOfBirth"
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.dateOfBirth?.message,
                'dateOfBirth',
              )}
            >
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register('dateOfBirth')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Número de celular"
              htmlFor="phone"
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.phone?.message,
                'phone',
              )}
            >
              <Controller
                name="phone"
                control={form.control}
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

            <FormField
              label="Sexo"
              htmlFor="gender"
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.gender?.message,
                'gender',
              )}
            >
              <Select id="gender" {...form.register('gender')}>
                <option value="" disabled>
                  Selecione o sexo
                </option>
                {patientGenderOptions.map((gender) => (
                  <option key={gender.value} value={gender.value}>
                    {gender.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Contato de emergência"
              htmlFor="emergencyContact"
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.emergencyContact?.message,
                'emergencyContact',
              )}
            >
              <Input
                id="emergencyContact"
                type="text"
                placeholder="Maria Souza"
                {...form.register('emergencyContact')}
              />
            </FormField>

            <FormField
              label="Telefone de emergência"
              htmlFor="emergencyPhone"
              error={getPatientFormFieldError(
                formState,
                form.formState.errors.emergencyPhone?.message,
                'emergencyPhone',
              )}
            >
              <Controller
                name="emergencyPhone"
                control={form.control}
                render={({ field }) => (
                  <PhoneInput
                    id="emergencyPhone"
                    value={field.value ?? ''}
                    onValueChange={({ value }) => field.onChange(value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label
              htmlFor="isActive"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="isActive"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                {...form.register('isActive')}
              />
              <div className="space-y-1">
                <span className="block text-sm font-medium text-slate-900">
                  Paciente ativo
                </span>
                <span className="block text-xs text-slate-500">
                  Define se o paciente pode aparecer nas listagens e ser usado
                  em novos agendamentos.
                </span>
              </div>
            </label>
          </div>
        </div>

        <SheetFooter className="border-t bg-white">
          {canEdit && initialData?.id ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant={isActivePatient ? 'destructive' : 'default'}
                  className="w-full"
                  disabled={isPending || isDeactivating || isReactivating}
                >
                  {isActivePatient ? 'Desativar paciente' : 'Reativar paciente'}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isActivePatient
                      ? 'Desativar paciente?'
                      : 'Reativar paciente?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isActivePatient
                      ? 'O paciente deixará de aparecer na listagem padrão e não poderá ser usado em novos agendamentos, mas o histórico ficará preservado.'
                      : 'O paciente voltará a aparecer na listagem padrão e poderá ser usado novamente em novos agendamentos.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isDeactivating || isReactivating}
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant={isActivePatient ? 'destructive' : 'default'}
                    onClick={
                      isActivePatient
                        ? handleDeactivatePatient
                        : handleReactivatePatient
                    }
                    disabled={isDeactivating || isReactivating}
                  >
                    {isActivePatient
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
          ) : null}

          {canEdit ? (
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={
                isPending ||
                isDeactivating ||
                isReactivating ||
                form.formState.isSubmitting
              }
            >
              {isPending
                ? 'Salvando...'
                : initialData?.id
                  ? 'Atualizar paciente'
                  : 'Salvar paciente'}
            </Button>
          ) : null}
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPending || isDeactivating || isReactivating}
            >
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
