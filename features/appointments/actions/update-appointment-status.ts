'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { requirePermission } from '@/features/auth/lib/require-permission';
import { isValidUuid } from '@/lib/is-valid-uuid';
import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
import type { UpsertAppointmentStatus } from '@/features/appointments/schemas/upsert-appointment-schema';

type UpdateAppointmentStatusState = {
  success: boolean;
  message: string;
};

const allowedTransitions: Partial<
  Record<UpsertAppointmentStatus, UpsertAppointmentStatus[]>
> = {
  scheduled: ['completed', 'cancelled', 'no-show'],
};

export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: UpsertAppointmentStatus,
): Promise<UpdateAppointmentStatusState> {
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

  if (!isValidUuid(appointmentId)) {
    return {
      success: false,
      message: 'Agendamento inválido.',
    };
  }

  try {
    const existing = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.clinicId, clinicId),
      ),
      columns: { id: true, status: true },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Agendamento não encontrado.',
      };
    }

    const allowed = allowedTransitions[existing.status] ?? [];

    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        message: `Não é possível alterar o status de "${existing.status}" para "${newStatus}".`,
      };
    }

    await db
      .update(appointments)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.clinicId, clinicId),
        ),
      );

    revalidatePath('/appointments');

    const labels: Record<UpsertAppointmentStatus, string> = {
      scheduled: 'Agendado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      'no-show': 'Não compareceu',
    };

    return {
      success: true,
      message: `Agendamento marcado como "${labels[newStatus]}" com sucesso.`,
    };
  } catch {
    return {
      success: false,
      message: 'Não foi possível atualizar o status do agendamento.',
    };
  }
}
