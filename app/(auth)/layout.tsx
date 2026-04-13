import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getServerSession } from '@/features/auth/lib/get-server-session';

type AuthLayoutProps = {
  children: ReactNode;
};

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/');
  }

  return children;
}
