import type { InferSelectModel } from 'drizzle-orm';

import { decrypt } from '@/lib/crypto';
import { patients } from '@/lib/db/schema';

type PatientRecord = InferSelectModel<typeof patients>;

export type PatientListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  genderValue: 'female' | 'male' | 'other';
  cpf: string;
  dateOfBirth: string;
  emergencyContact: string;
  emergencyPhone: string;
  isActive: boolean;
};

const genderLabelMap: Record<string, string> = {
  M: 'Masculino',
  F: 'Feminino',
  male: 'Masculino',
  female: 'Feminino',
  masculino: 'Masculino',
  feminino: 'Feminino',
  other: 'Outro',
  outro: 'Outro',
};

export function mapPatientRecordToListItem(
  patient: PatientRecord,
): PatientListItem {
  const normalizedGender = patient.gender?.trim().toLowerCase();
  const genderValue =
    normalizedGender === 'm' || normalizedGender === 'male' || normalizedGender === 'masculino'
      ? 'male'
      : normalizedGender === 'f' ||
          normalizedGender === 'female' ||
          normalizedGender === 'feminino'
        ? 'female'
        : 'other';

  return {
    id: patient.id,
    name: patient.name,
    email: patient.email ?? 'E-mail não informado',
    phone: patient.phone ?? 'Não informado',
    genderValue,
    cpf: patient.cpf.includes(':') ? decrypt(patient.cpf) : patient.cpf,
    dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
    emergencyContact: patient.emergencyContact ?? '',
    emergencyPhone: patient.emergencyPhone ?? '',
    isActive: patient.isActive,
    gender: normalizedGender
      ? genderLabelMap[normalizedGender] ?? patient.gender ?? 'Não informado'
      : 'Não informado',
  };
}
