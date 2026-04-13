'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
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
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { Textarea } from '@/components/ui/textarea';
import { deactivateDoctorAction } from '@/features/doctors/actions/deactivate-doctor';
import { reactivateDoctorAction } from '@/features/doctors/actions/reactivate-doctor';
import { cn } from '@/lib/utils';
import { upsertDoctorAction } from '@/features/doctors/actions/upsert-doctor';
import { getDoctorFormFieldError } from '@/features/doctors/lib/doctor-form-errors';
import type { DoctorSpecialityOption } from '@/features/doctors/lib/doctor-view-model';
import {
  doctorWeekdayOptions,
  getDoctorFormDefaultValues,
  toUpsertDoctorPayload,
  upsertDoctorFormSchema,
  type UpsertDoctorData,
  type UpsertDoctorFormInput,
  type UpsertDoctorFormState,
  type UpsertDoctorFormValues,
} from '@/features/doctors/schemas/upsert-doctor-schema';

type UpsertDoctorFormProps = {
  initialData?: Partial<UpsertDoctorData>;
  specialities: DoctorSpecialityOption[];
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
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-900"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}

export default function UpsertDoctorForm({
  initialData,
  specialities,
  onSuccess,
  canEdit = true,
}: UpsertDoctorFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeactivating, startDeactivationTransition] = useTransition();
  const [isReactivating, startReactivationTransition] = useTransition();
  const [formState, setFormState] = useState<UpsertDoctorFormState | null>(null);

  const form = useForm<
    UpsertDoctorFormInput,
    undefined,
    UpsertDoctorFormValues
  >({
    resolver: zodResolver(upsertDoctorFormSchema),
    defaultValues: getDoctorFormDefaultValues(initialData),
  });

  const availabilityRows = useWatch({
    control: form.control,
    name: 'availabilities',
  });

  useEffect(() => {
    form.reset(getDoctorFormDefaultValues(initialData));
  }, [form, initialData]);

  function onSubmit(values: UpsertDoctorFormValues) {
    setFormState(null);

    startTransition(async () => {
      const payload = toUpsertDoctorPayload(values);
      const result = await upsertDoctorAction(payload);

      if (result.success) {
        setFormState(null);
        toast.success(result.message, { duration: 5000 });

        if (!initialData?.id) {
          form.reset(getDoctorFormDefaultValues());
        }

        onSuccess?.();
        return;
      }

      setFormState(result);
      toast.error(result.message, { duration: 5000 });
    });
  }

  function handleDeactivateDoctor() {
    if (!initialData?.id) {
      return;
    }

    setFormState(null);

    startDeactivationTransition(async () => {
      const result = await deactivateDoctorAction(initialData.id as string);

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

  function handleReactivateDoctor() {
    if (!initialData?.id) {
      return;
    }

    setFormState(null);

    startReactivationTransition(async () => {
      const result = await reactivateDoctorAction(initialData.id as string);

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

  const title = initialData?.id ? 'Editar médico' : 'Novo médico';
  const isActiveDoctor = initialData?.isActive ?? true;
  const description = initialData?.id
    ? 'Atualize os dados do médico e os dias disponíveis de atendimento.'
    : 'Preencha os dados do profissional e configure os dias e horários disponíveis.';

  return (
    <SheetContent className="w-full sm:max-w-3xl">
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

          <FormField
            label="Nome"
            htmlFor="name"
            error={getDoctorFormFieldError(
              formState,
              form.formState.errors.name?.message,
              'name',
            )}
          >
            <Input
              id="name"
              type="text"
              placeholder="Dr. Lucas Moreira"
              {...form.register('name')}
            />
          </FormField>

          <FormField
            label="E-mail"
            htmlFor="email"
            error={getDoctorFormFieldError(
              formState,
              form.formState.errors.email?.message,
              'email',
            )}
          >
            <Input
              id="email"
              type="email"
              placeholder="medico@clinica.com"
              {...form.register('email')}
            />
          </FormField>

          <FormField
            label="Especialidade"
            htmlFor="specialityId"
            error={getDoctorFormFieldError(
              formState,
              form.formState.errors.specialityId?.message,
              'specialityId',
            )}
          >
            <Select
              id="specialityId"
              {...form.register('specialityId')}
            >
              <option value="0" disabled>
                Selecione uma especialidade
              </option>
              {specialities.map((speciality) => (
                <option key={speciality.id} value={speciality.id}>
                  {speciality.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Registro profissional"
            htmlFor="license"
            error={getDoctorFormFieldError(
              formState,
              form.formState.errors.license?.message,
              'license',
            )}
          >
            <Input
              id="license"
              type="text"
              placeholder="CRM 123456"
              {...form.register('license')}
            />
          </FormField>

          <FormField
            label="Telefone"
            htmlFor="phone"
            error={getDoctorFormFieldError(
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
            label="Valor da consulta"
            htmlFor="consultationFee"
            error={getDoctorFormFieldError(
              formState,
              form.formState.errors.consultationFee?.message,
              'consultationFee',
            )}
            hint="Informe o valor em real. Ex.: `R$ 250,00`."
          >
            <Controller
              control={form.control}
              name="consultationFee"
              render={({ field }) => {
                const feeValue =
                  typeof field.value === 'number' ? field.value : null;

                return (
                  <CurrencyInput
                    id="consultationFee"
                    name={field.name}
                    placeholder="R$ 0,00"
                    value={feeValue == null ? '' : feeValue / 100}
                    onBlur={field.onBlur}
                    getInputRef={field.ref}
                    onValueChange={({ floatValue }) => {
                      field.onChange(
                        floatValue == null
                          ? null
                          : Math.round(floatValue * 100),
                      );
                    }}
                  />
                );
              }}
            />
          </FormField>

          <FormField
            label="Biografia"
            htmlFor="bio"
            error={getDoctorFormFieldError(
              formState,
              form.formState.errors.bio?.message,
              'bio',
            )}
          >
            <Textarea
              id="bio"
              rows={4}
              placeholder="Resumo profissional, experiência, foco de atendimento..."
              {...form.register('bio')}
            />
          </FormField>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-slate-900">
                Disponibilidade semanal
              </h3>
              <p className="text-xs text-slate-500">
                Ative os dias de atendimento e defina o horário de início e fim
                de cada um.
              </p>
            </div>

            {getDoctorFormFieldError(
              formState,
              form.formState.errors.availabilities?.message,
              'availabilities',
            ) ? (
              <p className="text-xs text-rose-500">
                {getDoctorFormFieldError(
                  formState,
                  form.formState.errors.availabilities?.message,
                  'availabilities',
                )}
              </p>
            ) : null}

            <div className="grid gap-3">
              {doctorWeekdayOptions.map((weekday, index) => {
                const availability = availabilityRows?.[index];
                const dayError =
                  form.formState.errors.availabilities?.[index];

                return (
                  <div
                    key={weekday.value}
                    className={cn(
                      'rounded-xl border border-slate-200 bg-white p-4 transition',
                      availability?.enabled
                        ? 'border-primary/30 shadow-sm'
                        : 'opacity-90',
                    )}
                  >
                    <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
                      <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          {...form.register(`availabilities.${index}.enabled`)}
                        />
                        <span>{weekday.label}</span>
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          label="Início"
                          htmlFor={`availabilities.${index}.startTime`}
                          error={dayError?.startTime?.message}
                        >
                          <Input
                            id={`availabilities.${index}.startTime`}
                            type="text"
                            placeholder="08:00"
                            disabled={!availability?.enabled}
                            {...form.register(
                              `availabilities.${index}.startTime`,
                            )}
                          />
                        </FormField>

                        <FormField
                          label="Fim"
                          htmlFor={`availabilities.${index}.endTime`}
                          error={dayError?.endTime?.message}
                        >
                          <Input
                            id={`availabilities.${index}.endTime`}
                            type="text"
                            placeholder="17:00"
                            disabled={!availability?.enabled}
                            {...form.register(`availabilities.${index}.endTime`)}
                          />
                        </FormField>
                      </div>
                    </div>

                    <input
                      type="hidden"
                      {...form.register(`availabilities.${index}.dayOfWeek`)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label
              htmlFor="isActive"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="isActive"
                type="checkbox"
                className={cn(
                  'mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary',
                )}
                {...form.register('isActive')}
              />
              <div className="space-y-1">
                <span className="block text-sm font-medium text-slate-900">
                  Médico ativo
                </span>
                <span className="block text-xs text-slate-500">
                  Define se o profissional pode aparecer nas listagens e
                  receber agendamentos.
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
                  variant={isActiveDoctor ? 'destructive' : 'default'}
                  className="w-full"
                  disabled={isPending || isDeactivating || isReactivating}
                >
                  {isActiveDoctor ? 'Desativar médico' : 'Reativar médico'}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isActiveDoctor ? 'Desativar médico?' : 'Reativar médico?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isActiveDoctor
                      ? 'O médico deixará de aparecer na listagem padrão e não poderá receber novos agendamentos, mas seu histórico ficará preservado.'
                      : 'O médico voltará a aparecer na listagem padrão e poderá receber novos agendamentos novamente.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isDeactivating || isReactivating}
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant={isActiveDoctor ? 'destructive' : 'default'}
                    onClick={
                      isActiveDoctor
                        ? handleDeactivateDoctor
                        : handleReactivateDoctor
                    }
                    disabled={isDeactivating || isReactivating}
                  >
                    {isActiveDoctor
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
                  ? 'Atualizar médico'
                  : 'Salvar médico'}
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
