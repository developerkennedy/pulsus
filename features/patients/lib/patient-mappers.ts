import type { PatientListItem } from '@/features/patients/lib/patient-view-model';
import type { UpsertPatientFormValues } from '@/features/patients/schemas/upsert-patient-schema';

export function mapPatientToFormValues(
  patient?: PatientListItem | null,
): Partial<UpsertPatientFormValues> | undefined {
  if (!patient) {
    return undefined;
  }

  return {
    id: patient.id,
    name: patient.name,
    email: patient.email === 'E-mail não informado' ? '' : patient.email,
    cpf: patient.cpf,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.genderValue,
    phone: patient.phone === 'Não informado' ? '' : patient.phone,
    emergencyContact: patient.emergencyContact,
    emergencyPhone: patient.emergencyPhone,
    isActive: patient.isActive,
  };
}
