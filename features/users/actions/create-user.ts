'use server';

import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { doctors, users } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import {
  createUserSchema,
  type CreateUserData,
  type UpsertUserFormState,
} from '@/features/users/schemas/upsert-user-schema';

export async function createUserAction(
  input: CreateUserData,
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

  const parsedData = createUserSchema.safeParse(input);

  if (!parsedData.success) {
    const { fieldErrors } = parsedData.error.flatten();

    return {
      success: false,
      message: 'Verifique os dados informados e tente novamente.',
      fieldErrors,
    };
  }

  const data = parsedData.data;
  let createdUserId: string | null = null;

  try {
    if (data.role === 'doctor') {
      const linkedDoctor = await db.query.doctors.findFirst({
        where: and(eq(doctors.id, data.doctorId!), eq(doctors.clinicId, clinicId)),
        columns: {
          id: true,
          userId: true,
        },
      });

      if (!linkedDoctor) {
        return {
          success: false,
          message: 'O médico selecionado não foi encontrado para a clínica atual.',
          fieldErrors: {
            doctorId: ['Selecione um médico válido para concluir o vínculo.'],
          },
        };
      }

      if (linkedDoctor.userId) {
        return {
          success: false,
          message: 'Este médico já está vinculado a outro usuário.',
          fieldErrors: {
            doctorId: ['Escolha um médico que ainda não possua login vinculado.'],
          },
        };
      }
    }

    const createUserResult = await auth.api.createUser({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        data: {
          clinicId,
          phone: data.phone,
          isActive: true,
        },
      },
      headers: new Headers(await headers()),
    });

    createdUserId = String(createUserResult.user.id);
    const persistedUserId = createdUserId;

    if (data.role === 'doctor') {
      const [linkedDoctor] = await db
        .update(doctors)
        .set({
          userId: persistedUserId,
          updatedAt: new Date(),
        })
        .where(and(eq(doctors.id, data.doctorId!), eq(doctors.clinicId, clinicId)))
        .returning({
          id: doctors.id,
        });

      if (!linkedDoctor) {
        throw new Error('DOCTOR_NOT_FOUND_FOR_CLINIC');
      }
    }

    revalidatePath('/users');
    revalidatePath('/doctors');

    return {
      success: true,
      message: 'Usuário criado com sucesso.',
    };
  } catch (error) {
    logger.error('Falha ao criar usuário', {
      action: 'createUserAction',
      clinicId,
      email: data.email,
      role: data.role,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (createdUserId) {
      await db.delete(users).where(eq(users.id, createdUserId)).catch((deleteError) => {
        logger.error('Falha ao reverter usuário criado', {
          action: 'createUserAction',
          createdUserId,
          errorMessage: deleteError instanceof Error ? deleteError.message : String(deleteError),
        });
      });
    }

    if (
      error &&
      typeof error === 'object' &&
      'body' in error &&
      error.body &&
      typeof error.body === 'object' &&
      'code' in error.body &&
      error.body.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
    ) {
      return {
        success: false,
        message: 'Já existe um usuário com este e-mail.',
        fieldErrors: { email: ['Já existe um usuário com este e-mail.'] },
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
      message: 'Não foi possível criar o usuário agora.',
    };
  }
}
