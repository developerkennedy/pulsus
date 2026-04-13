export type UserRole = 'admin' | 'receptionist' | 'doctor';

export function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'receptionist' || value === 'doctor';
}
