import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a sua senha.'),
});

export type SignInValues = z.infer<typeof signInSchema>;

export type SignInActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof SignInValues, string>>;
};
