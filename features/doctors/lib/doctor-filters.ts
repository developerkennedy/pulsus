export const doctorStatusFilterOptions = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'all', label: 'Todos' },
] as const;

export type DoctorStatusFilter =
  (typeof doctorStatusFilterOptions)[number]['value'];

export function normalizeDoctorStatusFilter(
  value?: string | string[],
): DoctorStatusFilter {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue &&
    doctorStatusFilterOptions.some((option) => option.value === normalizedValue)
  ) {
    return normalizedValue as DoctorStatusFilter;
  }

  return 'active';
}
