import type { InferSelectModel } from 'drizzle-orm';

import { users } from '@/lib/db/schema';
import { isUserRole } from '@/features/auth/lib/user-role';
import {
  getRoleLabel,
  type UserListItem,
  type UserDoctorOption,
} from '@/features/users/lib/user-view-model';
import type { UpdateUserFormValues } from '@/features/users/schemas/upsert-user-schema';

type UserRecord = InferSelectModel<typeof users>;

type LinkedDoctorSummary = {
  id: string;
  name: string;
} | null;

export function mapUserRecordToListItem(
  user: UserRecord,
  linkedDoctor: LinkedDoctorSummary = null,
): UserListItem {
  const role = isUserRole(user.role) ? user.role : 'receptionist';

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    roleLabel: getRoleLabel(role),
    phone: user.phone ?? '',
    isActive: user.isActive,
    doctorId: linkedDoctor?.id ?? null,
    doctorName: linkedDoctor?.name ?? null,
  };
}

export function mapUserToFormValues(
  user: UserListItem | null,
): Partial<UpdateUserFormValues> | undefined {
  if (!user) {
    return undefined;
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    doctorId: user.doctorId ?? '',
    phone: user.phone,
    isActive: user.isActive,
  };
}

export function mapDoctorRecordToUserDoctorOption(doctor: {
  id: string;
  name: string;
  isActive: boolean;
  userId: string | null;
  speciality: { name: string } | null;
}): UserDoctorOption {
  return {
    id: doctor.id,
    name: doctor.name,
    specialityName: doctor.speciality?.name ?? 'Especialidade não informada',
    isActive: doctor.isActive,
    linkedUserId: doctor.userId,
  };
}
