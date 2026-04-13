import {
  hasPermission,
  type AppPermission,
} from '@/features/auth/lib/permissions';
import { getUserAccessContext } from '@/features/auth/lib/get-user-access-context';

export async function requirePermission(permission: AppPermission): Promise<void> {
  const accessContext = await getUserAccessContext();

  if (!hasPermission(accessContext.role, permission)) {
    throw new Error('Você não tem permissão para realizar esta ação.');
  }
}
