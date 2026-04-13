'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { doctors, users } from '@/lib/db/schema';
import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { getServerSession } from '@/features/auth/lib/get-server-session';
import { requirePermission } from '@/features/auth/lib/require-permission';
import {
  updateUserSchema,
  type UpdateUserData,
  type UpsertUserFormState,
} from '@/features/users/schemas/upsert-user-schema';

export async function updateUserAction(
  input: UpdateUserData,
): Promise<UpsertUserFormState> {
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

  const parsedData = updateUserSchema.safeParse(input);

  if (!parsedData.success) {
    const { fieldErrors } = parsedData.error.flatten();

    return {
      success: false,
      message: 'Verifique os dados informados e tente novamente.',
      fieldErrors,
    };
  }

  const data = parsedData.data;

  const session = await getServerSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return {
      success: false,
      message: 'Não foi possível identificar o usuário logado.',
    };
  }

  if (data.id === currentUserId && !data.isActive) {
    return {
      success: false,
      message: 'Você não pode desativar sua própria conta.',
    };
  }

  if (data.id === currentUserId && data.role !== 'admin') {
    return {
      success: false,
      message: 'Você não pode alterar seu próprio cargo.',
    };
  }

  try {
    const updateResult = await db.transaction(async (tx) => {
      const currentUser = await tx.query.users.findFirst({
        where: and(eq(users.id, data.id), eq(users.clinicId, clinicId)),
        columns: {
          id: true,
        },
      });

      if (!currentUser) {
        throw new Error('USER_NOT_FOUND_FOR_CLINIC');
      }

      const currentlyLinkedDoctor = await tx.query.doctors.findFirst({
        where: and(eq(doctors.userId, data.id), eq(doctors.clinicId, clinicId)),
        columns: {
          id: true,
        },
      });

      if (data.role === 'doctor') {
        const targetDoctor = await tx.query.doctors.findFirst({
          where: and(eq(doctors.id, data.doctorId!), eq(doctors.clinicId, clinicId)),
          columns: {
            id: true,
            userId: true,
          },
        });

        if (!targetDoctor) {
          throw new Error('DOCTOR_NOT_FOUND_FOR_CLINIC');
        }

        if (targetDoctor.userId && targetDoctor.userId !== data.id) {
          throw new Error('DOCTOR_ALREADY_LINKED');
        }

        if (currentlyLinkedDoctor && currentlyLinkedDoctor.id !== targetDoctor.id) {
          await tx
            .update(doctors)
            .set({
              userId: null,
              updatedAt: new Date(),
            })
            .where(eq(doctors.id, currentlyLinkedDoctor.id));
        }

        if (targetDoctor.userId !== data.id) {
          await tx
            .update(doctors)
            .set({
              userId: data.id,
              updatedAt: new Date(),
            })
            .where(eq(doctors.id, targetDoctor.id));
        }
      } else if (currentlyLinkedDoctor) {
        await tx
          .update(doctors)
          .set({
            userId: null,
            updatedAt: new Date(),
          })
          .where(eq(doctors.id, currentlyLinkedDoctor.id));
      }

      const [updatedUser] = await tx
        .update(users)
        .set({
          name: data.name,
          role: data.role,
          phone: data.phone,
          isActive: data.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, data.id), eq(users.clinicId, clinicId)))
        .returning({ id: users.id });

      if (!updatedUser) {
        throw new Error('USER_NOT_FOUND_FOR_CLINIC');
      }

      return updatedUser;
    });

    if (!updateResult) {
      return {
        success: false,
        message: 'Usuário não encontrado para a clínica atual.',
      };
    }

    revalidatePath('/users');

    return {
      success: true,
      message: 'Usuário atualizado com sucesso.',
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND_FOR_CLINIC') {
      return {
        success: false,
        message: 'Usuário não encontrado para a clínica atual.',
      };
    }

    if (error instanceof Error && error.message === 'DOCTOR_NOT_FOUND_FOR_CLINIC') {
      return {
        success: false,
        message: 'O médico selecionado não foi encontrado para a clínica atual.',
        fieldErrors: {
          doctorId: ['Selecione um médico válido para concluir o vínculo.'],
        },
      };
    }

    if (error instanceof Error && error.message === 'DOCTOR_ALREADY_LINKED') {
      return {
        success: false,
        message: 'Este médico já está vinculado a outro usuário.',
        fieldErrors: {
          doctorId: ['Escolha um médico que ainda não possua login vinculado.'],
        },
      };
    }

    return {
      success: false,
      message: 'Não foi possível atualizar o usuário agora.',
    };
  }
}
