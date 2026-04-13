'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { db } from '@/lib/db';
import { doctorAvailabilities, doctors } from '@/lib/db/schema';
import {
  upsertDoctorSchema,
  type UpsertDoctorData,
  type UpsertDoctorFormState,
} from '@/features/doctors/schemas/upsert-doctor-schema';

export async function upsertDoctorAction(
  input: UpsertDoctorData,
): Promise<UpsertDoctorFormState> {
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

  const parsedData = upsertDoctorSchema.safeParse(input);

  if (!parsedData.success) {
    const { fieldErrors } = parsedData.error.flatten();

    return {
      success: false,
      message: 'Verifique os dados informados e tente novamente.',
      fieldErrors,
    };
  }

  const data = parsedData.data;

  try {
    await db.transaction(async (tx) => {
      const savedDoctor = data.id
        ? (
            await tx
              .update(doctors)
              .set({
                name: data.name,
                email: data.email,
                specialityId: data.specialityId,
                license: data.license,
                phone: data.phone,
                bio: data.bio,
                consultationFee: data.consultationFee,
                isActive: data.isActive,
                updatedAt: new Date(),
              })
              .where(and(eq(doctors.id, data.id), eq(doctors.clinicId, clinicId)))
              .returning({
                id: doctors.id,
              })
          )[0]
        : (
            await tx
              .insert(doctors)
              .values({
                clinicId,
                name: data.name,
                email: data.email,
                specialityId: data.specialityId,
                license: data.license,
                phone: data.phone,
                bio: data.bio,
                consultationFee: data.consultationFee,
                isActive: data.isActive,
              })
              .returning({
                id: doctors.id,
              })
          )[0];

      if (!savedDoctor) {
        throw new Error('DOCTOR_NOT_FOUND_FOR_CLINIC');
      }

      await tx
        .delete(doctorAvailabilities)
        .where(eq(doctorAvailabilities.doctorId, savedDoctor.id));

      await tx.insert(doctorAvailabilities).values(
        data.availabilities.map((availability) => ({
          doctorId: savedDoctor.id,
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
        })),
      );
    });

    revalidatePath('/doctors');

    return {
      success: true,
      message: data.id
        ? 'Médico atualizado com sucesso.'
        : 'Médico criado com sucesso.',
    };
  } catch (error) {
    const databaseError = error as {
      code?: string;
      constraint_name?: string;
      constraint?: string;
    };
    const violatedConstraint =
      databaseError.constraint_name ?? databaseError.constraint;

    if (databaseError.code === '23505') {
      if (violatedConstraint === 'doctors_clinic_email_unique') {
        return {
          success: false,
          message: 'Já existe um médico com este e-mail nesta clínica.',
          fieldErrors: {
            email: ['Informe um e-mail diferente para este médico.'],
          },
        };
      }

      if (violatedConstraint === 'doctors_clinic_license_unique') {
        return {
          success: false,
          message: 'Já existe um médico com este registro nesta clínica.',
          fieldErrors: {
            license: ['Informe um registro profissional diferente.'],
          },
        };
      }

      return {
        success: false,
        message: 'Já existe um médico com este e-mail ou registro nesta clínica.',
      };
    }

    if (databaseError.code === '23503') {
      return {
        success: false,
        message: 'A especialidade selecionada não foi encontrada.',
      };
    }

    if (error instanceof Error && error.message === 'DOCTOR_NOT_FOUND_FOR_CLINIC') {
      return {
        success: false,
        message: 'Médico não encontrado para a clínica atual.',
      };
    }

    return {
      success: false,
      message: 'Não foi possível salvar o médico agora.',
    };
  }
}
