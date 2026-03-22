import type { InferSelectModel } from 'drizzle-orm';

import { doctorAvailabilities, doctors, specialities } from '@/lib/db/schema';
import {
  formatAvailabilitySummary,
  type DoctorListItem,
} from '@/features/doctors/lib/doctor-view-model';
import type { UpsertDoctorData } from '@/features/doctors/schemas/upsert-doctor-schema';

type DoctorRecord = InferSelectModel<typeof doctors>;
type DoctorAvailabilityRecord = InferSelectModel<typeof doctorAvailabilities>;
type SpecialityRecord = InferSelectModel<typeof specialities>;

export type DoctorWithRelations = DoctorRecord & {
  availabilities: DoctorAvailabilityRecord[];
  speciality: SpecialityRecord | null;
};

export function mapDoctorToFormValues(
  doctor: DoctorListItem | null,
): Partial<UpsertDoctorData> | undefined {
  if (!doctor) {
    return undefined;
  }

  return {
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    specialityId: doctor.specialityId,
    license: doctor.license,
    phone: doctor.phone,
    bio: doctor.bio ?? '',
    consultationFee: doctor.consultationFee,
    availabilities: doctor.availabilities,
    isActive: doctor.isActive ?? true,
  };
}

export function mapDoctorRecordToListItem(
  doctor: DoctorWithRelations,
): DoctorListItem {
  const availabilitySummary = formatAvailabilitySummary(
    doctor.availabilities.map((availability) => ({
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
    })),
  );

  return {
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    specialityId: doctor.specialityId,
    license: doctor.license,
    phone: doctor.phone ?? '',
    specialty: doctor.speciality?.name ?? 'Especialidade não definida',
    schedule: availabilitySummary.schedule,
    hours: availabilitySummary.hours,
    consultationFee: doctor.consultationFee ?? 0,
    bio: doctor.bio ?? undefined,
    availabilities: doctor.availabilities.map((availability) => ({
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
    })),
    isActive: doctor.isActive,
  };
}
