export const userStatusFilterOptions = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'all', label: 'Todos' },
] as const;

export type UserStatusFilter =
  (typeof userStatusFilterOptions)[number]['value'];

export function normalizeUserStatusFilter(
  value?: string | string[],
): UserStatusFilter {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue &&
    userStatusFilterOptions.some((option) => option.value === normalizedValue)
  ) {
    return normalizedValue as UserStatusFilter;
  }

  return 'active';
}
