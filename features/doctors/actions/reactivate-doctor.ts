'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { isValidUuid } from '@/lib/is-valid-uuid';
import { db } from '@/lib/db';
import { doctors } from '@/lib/db/schema';

type ReactivateDoctorState = {
  success: boolean;
  message: string;
};

export async function reactivateDoctorAction(
  doctorId: string,
): Promise<ReactivateDoctorState> {
  let clinicId: string;

  try {
    clinicId = await getRequiredClinicId();
    await requirePermission('doctor.manage');
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível identificar a clínica do usuário logado.',
    };
  }

  if (!isValidUuid(doctorId)) {
    return {
      success: false,
      message: 'Médico inválido para reativação.',
    };
  }

  try {
    const [reactivatedDoctor] = await db
      .update(doctors)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(and(eq(doctors.id, doctorId), eq(doctors.clinicId, clinicId)))
      .returning({ id: doctors.id });

    if (!reactivatedDoctor) {
      return {
        success: false,
        message: 'Médico não encontrado.',
      };
    }

    revalidatePath('/doctors');

    return {
      success: true,
      message: 'Médico reativado com sucesso.',
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível reativar o médico agora.',
    };
  }
}
