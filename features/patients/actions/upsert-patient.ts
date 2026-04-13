'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { encrypt, hmacHash } from '@/lib/crypto';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { patients } from '@/lib/db/schema';
import {
  upsertPatientSchema,
  type UpsertPatientData,
  type UpsertPatientFormState,
} from '@/features/patients/schemas/upsert-patient-schema';

export async function upsertPatientAction(
  input: UpsertPatientData,
): Promise<UpsertPatientFormState> {
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

  const parsedData = upsertPatientSchema.safeParse(input);

  if (!parsedData.success) {
    const { fieldErrors } = parsedData.error.flatten();

    return {
      success: false,
      message: 'Verifique os dados informados e tente novamente.',
      fieldErrors,
    };
  }

  const data = parsedData.data;
  const encryptedCpf = encrypt(data.cpf);
  const cpfHash = hmacHash(data.cpf);

  try {
    if (data.id) {
      const [updatedPatient] = await db
        .update(patients)
        .set({
          name: data.name,
          email: data.email,
          cpf: encryptedCpf,
          cpfHash,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          phone: data.phone,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          isActive: data.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(patients.id, data.id), eq(patients.clinicId, clinicId)))
        .returning({ id: patients.id });

      if (!updatedPatient) {
        return {
          success: false,
          message: 'Paciente não encontrado para a clínica atual.',
        };
      }
    } else {
      await db.insert(patients).values({
        clinicId,
        name: data.name,
        email: data.email,
        cpf: encryptedCpf,
        cpfHash,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        isActive: data.isActive,
      });
    }

    revalidatePath('/patients');

    return {
      success: true,
      message: data.id
        ? 'Paciente atualizado com sucesso.'
        : 'Paciente cadastrado com sucesso.',
    };
  } catch (error) {
    logger.error('Falha ao salvar paciente', {
      action: 'upsertPatientAction',
      clinicId,
      patientId: data.id ?? null,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    const databaseError = error as {
      code?: string;
      detail?: string;
      constraint_name?: string;
      constraint?: string;
      message?: string;
    };

    if (databaseError.code === '23505') {
      const constraintName =
        databaseError.constraint_name ?? databaseError.constraint;

      if (constraintName === 'patients_clinic_cpf_unique' || constraintName === 'patients_clinic_cpf_hash_unique') {
        return {
          success: false,
          message: 'Já existe um paciente com este CPF nesta clínica.',
          fieldErrors: {
            cpf: ['Informe um CPF diferente para este paciente.'],
          },
        };
      }

      return {
        success: false,
        message: 'Já existe um paciente com este CPF nesta clínica.',
      };
    }

    if (databaseError.code === '23503') {
      return {
        success: false,
        message: 'A clínica vinculada ao usuário não foi encontrada.',
      };
    }

    if (databaseError.code === '22P02') {
      return {
        success: false,
        message: 'Um dos dados enviados para o cadastro está em formato inválido.',
      };
    }

    if (databaseError.code === '22007' || databaseError.code === '22008') {
      return {
        success: false,
        message: 'A data de nascimento informada é inválida.',
        fieldErrors: {
          dateOfBirth: ['Informe uma data válida para continuar.'],
        },
      };
    }

    if (databaseError.code === '22001') {
      return {
        success: false,
        message: 'Um ou mais campos ultrapassaram o tamanho permitido.',
      };
    }

    return {
      success: false,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Não foi possível salvar o paciente agora.'
          : `Não foi possível salvar o paciente agora. Código técnico: ${databaseError.code ?? 'desconhecido'}.`,
    };
  }
}
