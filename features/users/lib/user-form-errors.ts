import type { UpsertUserFormState } from '@/features/users/schemas/upsert-user-schema';

export function getUserFormFieldError(
  state: UpsertUserFormState | null,
  fallbackError?: string,
  fieldName?: string,
) {
  if (!fieldName) {
    return fallbackError;
  }

  const serverError = state?.fieldErrors?.[fieldName]?.[0];

  return fallbackError ?? serverError;
}
