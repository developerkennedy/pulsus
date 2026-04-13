'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { upsertAppointmentAction } from '@/features/appointments/actions/upsert-appointment';
import { getAppointmentFormFieldError } from '@/features/appointments/lib/appointment-form-errors';
import { mapDoctorOptionLabel } from '@/features/appointments/lib/appointment-mappers';
import type {
  AppointmentDoctorOption,
  AppointmentFormInitialData,
  AppointmentPatientOption,
} from '@/features/appointments/lib/appointment-view-model';
import {
  addMonths,
  combineDateAndTime,
  formatMonthKey,
  getDefaultScheduleMonth,
  parseMonthKey,
  type DoctorScheduleSnapshot,
  type DoctorScheduleSlot,
} from '@/features/appointments/lib/appointment-scheduling';
import {
  appointmentStatusOptions,
  getAppointmentFormDefaultValues,
  toUpsertAppointmentPayload,
  upsertAppointmentFormSchema,
  type UpsertAppointmentFormInput,
  type UpsertAppointmentFormState,
  type UpsertAppointmentFormValues,
} from '@/features/appointments/schemas/upsert-appointment-schema';
import { cn } from '@/lib/utils';

type UpsertAppointmentFormProps = {
  initialData?: AppointmentFormInitialData;
  doctors: AppointmentDoctorOption[];
  patients: AppointmentPatientOption[];
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

function parseAppointmentDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const [dateKey, timeValue = ''] = value.split('T');
  const time = timeValue.slice(0, 5);

  if (!dateKey || !time) {
    return null;
  }

  return {
    dateKey,
    time,
    month: dateKey.slice(0, 7),
  };
}

function normalizeDoctorId(value: unknown) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return value;
}

