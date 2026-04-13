import { z } from 'zod';

export const patientGenderOptions = [
  { value: 'female', label: 'Feminino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Outro' },
] as const;

const patientGenderValues = patientGenderOptions.map((gender) => gender.value);

export const patientGenderSchema = z.enum(patientGenderValues);

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

const cpfSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ''))
  .refine((value) => value.length === 11, 'Informe um CPF com 11 dígitos.');

const dateOfBirthStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Informe uma data válida.',
});

const dateOfBirthSchema = z.coerce.date({
  error: 'Informe a data de nascimento.',
});

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do paciente.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  email: optionalTextField.refine(
    (value) =>
      value === null || z.email().safeParse(value).success,
    'Informe um e-mail válido.',
  ).refine(
    (value) => value === null || value.length <= 255,
    'O e-mail deve ter no máximo 255 caracteres.',
  ),
  cpf: cpfSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: patientGenderSchema,
  phone: optionalTextField.refine(
    (value) => value === null || value.length <= 20,
    'O telefone deve ter no máximo 20 caracteres.',
  ),
  emergencyContact: optionalTextField.refine(
    (value) => value === null || value.length <= 255,
    'O contato de emergência deve ter no máximo 255 caracteres.',
  ),
  emergencyPhone: optionalTextField.refine(
    (value) => value === null || value.length <= 20,
    'O telefone de emergência deve ter no máximo 20 caracteres.',
  ),
  isActive: z.boolean(),
});

export const upsertPatientFormSchema = z.object({
  id: optionalUuidFromForm,
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do paciente.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  email: z
    .string()
    .trim()
    .max(255, 'O e-mail deve ter no máximo 255 caracteres.')
    .optional()
    .or(z.literal(''))
    .refine(
      (value) => value === '' || z.email().safeParse(value).success,
      'Informe um e-mail válido.',
    ),
  cpf: cpfSchema,
  dateOfBirth: dateOfBirthStringSchema,
  gender: z
    .string()
    .min(1, 'Selecione o sexo do paciente.')
    .refine(
      (value) =>
        patientGenderValues.includes(
          value as (typeof patientGenderValues)[number],
        ),
      'Selecione o sexo do paciente.',
    ),
  phone: z
    .string()
    .trim()
    .max(20, 'O telefone deve ter no máximo 20 caracteres.')
    .optional()
    .or(z.literal('')),
  emergencyContact: z
    .string()
    .trim()
    .max(255, 'O contato de emergência deve ter no máximo 255 caracteres.')
    .optional()
    .or(z.literal('')),
  emergencyPhone: z
    .string()
    .trim()
    .max(20, 'O telefone de emergência deve ter no máximo 20 caracteres.')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
});

export type UpsertPatientData = z.output<typeof upsertPatientSchema>;
export type UpsertPatientFormInput = z.input<typeof upsertPatientFormSchema>;
export type UpsertPatientFormValues = z.output<typeof upsertPatientFormSchema>;

export type UpsertPatientFormState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function getPatientFormDefaultValues(
  initialData?: Partial<UpsertPatientFormValues>,
): UpsertPatientFormInput {
  return {
    id: initialData?.id,
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    cpf: initialData?.cpf ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '',
    gender: initialData?.gender ?? '',
    phone: initialData?.phone ?? '',
    emergencyContact: initialData?.emergencyContact ?? '',
    emergencyPhone: initialData?.emergencyPhone ?? '',
    isActive: initialData?.isActive ?? true,
  };
}

export function toUpsertPatientPayload(
  values: UpsertPatientFormValues,
): UpsertPatientData {
  return upsertPatientSchema.parse({
    ...values,
    dateOfBirth: new Date(`${values.dateOfBirth}T00:00:00`),
  });
}
