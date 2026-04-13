import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

const weekdayByDateIndex = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type DoctorAvailabilityWindow = {
  dayOfWeek: (typeof weekdayByDateIndex)[number];
  startTime: string;
  endTime: string;
};

export type DoctorScheduleSlot = {
  value: string;
  label: string;
  isBooked: boolean;
};

export type DoctorScheduleDay = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isSelectable: boolean;
  isFullyBooked: boolean;
  availableSlotCount: number;
};

export type DoctorScheduleSnapshot = {
  month: string;
  monthLabel: string;
  days: DoctorScheduleDay[];
  slotsByDate: Record<string, DoctorScheduleSlot[]>;
  hasAvailability: boolean;
};

const APPOINTMENT_SLOT_INTERVAL_MINUTES = 30;

export function formatDateKey(date: Date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export function combineDateAndTime(dateKey: string, time: string) {
  return `${dateKey}T${time}`;
}

export function formatMonthKey(date: Date) {
  return dayjs(date).format('YYYY-MM');
}

export function parseMonthKey(month: string) {
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(month);

  if (!monthMatch) {
    return null;
  }

  const [, yearValue, monthValue] = monthMatch;
  const year = Number(yearValue);
  const monthIndex = Number(monthValue);

  if (monthIndex < 1 || monthIndex > 12) {
    return null;
  }

  return dayjs(new Date(year, monthIndex - 1, 1)).startOf('month').toDate();
}

export function getTodayStart() {
  return dayjs().startOf('day').toDate();
}

export function addMonths(date: Date, amount: number) {
  return dayjs(date).add(amount, 'month').startOf('month').toDate();
}

function getCalendarGridStart(monthStart: Date) {
  return dayjs(monthStart).startOf('month').subtract(dayjs(monthStart).day(), 'day');
}

function getCalendarGridDates(monthStart: Date) {
  const firstCellDate = getCalendarGridStart(monthStart);

  return Array.from({ length: 42 }, (_, index) =>
    firstCellDate.add(index, 'day').toDate(),
  );
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  return dayjs()
    .startOf('day')
    .add(totalMinutes, 'minute')
    .format('HH:mm');
}

export function getScheduleMonthLabel(monthStart: Date) {
  return dayjs(monthStart).locale('pt-br').format('MMMM [de] YYYY');
}

export function getDefaultScheduleMonth() {
  return formatMonthKey(getTodayStart());
}

export function getSlotDateTimeKey(date: Date) {
  return combineDateAndTime(formatDateKey(date), getAppointmentTime(date));
}

export function normalizeAppointmentDate(date: Date) {
  return dayjs(date).second(0).millisecond(0).toDate();
}

export function getAppointmentWeekday(date: Date) {
  return weekdayByDateIndex[dayjs(date).day()];
}

export function getAppointmentTime(date: Date) {
  return dayjs(date).format('HH:mm');
}

export function isAppointmentWithinDoctorAvailability(
  appointmentDate: Date,
  availabilities: DoctorAvailabilityWindow[],
) {
  const appointmentWeekday = getAppointmentWeekday(appointmentDate);
  const appointmentTime = getAppointmentTime(appointmentDate);

  return availabilities.some(
    (availability) =>
      availability.dayOfWeek === appointmentWeekday &&
      appointmentTime >= availability.startTime &&
      appointmentTime < availability.endTime,
  );
}

export function buildDoctorScheduleSnapshot({
  month,
  availabilities,
  bookedAppointmentDates,
}: {
  month: string;
  availabilities: DoctorAvailabilityWindow[];
  bookedAppointmentDates: Date[];
}): DoctorScheduleSnapshot {
  const monthStart = parseMonthKey(month);

  if (!monthStart) {
    throw new Error('Mês inválido para montar a agenda do médico.');
  }

  const today = getTodayStart();
  const bookedSlots = new Set(
    bookedAppointmentDates.map((appointmentDate) => {
      const normalizedDate = normalizeAppointmentDate(appointmentDate);

      return combineDateAndTime(
        formatDateKey(normalizedDate),
        getAppointmentTime(normalizedDate),
      );
    }),
  );

  const calendarDates = getCalendarGridDates(monthStart);
  const slotsByDate: Record<string, DoctorScheduleSlot[]> = {};

  const days = calendarDates.map((date) => {
    const normalizedDate = normalizeAppointmentDate(date);
    const dateKey = formatDateKey(normalizedDate);
    const weekday = getAppointmentWeekday(normalizedDate);
    const dayAvailabilities = availabilities.filter(
      (availability) => availability.dayOfWeek === weekday,
    );
    const isPast = dayjs(normalizedDate).isBefore(today);
    const daySlots = dayAvailabilities.flatMap((availability) => {
      const startMinutes = timeToMinutes(availability.startTime);
      const endMinutes = timeToMinutes(availability.endTime);
      const slots: DoctorScheduleSlot[] = [];

      for (
        let currentMinutes = startMinutes;
        currentMinutes < endMinutes;
        currentMinutes += APPOINTMENT_SLOT_INTERVAL_MINUTES
      ) {
        const timeLabel = minutesToTime(currentMinutes);
        const slotValue = combineDateAndTime(dateKey, timeLabel);

        slots.push({
          value: slotValue,
          label: timeLabel,
          isBooked: bookedSlots.has(slotValue),
        });
      }

      return slots;
    });

    slotsByDate[dateKey] = daySlots;

    const availableSlotCount = isPast
      ? 0
      : daySlots.filter((slot) => !slot.isBooked).length;
    const hasConfiguredSlots = daySlots.length > 0;

    return {
      date: dateKey,
      dayNumber: dayjs(normalizedDate).date(),
      isCurrentMonth:
        dayjs(normalizedDate).month() === dayjs(monthStart).month(),
      isPast,
      isSelectable: hasConfiguredSlots && !isPast && availableSlotCount > 0,
      isFullyBooked: hasConfiguredSlots && !isPast && availableSlotCount === 0,
      availableSlotCount,
    };
  });

  return {
    month,
    monthLabel: getScheduleMonthLabel(monthStart),
    days,
    slotsByDate,
    hasAvailability: availabilities.length > 0,
  };
}
