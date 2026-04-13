import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/components/auth-shell';
import { SignUpForm } from '@/features/auth/components/sign-up-form';

export const metadata: Metadata = {
  title: 'Criar Clínica | dr.agenda',
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Criar clínica e usuário administrador"
      description="Vamos abrir a clínica no sistema e criar o primeiro acesso administrativo no mesmo fluxo."
      footer={
        <span>
          Depois do cadastro, seguimos para a área interna do <strong>dr.agenda</strong>
        </span>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
