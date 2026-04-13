'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { getServerSession } from '@/features/auth/lib/get-server-session';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { isValidUuid } from '@/lib/is-valid-uuid';

type DeactivateUserState = {
  success: boolean;
  message: string;
};

export async function deactivateUserAction(
  userId: string,
): Promise<DeactivateUserState> {
  let clinicId: string;

  try {
    clinicId = await getRequiredClinicId();
    await requirePermission('user.manage');
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível identificar a clínica do usuário logado.',
    };
  }

  if (!isValidUuid(userId)) {
    return {
      success: false,
      message: 'Usuário inválido para desativação.',
    };
  }

  const session = await getServerSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return {
      success: false,
      message: 'Não foi possível identificar o usuário logado.',
    };
  }

  if (userId === currentUserId) {
    return {
      success: false,
      message: 'Você não pode desativar sua própria conta.',
    };
  }

  try {
    const [deactivatedUser] = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.clinicId, clinicId)))
      .returning({ id: users.id });

    if (!deactivatedUser) {
      return {
        success: false,
        message: 'Usuário não encontrado.',
      };
    }

    revalidatePath('/users');

    return {
      success: true,
      message: 'Usuário desativado com sucesso.',
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível desativar o usuário agora.',
    };
  }
}
