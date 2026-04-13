import { z } from 'zod';

export const signUpSchema = z
  .object({
    clinicName: z
      .string()
      .min(2, 'Informe o nome da clínica.')
      .max(255, 'O nome da clínica é muito longo.'),
    adminName: z
      .string()
      .min(2, 'Informe o nome do administrador.')
      .max(255, 'O nome do administrador é muito longo.'),
    adminEmail: z.email('Informe um e-mail válido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .max(128, 'A senha é muito longa.'),
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas precisam ser iguais.',
  });

export type SignUpValues = z.infer<typeof signUpSchema>;

export type SignUpActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof SignUpValues, string>>;
};
