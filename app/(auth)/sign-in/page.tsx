import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/components/auth-shell';
import { SignInForm } from '@/features/auth/components/sign-in-form';

export const metadata: Metadata = {
  title: 'Entrar | dr.agenda',
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Entrar na sua clínica"
      description="Acesse o painel administrativo da clínica para continuar com cadastros, agenda e operação diária."
      footer={
        <span>
          Ambiente de autenticação do <strong>Dr.Agenda</strong>
        </span>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
