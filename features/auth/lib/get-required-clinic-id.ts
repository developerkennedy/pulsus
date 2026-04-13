import { getServerSession } from '@/features/auth/lib/get-server-session';

export async function getRequiredClinicId(): Promise<string> {
  const session = await getServerSession();
  const clinicId = session?.user?.clinicId ?? null;

  if (!clinicId || typeof clinicId !== 'string') {
    throw new Error('Usuário sem clínica vinculada.');
  }

  return clinicId;
}
