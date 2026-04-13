import { z } from 'zod';

export const userRoleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'receptionist', label: 'Recepcionista' },
  { value: 'doctor', label: 'Médico' },
] as const;

const userRoleValues = userRoleOptions.map((role) => role.value);

const userRoleSchema = z.enum(userRoleValues);

const optionalTextField = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || null);

const optionalUuidField = z.string().uuid().optional();

const optionalUuidFromForm = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

// --- Data schemas (for server actions) ---

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do usuário.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail do usuário.')
    .max(255, 'O e-mail deve ter no máximo 255 caracteres.')
    .pipe(z.string().email('Informe um e-mail válido.')),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.'),
  role: userRoleSchema,
  doctorId: optionalUuidField,
  phone: optionalTextField.refine(
    (value) => value === null || value.length <= 20,
    'O telefone deve ter no máximo 20 caracteres.',
  ),
}).superRefine((data, context) => {
  if (data.role === 'doctor' && !data.doctorId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o médico vinculado a este usuário.',
      path: ['doctorId'],
    });
  }
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do usuário.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  role: userRoleSchema,
  doctorId: optionalUuidField,
  phone: optionalTextField.refine(
    (value) => value === null || value.length <= 20,
    'O telefone deve ter no máximo 20 caracteres.',
  ),
  isActive: z.boolean(),
}).superRefine((data, context) => {
  if (data.role === 'doctor' && !data.doctorId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o médico vinculado a este usuário.',
      path: ['doctorId'],
    });
  }
});

// --- Form schemas (for client-side validation) ---

export const createUserFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do usuário.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail do usuário.')
    .max(255, 'O e-mail deve ter no máximo 255 caracteres.')
    .email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.'),
  role: z
    .string()
    .min(1, 'Selecione o cargo do usuário.')
    .refine(
      (value) =>
        userRoleValues.includes(value as (typeof userRoleValues)[number]),
      'Selecione um cargo válido.',
      ),
  doctorId: optionalUuidFromForm,
  phone: z
    .string()
    .trim()
    .max(20, 'O telefone deve ter no máximo 20 caracteres.')
    .optional()
    .or(z.literal('')),
}).superRefine((data, context) => {
  if (data.role === 'doctor' && !data.doctorId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o médico vinculado a este usuário.',
      path: ['doctorId'],
    });
  }
});

export const updateUserFormSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(3, 'Informe o nome do usuário.')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  role: z
    .string()
    .min(1, 'Selecione o cargo do usuário.')
    .refine(
      (value) =>
        userRoleValues.includes(value as (typeof userRoleValues)[number]),
      'Selecione um cargo válido.',
      ),
  doctorId: optionalUuidFromForm,
  phone: z
    .string()
    .trim()
    .max(20, 'O telefone deve ter no máximo 20 caracteres.')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
}).superRefine((data, context) => {
  if (data.role === 'doctor' && !data.doctorId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o médico vinculado a este usuário.',
      path: ['doctorId'],
    });
  }
});

export type CreateUserData = z.output<typeof createUserSchema>;
export type UpdateUserData = z.output<typeof updateUserSchema>;
export type CreateUserFormValues = z.input<typeof createUserFormSchema>;
export type UpdateUserFormValues = z.input<typeof updateUserFormSchema>;

export type UpsertUserFormState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function getCreateUserFormDefaultValues(): z.input<typeof createUserFormSchema> {
  return {
    name: '',
    email: '',
    password: '',
    role: '',
    doctorId: '',
    phone: '',
  };
}

export function getUpdateUserFormDefaultValues(
  initialData?: Partial<UpdateUserFormValues>,
): z.input<typeof updateUserFormSchema> {
  return {
    id: initialData?.id ?? '',
    name: initialData?.name ?? '',
    role: initialData?.role ?? '',
    doctorId: initialData?.doctorId ?? '',
    phone: initialData?.phone ?? '',
    isActive: initialData?.isActive ?? true,
  };
}
