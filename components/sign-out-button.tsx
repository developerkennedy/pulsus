'use client';

import { useFormStatus } from 'react-dom';
import { LoaderCircle, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { signOutAction } from '@/features/auth/actions/sign-out';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      disabled={pending}
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Saindo...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          Sair da conta
        </>
      )}
    </Button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}
