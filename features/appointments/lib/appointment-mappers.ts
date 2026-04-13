import {
  formatAppointmentDate,
  formatAppointmentTime,
  toDateTimeLocalValue,
} from '@/features/appointments/lib/appointment-formatters';
import type {
  AppointmentDoctorOption,
  AppointmentFormInitialData,
  AppointmentListItem,
  AppointmentRecord,
} from '@/features/appointments/lib/appointment-view-model';

export function mapAppointmentRecordToListItem(
  appointment: AppointmentRecord,
): AppointmentListItem {
  return {
    id: appointment.id,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctor?.name ?? 'Médico não encontrado',
    specialityName:
      appointment.doctor?.speciality?.name ?? 'Especialidade não informada',
    patientId: appointment.patientId,
    patientName: appointment.patient?.name ?? 'Paciente não encontrado',
    appointmentDate: toDateTimeLocalValue(appointment.appointmentDate),
    dateLabel: formatAppointmentDate(appointment.appointmentDate),
    timeLabel: formatAppointmentTime(appointment.appointmentDate),
    status: appointment.status,
    reasonForVisit: appointment.reasonForVisit ?? 'Não informado',
    notes: appointment.notes ?? '',
    createdByName: appointment.createdByUser?.name ?? 'Não informado',
    appointmentFee: appointment.appointmentFee ?? null,
  };
}

export function mapAppointmentToFormValues(
  appointment: AppointmentListItem | null,
): AppointmentFormInitialData | undefined {
  if (!appointment) {
    return undefined;
  }

  return {
    id: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    appointmentDate: appointment.appointmentDate,
    status: appointment.status,
    reasonForVisit:
      appointment.reasonForVisit === 'Não informado'
        ? ''
        : appointment.reasonForVisit,
    notes: appointment.notes,
  };
}

export function mapDoctorOptionLabel(option: AppointmentDoctorOption) {
  return `${option.name} - ${option.specialityName}`;
}
