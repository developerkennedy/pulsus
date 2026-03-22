import type { InferSelectModel } from 'drizzle-orm';

import { patients, users } from '@/lib/db/schema';

type PatientRecord = InferSelectModel<typeof patients>;
type UserRecord = InferSelectModel<typeof users>;

export type PatientWithUser = PatientRecord & {
  user: UserRecord | null;
};

export type PatientListItem = {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
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
  patient: PatientWithUser,
): PatientListItem {
  const normalizedGender = patient.gender?.trim().toLowerCase();

  return {
    id: patient.id,
    name: patient.user?.name ?? 'Paciente sem nome',
    email: patient.user?.email ?? 'E-mail não informado',
    phone: patient.phone ?? patient.user?.phone ?? 'Não informado',
    gender: normalizedGender
      ? genderLabelMap[normalizedGender] ?? patient.gender ?? 'Não informado'
      : 'Não informado',
  };
}
