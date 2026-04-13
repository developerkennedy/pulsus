'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { signInAction } from '@/features/auth/actions/sign-in';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import {
  signInSchema,
  type SignInActionState,
  type SignInValues,
} from '@/features/auth/schemas/sign-in-schema';

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<SignInActionState | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    shouldUnregister: true,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: SignInValues) {
    setFormState(null);

    startTransition(async () => {
      const result = await signInAction(values);

      setFormState(result);

      if (result.success) {
        router.replace('/');
        router.refresh();
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <AuthFormField
        label="E-mail"
        htmlFor="email"
        error={
          form.formState.errors.email?.message ?? formState?.fieldErrors?.email
        }
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@clinica.com.br"
          className={cn(
            'h-11 rounded-2xl',
            form.formState.errors.email || formState?.fieldErrors?.email
              ? 'border-rose-300 focus-visible:ring-rose-100'
              : '',
          )}
          {...form.register('email')}
        />
      </AuthFormField>

      <AuthFormField
        label="Senha"
        htmlFor="password"
        error={
          form.formState.errors.password?.message ??
          formState?.fieldErrors?.password
        }
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          className={cn(
            'h-11 rounded-2xl',
            form.formState.errors.password || formState?.fieldErrors?.password
              ? 'border-rose-300 focus-visible:ring-rose-100'
              : '',
          )}
          {...form.register('password')}
        />
      </AuthFormField>

      {formState?.message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formState.message}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-2xl"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Entrar no sistema
          </>
        )}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Ainda não criou sua clínica?{' '}
        <Link href="/sign-up" className="font-medium text-blue-600">
          Abrir cadastro inicial
        </Link>
      </p>
    </form>
  );
}