export function UpsertAppointmentForm({
  initialData,
  doctors,
  patients,
  onSuccess,
}: UpsertAppointmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<UpsertAppointmentFormState | null>(
    null,
  );
  const [displayedMonth, setDisplayedMonth] = useState(
    parseAppointmentDateValue(initialData?.appointmentDate)?.month ??
      getDefaultScheduleMonth(),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(
    parseAppointmentDateValue(initialData?.appointmentDate)?.dateKey ?? '',
  );
  const [selectedTime, setSelectedTime] = useState(
    parseAppointmentDateValue(initialData?.appointmentDate)?.time ?? '',
  );
  const [scheduleSnapshot, setScheduleSnapshot] =
    useState<DoctorScheduleSnapshot | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const previousDoctorIdRef = useRef<string | null>(null);

  const form = useForm<
    UpsertAppointmentFormInput,
    undefined,
    UpsertAppointmentFormValues
  >({
    resolver: zodResolver(upsertAppointmentFormSchema),
    defaultValues: getAppointmentFormDefaultValues(initialData),
  });

  useEffect(() => {
    form.reset(getAppointmentFormDefaultValues(initialData));
    const parsedAppointmentDate = parseAppointmentDateValue(
      initialData?.appointmentDate,
    );

    setDisplayedMonth(
      parsedAppointmentDate?.month ?? getDefaultScheduleMonth(),
    );
    setSelectedDateKey(parsedAppointmentDate?.dateKey ?? '');
    setSelectedTime(parsedAppointmentDate?.time ?? '');
    setScheduleSnapshot(null);
    setScheduleError(null);
  }, [form, initialData]);

  const selectedDoctorId = normalizeDoctorId(form.watch('doctorId'));

  useEffect(() => {
    if (
      previousDoctorIdRef.current &&
      previousDoctorIdRef.current !== selectedDoctorId
    ) {
      setSelectedDateKey('');
      setSelectedTime('');
      form.setValue('appointmentDate', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDisplayedMonth(getDefaultScheduleMonth());
    }

    previousDoctorIdRef.current = selectedDoctorId;
  }, [form, selectedDoctorId]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setScheduleSnapshot(null);
      setScheduleError(null);
      return;
    }

    const abortController = new AbortController();

    async function loadDoctorSchedule() {
      setIsScheduleLoading(true);
      setScheduleError(null);

      try {
        const query = new URLSearchParams({
          month: displayedMonth,
        });

        if (initialData?.id) {
          query.set('appointmentId', String(initialData.id));
        }

        const response = await fetch(
          `/api/doctors/${selectedDoctorId}/schedule?${query.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: abortController.signal,
          },
        );

        const data = (await response.json().catch(() => null)) as
          | DoctorScheduleSnapshot
          | { message?: string }
          | null;

        if (!response.ok || !data || !('days' in data)) {
          throw new Error(
            data && 'message' in data && data.message
              ? data.message
              : 'Não foi possível carregar a agenda do médico.',
          );
        }

        setScheduleSnapshot(data);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setScheduleSnapshot(null);
        setScheduleError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a agenda do médico.',
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsScheduleLoading(false);
        }
      }
    }

    void loadDoctorSchedule();

    return () => abortController.abort();
  }, [displayedMonth, initialData?.id, selectedDoctorId]);

  const selectedDateSlots = useMemo<DoctorScheduleSlot[]>(() => {
    if (!scheduleSnapshot || !selectedDateKey) {
      return [];
    }

    return scheduleSnapshot.slotsByDate[selectedDateKey] ?? [];
  }, [scheduleSnapshot, selectedDateKey]);

  const updateAppointmentDate = useCallback(
    (dateKey: string, time: string) => {
      if (!dateKey || !time) {
        form.setValue('appointmentDate', '', {
          shouldDirty: true,
          shouldValidate: true,
        });

        return;
      }

      form.setValue('appointmentDate', combineDateAndTime(dateKey, time), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  useEffect(() => {
    if (!selectedDateKey || !selectedTime) {
      return;
    }

    const selectedSlotValue = combineDateAndTime(selectedDateKey, selectedTime);
    const matchingSlot = selectedDateSlots.find(
      (slot) => slot.value === selectedSlotValue,
    );

    if (!matchingSlot || matchingSlot.isBooked) {
      setSelectedTime('');
      form.setValue('appointmentDate', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, selectedDateKey, selectedDateSlots, selectedTime]);

  useEffect(() => {
    if (!selectedDateKey || selectedDateKey.startsWith(displayedMonth)) {
      return;
    }

    setSelectedDateKey('');
    setSelectedTime('');
    updateAppointmentDate('', '');
  }, [displayedMonth, selectedDateKey, updateAppointmentDate]);

  function handleSelectDate(dateKey: string) {
    setSelectedDateKey(dateKey);
    setSelectedTime('');
    updateAppointmentDate('', '');
  }

  function handleSelectTime(slotValue: string) {
    const parsedAppointmentDate = parseAppointmentDateValue(slotValue);

    if (!parsedAppointmentDate) {
      return;
    }

    setSelectedDateKey(parsedAppointmentDate.dateKey);
    setSelectedTime(parsedAppointmentDate.time);
    updateAppointmentDate(
      parsedAppointmentDate.dateKey,
      parsedAppointmentDate.time,
    );
  }

  function goToPreviousMonth() {
    const currentMonth = parseMonthKey(displayedMonth);

    if (!currentMonth) {
      setDisplayedMonth(getDefaultScheduleMonth());
      return;
    }

    setDisplayedMonth(formatMonthKey(addMonths(currentMonth, -1)));
  }

  function goToNextMonth() {
    const currentMonth = parseMonthKey(displayedMonth);

    if (!currentMonth) {
      setDisplayedMonth(getDefaultScheduleMonth());
      return;
    }

    setDisplayedMonth(formatMonthKey(addMonths(currentMonth, 1)));
  }

  function onSubmit(values: UpsertAppointmentFormValues) {
    setFormState(null);

    startTransition(async () => {
      const payload = toUpsertAppointmentPayload(values);
      const result = await upsertAppointmentAction(payload);

      if (result.success) {
        setFormState(null);
        toast.success(result.message, { duration: 5000 });

        if (!initialData?.id) {
          form.reset(getAppointmentFormDefaultValues());
        }

        onSuccess?.();
        return;
      }

      setFormState(result);
      toast.error(result.message, { duration: 5000 });
    });
  }

  const title = initialData?.id ? 'Editar agendamento' : 'Novo agendamento';
  const description = initialData?.id
    ? 'Atualize médico, paciente, horário e status do agendamento.'
    : 'Preencha os dados para adicionar um novo agendamento à agenda da clínica.';
  const isDisabled = doctors.length === 0 || patients.length === 0;
  const appointmentDateError = getAppointmentFormFieldError(
    formState,
    form.formState.errors.appointmentDate?.message,
    'appointmentDate',
  );

  return (
    <DialogContent className="flex max-h-[92vh] w-[min(1100px,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="border-b bg-white pr-14">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col overflow-hidden"
      >
        <div className="grid flex-1 auto-rows-min gap-5 overflow-y-auto bg-white px-6 py-5">
          <input type="hidden" {...form.register('id')} />

          {isDisabled ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Cadastre ao menos um médico ativo e um paciente ativo para criar
              agendamentos.
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Paciente"
              htmlFor="patientId"
              error={getAppointmentFormFieldError(
                formState,
                form.formState.errors.patientId?.message,
                'patientId',
              )}
            >
              <Select
                id="patientId"
                disabled={patients.length === 0}
                {...form.register('patientId')}
              >
                <option value="">Selecione o paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Médico"
              htmlFor="doctorId"
              error={getAppointmentFormFieldError(
                formState,
                form.formState.errors.doctorId?.message,
                'doctorId',
              )}
            >
              <Select
                id="doctorId"
                disabled={doctors.length === 0}
                {...form.register('doctorId')}
              >
                <option value="">Selecione o médico</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {mapDoctorOptionLabel(doctor)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <input type="hidden" {...form.register('appointmentDate')} />

          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    Data da consulta
                  </p>
                  <p className="text-xs text-slate-500">
                    Escolha primeiro o médico. O calendário mostra apenas dias
                    com atendimento configurado.
                  </p>
                </div>

                <div className="rounded-full bg-white p-2 text-primary shadow-sm">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={goToPreviousMonth}
                  disabled={!selectedDoctorId || isScheduleLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <p className="text-sm font-semibold capitalize text-slate-900">
                  {scheduleSnapshot?.monthLabel ?? 'Selecione um médico'}
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={goToNextMonth}
                  disabled={!selectedDoctorId || isScheduleLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
                  (day) => (
                    <span key={day}>{day}</span>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {scheduleSnapshot?.days.map((day) => {
                  const isSelected = day.date === selectedDateKey;

                  return (
                    <Button
                      key={day.date}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-12 rounded-xl border px-0 text-sm font-medium',
                        !day.isCurrentMonth &&
                          'border-transparent bg-transparent text-slate-300 shadow-none',
                        day.isCurrentMonth &&
                          day.isSelectable &&
                          'border-slate-200 bg-white text-slate-900 hover:border-primary hover:text-primary',
                        day.isCurrentMonth &&
                          day.isFullyBooked &&
                          'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50',
                        day.isCurrentMonth &&
                          day.isPast &&
                          'border-slate-200 bg-slate-100 text-slate-400',
                        isSelected &&
                          'border-primary bg-primary text-white hover:bg-primary hover:text-white',
                      )}
                      disabled={!day.isSelectable}
                      onClick={() => handleSelectDate(day.date)}
                    >
                      {day.dayNumber}
                    </Button>
                  );
                }) ?? (
                  <div className="col-span-7 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    Selecione um médico para carregar os dias disponíveis.
                  </div>
                )}
              </div>

              {isScheduleLoading ? (
                <p className="text-sm text-slate-500">
                  Carregando agenda do médico...
                </p>
              ) : null}

              {!isScheduleLoading && scheduleError ? (
                <p className="text-sm text-rose-600">{scheduleError}</p>
              ) : null}

              {!isScheduleLoading &&
              !scheduleError &&
              selectedDoctorId &&
              scheduleSnapshot &&
              !scheduleSnapshot.hasAvailability ? (
                <p className="text-sm text-amber-700">
                  Este médico ainda não possui horários configurados.
                </p>
              ) : null}

              {!isScheduleLoading &&
              !scheduleError &&
              selectedDoctorId &&
              scheduleSnapshot?.hasAvailability &&
              !scheduleSnapshot.days.some((day) => day.isSelectable) ? (
                <p className="text-sm text-slate-500">
                  Não há vagas disponíveis neste mês. Tente navegar para o
                  próximo mês.
                </p>
              ) : null}

              {appointmentDateError ? (
                <p className="text-xs text-rose-500">{appointmentDateError}</p>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    Horários disponíveis
                  </p>
                  <p className="text-xs text-slate-500">
                    Horários ocupados ficam bloqueados automaticamente.
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 p-2 text-slate-700">
                  <Clock3 className="h-4 w-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectedDateSlots.length > 0 ? (
                  selectedDateSlots.map((slot) => {
                    const isSelected =
                      slot.value === form.watch('appointmentDate');

                    return (
                      <Button
                        key={slot.value}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'justify-center rounded-xl',
                          slot.isBooked &&
                            'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50',
                        )}
                        disabled={slot.isBooked}
                        onClick={() => handleSelectTime(slot.value)}
                      >
                        {slot.label}
                      </Button>
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    {selectedDoctorId
                      ? selectedDateKey
                        ? 'Nenhum horário livre para este dia.'
                        : 'Selecione um dia disponível para ver os horários.'
                      : 'Selecione um médico para carregar os horários.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <FormField
            label="Status"
            htmlFor="status"
            error={getAppointmentFormFieldError(
              formState,
              form.formState.errors.status?.message,
              'status',
            )}
          >
            <Select id="status" {...form.register('status')}>
              {appointmentStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Motivo da consulta"
            htmlFor="reasonForVisit"
            error={getAppointmentFormFieldError(
              formState,
              form.formState.errors.reasonForVisit?.message,
              'reasonForVisit',
            )}
          >
            <Input
              id="reasonForVisit"
              type="text"
              placeholder="Retorno, avaliacao, exame..."
              {...form.register('reasonForVisit')}
            />
          </FormField>

          <FormField
            label="Observacoes"
            htmlFor="notes"
            hint="Use este campo para registrar orientações rápidas ou contexto do atendimento."
            error={getAppointmentFormFieldError(
              formState,
              form.formState.errors.notes?.message,
              'notes',
            )}
          >
            <Textarea
              id="notes"
              placeholder="Ex.: paciente solicitou encaixe no periodo da manha."
              rows={5}
              {...form.register('notes')}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isPending || form.formState.isSubmitting || isDisabled}
          >
            {isPending
              ? 'Salvando...'
              : initialData?.id
                ? 'Atualizar agendamento'
                : 'Salvar agendamento'}
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
