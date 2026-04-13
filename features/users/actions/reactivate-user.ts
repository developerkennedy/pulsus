'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { isValidUuid } from '@/lib/is-valid-uuid';

type ReactivateUserState = {
  success: boolean;
  message: string;
};

export async function reactivateUserAction(
  userId: string,
): Promise<ReactivateUserState> {
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
      message: 'Usuário inválido para reativação.',
    };
  }

  try {
    const [reactivatedUser] = await db
      .update(users)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.clinicId, clinicId)))
      .returning({ id: users.id });

    if (!reactivatedUser) {
      return {
        success: false,
        message: 'Usuário não encontrado.',
      };
    }

    revalidatePath('/users');

    return {
      success: true,
      message: 'Usuário reativado com sucesso.',
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível reativar o usuário agora.',
    };
  }
}
