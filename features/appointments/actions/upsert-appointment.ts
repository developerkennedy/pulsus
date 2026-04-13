'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { getServerSession } from '@/features/auth/lib/get-server-session';
import {
  isAppointmentWithinDoctorAvailability,
  normalizeAppointmentDate,
} from '@/features/appointments/lib/appointment-scheduling';
import { db } from '@/lib/db';
import { appointments, doctors, patients } from '@/lib/db/schema';
import {
  upsertAppointmentSchema,
  type UpsertAppointmentData,
  type UpsertAppointmentFormState,
} from '@/features/appointments/schemas/upsert-appointment-schema';

export async function upsertAppointmentAction(
  input: UpsertAppointmentData,
): Promise<UpsertAppointmentFormState> {
  let clinicId: string;

  try {
    clinicId = await getRequiredClinicId();
    await requirePermission('appointment.manage');
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível identificar a clínica do usuário logado.',
    };
  }

  const parsedData = upsertAppointmentSchema.safeParse(input);

  if (!parsedData.success) {
    const { fieldErrors } = parsedData.error.flatten();

    return {
      success: false,
      message: 'Verifique os dados informados e tente novamente.',
      fieldErrors,
    };
  }

  const data = parsedData.data;
  const normalizedAppointmentDate = normalizeAppointmentDate(data.appointmentDate);

  try {
    const session = await getServerSession();
    const createdByUserId =
      typeof session?.user?.id === 'string' ? session.user.id : null;

    const [doctorRecord, patientRecord] = await Promise.all([
      db.query.doctors.findFirst({
        where: and(eq(doctors.id, data.doctorId), eq(doctors.clinicId, clinicId)),
        columns: {
          id: true,
          isActive: true,
          name: true,
          consultationFee: true,
        },
        with: {
          availabilities: {
            columns: {
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      db.query.patients.findFirst({
        where: and(eq(patients.id, data.patientId), eq(patients.clinicId, clinicId)),
        columns: {
          id: true,
          isActive: true,
          name: true,
        },
      }),
    ]);

    if (!doctorRecord) {
      return {
        success: false,
        message: 'O médico selecionado não pertence à clínica atual.',
        fieldErrors: {
          doctorId: ['Selecione um médico válido da clínica atual.'],
        },
      };
    }

    if (!patientRecord) {
      return {
        success: false,
        message: 'O paciente selecionado não pertence à clínica atual.',
        fieldErrors: {
          patientId: ['Selecione um paciente válido da clínica atual.'],
        },
      };
    }

    if (!doctorRecord.isActive) {
      return {
        success: false,
        message: 'O médico selecionado está inativo e não pode receber novos agendamentos.',
        fieldErrors: {
          doctorId: ['Selecione um médico ativo para continuar.'],
        },
      };
    }

    if (!patientRecord.isActive) {
      return {
        success: false,
        message: 'O paciente selecionado está inativo e não pode ser usado em novos agendamentos.',
        fieldErrors: {
          patientId: ['Selecione um paciente ativo para continuar.'],
        },
      };
    }

    if (doctorRecord.availabilities.length === 0) {
      return {
        success: false,
        message: 'Este médico ainda não possui horários de atendimento configurados.',
        fieldErrors: {
          doctorId: ['Configure a disponibilidade do médico antes de agendar.'],
        },
      };
    }

    if (
      !isAppointmentWithinDoctorAvailability(
        normalizedAppointmentDate,
        doctorRecord.availabilities,
      )
    ) {
      return {
        success: false,
        message:
          'O horário escolhido está fora da disponibilidade configurada para o médico.',
        fieldErrors: {
          appointmentDate: [
            'Escolha um horário compatível com a agenda do médico.',
          ],
        },
      };
    }

    const baseConflictConditions = [
      eq(appointments.clinicId, clinicId),
      eq(appointments.appointmentDate, normalizedAppointmentDate),
      ne(appointments.status, 'cancelled' as const),
    ];

    if (data.id) {
      baseConflictConditions.push(ne(appointments.id, data.id));
    }

    const [doctorConflict, patientConflict] = await Promise.all([
      db.query.appointments.findFirst({
        where: and(
          ...baseConflictConditions,
          eq(appointments.doctorId, data.doctorId),
        ),
        columns: {
          id: true,
        },
      }),
      db.query.appointments.findFirst({
        where: and(
          ...baseConflictConditions,
          eq(appointments.patientId, data.patientId),
        ),
        columns: {
          id: true,
        },
      }),
    ]);

    if (doctorConflict) {
      return {
        success: false,
        message:
          'Já existe um agendamento ativo para esse médico no mesmo horário.',
        fieldErrors: {
          appointmentDate: ['Escolha outro horário para este médico.'],
          doctorId: ['Este médico já está ocupado no horário informado.'],
        },
      };
    }

    if (patientConflict) {
      return {
        success: false,
        message:
          'O paciente já possui outro agendamento ativo no mesmo horário.',
        fieldErrors: {
          appointmentDate: ['Escolha outro horário para este paciente.'],
          patientId: ['Este paciente já está ocupado no horário informado.'],
        },
      };
    }

    if (data.id) {
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          doctorId: data.doctorId,
          patientId: data.patientId,
          appointmentDate: normalizedAppointmentDate,
          status: data.status,
          reasonForVisit: data.reasonForVisit,
          notes: data.notes,
          updatedAt: new Date(),
        })
        .where(
          and(eq(appointments.id, data.id), eq(appointments.clinicId, clinicId)),
        )
        .returning({ id: appointments.id });

      if (!updatedAppointment) {
        return {
          success: false,
          message: 'Agendamento não encontrado para a clínica atual.',
        };
      }
    } else {
      await db.insert(appointments).values({
        clinicId,
        createdByUserId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        appointmentDate: normalizedAppointmentDate,
        status: data.status,
        reasonForVisit: data.reasonForVisit,
        notes: data.notes,
        appointmentFee: doctorRecord.consultationFee ?? null,
      });
    }

    revalidatePath('/appointments');

    return {
      success: true,
      message: data.id
        ? 'Agendamento atualizado com sucesso.'
        : 'Agendamento criado com sucesso.',
    };
  } catch (error) {
    const databaseError = error as { code?: string; constraint_name?: string };

    if (databaseError.code === '23505') {
      if (
        databaseError.constraint_name ===
        'appointments_doctor_date_active_unique'
      ) {
        return {
          success: false,
          message:
            'Outro agendamento ocupou esse horário para o médico enquanto a operação era processada.',
          fieldErrors: {
            appointmentDate: ['Escolha outro horário para este médico.'],
            doctorId: ['Este médico já está ocupado no horário informado.'],
          },
        };
      }

      if (
        databaseError.constraint_name ===
        'appointments_patient_date_active_unique'
      ) {
        return {
          success: false,
          message:
            'O paciente passou a ter outro agendamento ativo no mesmo horário durante a operação.',
          fieldErrors: {
            appointmentDate: ['Escolha outro horário para este paciente.'],
            patientId: ['Este paciente já está ocupado no horário informado.'],
          },
        };
      }
    }

    return {
      success: false,
      message: 'Não foi possível salvar o agendamento agora.',
    };
  }
}
