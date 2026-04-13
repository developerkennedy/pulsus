export const patientStatusFilterOptions = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'all', label: 'Todos' },
] as const;

export type PatientStatusFilter =
  (typeof patientStatusFilterOptions)[number]['value'];

export function normalizePatientStatusFilter(
  value?: string | string[],
): PatientStatusFilter {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue &&
    patientStatusFilterOptions.some((option) => option.value === normalizedValue)
  ) {
    return normalizedValue as PatientStatusFilter;
  }

  return 'active';
}
