'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}: UpsertDoctorFormProps) {
  const [isPending, startTransition] = useTransition();
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

      setFormState(result);

      if (result.success) {
        if (!initialData?.id) {
          form.reset(getDoctorFormDefaultValues());
        }

        onSuccess?.();
      }
    });
  }

  const title = initialData?.id ? 'Editar médico' : 'Novo médico';
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

          {formState?.message ? (
            <div
              className={cn(
                'rounded-xl border px-4 py-3 text-sm',
                formState.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700',
              )}
            >
              {formState.message}
            </div>
          ) : null}

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
            <Input
              id="phone"
              type="text"
              placeholder="(11) 99999-9999"
              {...form.register('phone')}
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
            hint="Valor inteiro em centavos. Ex.: `25000`."
          >
            <Input
              id="consultationFee"
              type="number"
              min={0}
              placeholder="25000"
              {...form.register('consultationFee', {
                setValueAs: (value) => {
                  if (value === '' || value == null) {
                    return null;
                  }

                  return Number(value);
                },
              })}
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
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isPending || form.formState.isSubmitting}
          >
            {isPending
              ? 'Salvando...'
              : initialData?.id
                ? 'Atualizar médico'
                : 'Salvar médico'}
          </Button>
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
