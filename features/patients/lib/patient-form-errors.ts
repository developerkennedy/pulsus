import type {
  UpsertPatientFormState,
  UpsertPatientFormValues,
} from '@/features/patients/schemas/upsert-patient-schema';

export function getPatientFormFieldError(
  state: UpsertPatientFormState | null,
  fallbackError?: string,
  fieldName?: keyof UpsertPatientFormValues | 'id',
) {
  if (!fieldName) {
    return fallbackError;
  }

  const serverError = state?.fieldErrors?.[fieldName]?.[0];

  return fallbackError ?? serverError;
}
