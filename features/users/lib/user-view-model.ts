import type { UserRole } from '@/features/auth/lib/user-role';

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  phone: string;
  isActive: boolean;
  doctorId: string | null;
  doctorName: string | null;
};

export type UserDoctorOption = {
  id: string;
  name: string;
  specialityName: string;
  isActive: boolean;
  linkedUserId: string | null;
};

const roleLabelMap: Record<UserRole, string> = {
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  doctor: 'Médico',
};

export function getRoleLabel(role: UserRole): string {
  return roleLabelMap[role] ?? role;
}
