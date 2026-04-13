import { z } from 'zod';

export const doctorWeekdayOptions = [
  { value: 'monday', label: 'Segunda-feira', shortLabel: 'Seg' },
  { value: 'tuesday', label: 'Terça-feira', shortLabel: 'Ter' },
  { value: 'wednesday', label: 'Quarta-feira', shortLabel: 'Qua' },
  { value: 'thursday', label: 'Quinta-feira', shortLabel: 'Qui' },
  { value: 'friday', label: 'Sexta-feira', shortLabel: 'Sex' },
  { value: 'saturday', label: 'Sábado', shortLabel: 'Sáb' },
  { value: 'sunday', label: 'Domingo', shortLabel: 'Dom' },
] as const;

const doctorWeekdayValues = doctorWeekdayOptions.map((day) => day.value);

export const doctorAvailabilityDayOfWeekSchema = z.enum(doctorWeekdayValues);

const timeFieldSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: 'Use o formato HH:mm.',
});

const optionalTextField = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || null);

const optionalUuidFromForm = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const upsertDoctorAvailabilitySchema = z.object({
  dayOfWeek: doctorAvailabilityDayOfWeekSchema,
  startTime: timeFieldSchema,
  endTime: timeFieldSchema,
});

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z
      .string()
      .trim()
      .min(3, 'Informe o nome do médico.')
      .max(255, 'O nome deve ter no máximo 255 caracteres.'),
    email: z
      .string()
      .trim()
      .email('Informe um e-mail válido.')
      .max(255, 'O e-mail deve ter no máximo 255 caracteres.'),
    specialityId: z.string().uuid('Selecione a especialidade do médico.'),
    license: z
      .string()
      .trim()
      .min(3, 'Informe o registro profissional.')
      .max(50, 'O registro deve ter no máximo 50 caracteres.'),
    phone: optionalTextField.refine(
      (value) => value === null || value.length <= 20,
      'O telefone deve ter no máximo 20 caracteres.',
    ),
    bio: optionalTextField.refine(
      (value) => value === null || value.length <= 500,
      'A biografia deve ter no máximo 500 caracteres.',
    ),
    consultationFee: z.number().int().min(0).nullable(),
    isActive: z.boolean(),
    availabilities: z
      .array(upsertDoctorAvailabilitySchema)
      .min(1, 'Selecione pelo menos um dia disponível.'),
  })
  .superRefine((data, context) => {
    const selectedDays = new Set<string>();

    data.availabilities.forEach((availability, index) => {
      if (selectedDays.has(availability.dayOfWeek)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cada dia da semana pode ser selecionado apenas uma vez.',
          path: ['availabilities', index, 'dayOfWeek'],
        });
      }

      selectedDays.add(availability.dayOfWeek);

      if (availability.startTime >= availability.endTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A hora final deve ser maior que a hora inicial.',
          path: ['availabilities', index, 'endTime'],
        });
      }
    });
  });

const availabilityFormRowSchema = z.object({
  dayOfWeek: doctorAvailabilityDayOfWeekSchema,
  enabled: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
});

export const upsertDoctorFormSchema = z
  .object({
    id: optionalUuidFromForm,
    name: z
      .string()
      .trim()
      .min(3, 'Informe o nome do médico.')
      .max(255, 'O nome deve ter no máximo 255 caracteres.'),
    email: z
      .string()
      .trim()
      .email('Informe um e-mail válido.')
      .max(255, 'O e-mail deve ter no máximo 255 caracteres.'),
    specialityId: z
      .string()
      .min(1, 'Selecione a especialidade do médico.')
      .uuid('Selecione a especialidade do médico.'),
    license: z
      .string()
      .trim()
      .min(3, 'Informe o registro profissional.')
      .max(50, 'O registro deve ter no máximo 50 caracteres.'),
    phone: z
      .string()
      .trim()
      .max(20, 'O telefone deve ter no máximo 20 caracteres.')
      .optional()
      .or(z.literal('')),
    bio: z
      .string()
      .trim()
      .max(500, 'A biografia deve ter no máximo 500 caracteres.')
      .optional()
      .or(z.literal('')),
    consultationFee: z.coerce
      .number()
      .int('Use um valor inteiro em centavos.')
      .min(0, 'O valor da consulta não pode ser negativo.')
      .nullable(),
    isActive: z.boolean(),
    availabilities: z.array(availabilityFormRowSchema),
  })
  .superRefine((data, context) => {
    const enabledRows = data.availabilities.filter((availability) => availability.enabled);

    if (enabledRows.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione pelo menos um dia disponível.',
        path: ['availabilities'],
      });
    }

    data.availabilities.map((availability, index) => {
      if (!availability.enabled) {
        return;
      }

      const startTimeValidation = timeFieldSchema.safeParse(availability.startTime);
      const endTimeValidation = timeFieldSchema.safeParse(availability.endTime);

      if (!startTimeValidation.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Use o formato HH:mm.',
          path: ['availabilities', index, 'startTime'],
        });
      }

      if (!endTimeValidation.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Use o formato HH:mm.',
          path: ['availabilities', index, 'endTime'],
        });
      }

      if (
        startTimeValidation.success &&
        endTimeValidation.success &&
        availability.startTime >= availability.endTime
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A hora final deve ser maior que a hora inicial.',
          path: ['availabilities', index, 'endTime'],
        });
      }
    });
  });

export type UpsertDoctorData = z.output<typeof upsertDoctorSchema>;
export type UpsertDoctorInput = z.input<typeof upsertDoctorSchema>;

export type UpsertDoctorFormValues = z.output<typeof upsertDoctorFormSchema>;
export type UpsertDoctorFormInput = z.input<typeof upsertDoctorFormSchema>;

export type UpsertDoctorFormState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function getDoctorFormDefaultValues(
  initialData?: Partial<UpsertDoctorData>,
): UpsertDoctorFormInput {
  const availabilityMap = new Map(
    initialData?.availabilities?.map((availability) => [
      availability.dayOfWeek,
      availability,
    ]) ?? [],
  );

  return {
    id: initialData?.id,
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    specialityId: initialData?.specialityId ?? '',
    license: initialData?.license ?? '',
    phone: initialData?.phone ?? '',
    bio: initialData?.bio ?? '',
    consultationFee: initialData?.consultationFee ?? null,
    isActive: initialData?.isActive ?? true,
    availabilities: doctorWeekdayOptions.map((day) => {
      const availability = availabilityMap.get(day.value);

      return {
        dayOfWeek: day.value,
        enabled: Boolean(availability),
        startTime: availability?.startTime ?? '08:00',
        endTime: availability?.endTime ?? '17:00',
      };
    }),
  };
}

export function toUpsertDoctorPayload(
  values: UpsertDoctorFormValues,
): UpsertDoctorData {
  return upsertDoctorSchema.parse({
    ...values,
    availabilities: values.availabilities
      .filter((availability) => availability.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      })),
  });
}
