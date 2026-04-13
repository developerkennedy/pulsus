'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { isValidUuid } from '@/lib/is-valid-uuid';
import { db } from '@/lib/db';
import { patients } from '@/lib/db/schema';

type DeactivatePatientState = {
  success: boolean;
  message: string;
};

export async function deactivatePatientAction(
  patientId: string,
): Promise<DeactivatePatientState> {
  let clinicId: string;

  try {
    clinicId = await getRequiredClinicId();
    await requirePermission('patient.manage');
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível identificar a clínica do usuário logado.',
    };
  }

  if (!isValidUuid(patientId)) {
    return {
      success: false,
      message: 'Paciente inválido para desativação.',
    };
  }

  try {
    const [deactivatedPatient] = await db
      .update(patients)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
      .returning({ id: patients.id });

    if (!deactivatedPatient) {
      return {
        success: false,
        message: 'Paciente não encontrado.',
      };
    }

    revalidatePath('/patients');

    return {
      success: true,
      message: 'Paciente desativado com sucesso.',
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível desativar o paciente agora.',
    };
  }
}
