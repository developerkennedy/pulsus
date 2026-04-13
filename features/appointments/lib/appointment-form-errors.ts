type AppointmentFormState = {
  fieldErrors?: Record<string, string[] | undefined>;
};

export function getAppointmentFormFieldError(
  formState: AppointmentFormState | null,
  clientError: string | undefined,
  fieldName: string,
) {
  return clientError ?? formState?.fieldErrors?.[fieldName]?.[0];
}
