import type {
  UpsertAppointmentFormValues,
  UpsertAppointmentStatus,
} from '@/features/appointments/schemas/upsert-appointment-schema';

export type AppointmentListItem = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialityName: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  dateLabel: string;
  timeLabel: string;
  status: UpsertAppointmentStatus;
  reasonForVisit: string;
  notes: string;
  createdByName: string;
  appointmentFee: number | null;
};

export type AppointmentDoctorOption = {
  id: string;
  name: string;
  specialityName: string;
};

export type AppointmentPatientOption = {
  id: string;
  name: string;
};

export type AppointmentRecord = {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentDate: Date;
  status: UpsertAppointmentStatus;
  notes: string | null;
  reasonForVisit: string | null;
  appointmentFee: number | null;
  doctor: {
    id: string;
    name: string;
    speciality: {
      name: string;
    } | null;
  } | null;
  patient: {
    id: string;
    name: string;
  } | null;
  createdByUser: {
    name: string;
  } | null;
};

export type AppointmentFormInitialData = Partial<UpsertAppointmentFormValues>;
