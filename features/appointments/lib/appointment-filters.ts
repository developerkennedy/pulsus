export const appointmentStatusFilterOptions = [
  { value: 'scheduled', label: 'Agendados' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'no-show', label: 'Não compareceu' },
  { value: 'all', label: 'Todos' },
] as const;

export type AppointmentStatusFilter =
  (typeof appointmentStatusFilterOptions)[number]['value'];

export function normalizeAppointmentStatusFilter(
  value?: string | string[],
): AppointmentStatusFilter {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue &&
    appointmentStatusFilterOptions.some(
      (option) => option.value === normalizedValue,
    )
  ) {
    return normalizedValue as AppointmentStatusFilter;
  }

  return 'scheduled';
}
