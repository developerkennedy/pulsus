import type {
  UpsertDoctorFormState,
  UpsertDoctorFormValues,
} from '@/features/doctors/schemas/upsert-doctor-schema';

export function getDoctorFormFieldError(
  state: UpsertDoctorFormState | null,
  fallbackError?: string,
  fieldName?: keyof UpsertDoctorFormValues | 'id' | 'availabilities',
) {
  if (!fieldName) {
    return fallbackError;
  }

  const serverError = state?.fieldErrors?.[fieldName]?.[0];

  return fallbackError ?? serverError;
}
