import { z } from 'zod';

export const appointmentStatusOptions = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no-show', label: 'Não compareceu' },
] as const;

export type UpsertAppointmentStatus =
  (typeof appointmentStatusOptions)[number]['value'];

const appointmentStatusValues = appointmentStatusOptions.map(
  (option) => option.value,
) as [UpsertAppointmentStatus, ...UpsertAppointmentStatus[]];

const optionalUuidFromForm = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

function normalizeOptionalText(value: string | undefined) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

const appointmentDateTimeSchema = z
  .string()
  .min(1, 'Informe a data e horário do agendamento.')
  .refine(
    (value) => !Number.isNaN(new Date(value).getTime()),
    'Informe uma data válida.',
  )
  .refine(
    (value) => new Date(value) > new Date(),
    'O agendamento deve ser marcado para um horário futuro.',
  );

export const upsertAppointmentFormSchema = z.object({
  id: optionalUuidFromForm,
  doctorId: z.string().uuid('Selecione o médico.'),
  patientId: z.string().uuid('Selecione o paciente.'),
  appointmentDate: appointmentDateTimeSchema,
  status: z.enum(appointmentStatusValues, {
    message: 'Selecione o status do agendamento.',
  }),
  reasonForVisit: z.string().max(255, 'Use até 255 caracteres.').optional(),
  notes: z.string().max(1000, 'Use até 1000 caracteres.').optional(),
});

export const upsertAppointmentSchema = z.object({
  id: z.string().uuid().optional(),
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentDate: z.coerce.date(),
  status: z.enum(appointmentStatusValues),
  reasonForVisit: z.string().max(255).nullable(),
  notes: z.string().max(1000).nullable(),
});

export type UpsertAppointmentFormInput = z.input<
  typeof upsertAppointmentFormSchema
>;
export type UpsertAppointmentFormValues = z.output<
  typeof upsertAppointmentFormSchema
>;
export type UpsertAppointmentData = z.infer<typeof upsertAppointmentSchema>;

export type UpsertAppointmentFormState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function getAppointmentFormDefaultValues(
  initialData?: Partial<UpsertAppointmentFormValues>,
): UpsertAppointmentFormInput {
  return {
    id: initialData?.id,
    doctorId: initialData?.doctorId ?? '',
    patientId: initialData?.patientId ?? '',
    appointmentDate: initialData?.appointmentDate ?? '',
    status: initialData?.status ?? 'scheduled',
    reasonForVisit: initialData?.reasonForVisit ?? '',
    notes: initialData?.notes ?? '',
  };
}

export function toUpsertAppointmentPayload(
  values: UpsertAppointmentFormValues,
): UpsertAppointmentData {
  return {
    id: values.id,
    doctorId: values.doctorId,
    patientId: values.patientId,
    appointmentDate: new Date(values.appointmentDate),
    status: values.status,
    reasonForVisit: normalizeOptionalText(values.reasonForVisit),
    notes: normalizeOptionalText(values.notes),
  };
}
