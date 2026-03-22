import {
  doctorWeekdayOptions,
  type UpsertDoctorData,
} from '@/features/doctors/schemas/upsert-doctor-schema';

export type DoctorListItem = {
  id: number;
  name: string;
  email: string;
  specialityId: number;
  license: string;
  phone: string;
  specialty: string;
  schedule: string;
  hours: string;
  consultationFee: number;
  bio?: string;
  availabilities: UpsertDoctorData['availabilities'];
  isActive?: boolean;
};

export type DoctorSpecialityOption = {
  id: number;
  name: string;
};

export function formatAvailabilitySummary(
  availabilities: UpsertDoctorData['availabilities'],
) {
  if (availabilities.length === 0) {
    return {
      schedule: 'Sem dias configurados',
      hours: 'Defina os horários',
    };
  }

  const orderedAvailabilities = [...availabilities].sort(
    (left, right) =>
      doctorWeekdayOptions.findIndex((day) => day.value === left.dayOfWeek) -
      doctorWeekdayOptions.findIndex((day) => day.value === right.dayOfWeek),
  );

  const labels = orderedAvailabilities.map((availability) => {
    const day = doctorWeekdayOptions.find(
      (weekday) => weekday.value === availability.dayOfWeek,
    );

    return day?.shortLabel ?? availability.dayOfWeek;
  });

  const firstAvailability = orderedAvailabilities[0];
  const hasSameTimeRange = orderedAvailabilities.every(
    (availability) =>
      availability.startTime === firstAvailability.startTime &&
      availability.endTime === firstAvailability.endTime,
  );

  return {
    schedule: labels.join(', '),
    hours: hasSameTimeRange
      ? `${firstAvailability.startTime} às ${firstAvailability.endTime}`
      : 'Horários variados',
  };
}
