'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { signUpAction } from '@/features/auth/actions/sign-up';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import {
  signUpSchema,
  type SignUpActionState,
  type SignUpValues,
} from '@/features/auth/schemas/sign-up-schema';

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<SignUpActionState | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      clinicName: '',
      adminName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
    },
  });

  function onSubmit(values: SignUpValues) {
    setFormState(null);

    startTransition(async () => {
      const result = await signUpAction(values);

      setFormState(result);

      if (result.success) {
        router.replace('/');
        router.refresh();
      }
    });
  }

  function getFieldError(fieldName: keyof SignUpValues) {
    return (
      form.formState.errors[fieldName]?.message ??
      formState?.fieldErrors?.[fieldName]
    );
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthFormField
          label="Nome da clínica"
          htmlFor="clinicName"
          error={getFieldError('clinicName')}
        >
          <Input
            id="clinicName"
            autoComplete="organization"
            placeholder="Clínica Vida"
            className={cn(
              'h-11 rounded-2xl',
              getFieldError('clinicName')
                ? 'border-rose-300 focus-visible:ring-rose-100'
                : '',
            )}
            {...form.register('clinicName')}
          />
        </AuthFormField>

        <AuthFormField
          label="Nome do administrador"
          htmlFor="adminName"
          error={getFieldError('adminName')}
        >
          <Input
            id="adminName"
            autoComplete="name"
            placeholder="Ana Souza"
            className={cn(
              'h-11 rounded-2xl',
              getFieldError('adminName')
                ? 'border-rose-300 focus-visible:ring-rose-100'
                : '',
            )}
            {...form.register('adminName')}
          />
        </AuthFormField>
      </div>

      <AuthFormField
        label="E-mail do administrador"
        htmlFor="adminEmail"
        hint="Esse e-mail será usado para login no sistema."
        error={getFieldError('adminEmail')}
      >
        <Input
          id="adminEmail"
          type="email"
          autoComplete="email"
          placeholder="ana@clinicavida.com.br"
          className={cn(
            'h-11 rounded-2xl',
            getFieldError('adminEmail')
              ? 'border-rose-300 focus-visible:ring-rose-100'
              : '',
          )}
          {...form.register('adminEmail')}
        />
      </AuthFormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthFormField
          label="Senha"
          htmlFor="password"
          hint="Use pelo menos 8 caracteres."
          error={getFieldError('password')}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Crie uma senha segura"
            className={cn(
              'h-11 rounded-2xl',
              getFieldError('password')
                ? 'border-rose-300 focus-visible:ring-rose-100'
                : '',
            )}
            {...form.register('password')}
          />
        </AuthFormField>

        <AuthFormField
          label="Confirmar senha"
          htmlFor="confirmPassword"
          error={getFieldError('confirmPassword')}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            className={cn(
              'h-11 rounded-2xl',
              getFieldError('confirmPassword')
                ? 'border-rose-300 focus-visible:ring-rose-100'
                : '',
            )}
            {...form.register('confirmPassword')}
          />
        </AuthFormField>
      </div>

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
            Criando acesso...
          </>
        ) : (
          <>
            Criar clínica e acessar
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Já tem uma conta?{' '}
        <Link href="/sign-in" className="font-medium text-blue-600">
          Entrar
        </Link>
      </p>
    </form>
  );
}
