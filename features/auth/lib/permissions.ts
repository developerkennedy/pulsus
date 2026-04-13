import type { UserRole } from '@/features/auth/lib/user-role';

export type AppPermission =
  | 'dashboard.read'
  | 'billing.read'
  | 'doctor.read'
  | 'doctor.manage'
  | 'patient.read'
  | 'patient.manage'
  | 'appointment.read'
  | 'appointment.manage'
  | 'user.read'
  | 'user.manage';

export const appPermissionMatrix = {
  admin: [
    'dashboard.read',
    'billing.read',
    'doctor.read',
    'doctor.manage',
    'patient.read',
    'patient.manage',
    'appointment.read',
    'appointment.manage',
    'user.read',
    'user.manage',
  ],
  receptionist: [
    'dashboard.read',
    'doctor.read',
    'patient.read',
    'patient.manage',
    'appointment.read',
    'appointment.manage',
  ],
  doctor: ['doctor.read', 'patient.read', 'appointment.read'],
} as const satisfies Record<UserRole, readonly AppPermission[]>;

export function hasPermission(role: UserRole, permission: AppPermission) {
  return (appPermissionMatrix[role] as readonly AppPermission[]).includes(
    permission,
  );
}


