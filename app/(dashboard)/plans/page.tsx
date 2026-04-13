import { redirect } from 'next/navigation';

import { getUserAccessContext } from '@/features/auth/lib/get-user-access-context';
import { hasPermission } from '@/features/auth/lib/permissions';
import { PlansPageContent } from '@/features/plans/components/plans-page-content';

export default async function PlansPage() {
  const accessContext = await getUserAccessContext();

  if (!hasPermission(accessContext.role, 'billing.read')) {
    redirect('/');
  }

  return <PlansPageContent />;
}
