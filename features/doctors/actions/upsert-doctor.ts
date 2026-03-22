'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

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
      const [savedDoctor] = data.id
        ? await tx
            .insert(doctors)
            .values({
              id: data.id,
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
            .onConflictDoUpdate({
              target: doctors.id,
              set: {
                name: data.name,
                email: data.email,
                specialityId: data.specialityId,
                license: data.license,
                phone: data.phone,
                bio: data.bio,
                consultationFee: data.consultationFee,
                isActive: data.isActive,
                updatedAt: new Date(),
              },
            })
            .returning({
              id: doctors.id,
            })
        : await tx
            .insert(doctors)
            .values({
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
            });

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
    const databaseError = error as { code?: string; constraint_name?: string };

    if (databaseError.code === '23505') {
      return {
        success: false,
        message: 'Já existe um médico com este e-mail ou registro.',
      };
    }

    if (databaseError.code === '23503') {
      return {
        success: false,
        message: 'A especialidade selecionada não foi encontrada.',
      };
    }

    return {
      success: false,
      message: 'Não foi possível salvar o médico agora.',
    };
  }
}
