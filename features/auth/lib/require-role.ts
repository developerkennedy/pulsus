import { getServerSession } from '@/features/auth/lib/get-server-session';
import { type UserRole, isUserRole } from '@/features/auth/lib/user-role';

export async function requireRole(allowed: UserRole[]): Promise<void> {
  const session = await getServerSession();
  const rawRole = session?.user?.role;

  if (!isUserRole(rawRole) || !allowed.includes(rawRole)) {
    throw new Error('Você não tem permissão para realizar esta ação.');
  }
}
