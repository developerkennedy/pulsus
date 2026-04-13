import { cache } from 'react';
import { and, eq } from 'drizzle-orm';

import { getServerSession } from '@/features/auth/lib/get-server-session';
import { isUserRole, type UserRole } from '@/features/auth/lib/user-role';
import { db } from '@/lib/db';
import { doctors } from '@/lib/db/schema';

export type UserAccessContext = {
  userId: string;
  clinicId: string;
  role: UserRole;
  linkedDoctorId: string | null;
};

export const getUserAccessContext = cache(async (): Promise<UserAccessContext> => {
  const session = await getServerSession();
  const userId = session?.user?.id ?? null;
  const clinicId = session?.user?.clinicId ?? null;
  const rawRole = session?.user?.role;

  if (!userId || typeof userId !== 'string') {
    throw new Error('Usuário não autenticado.');
  }

  if (!clinicId || typeof clinicId !== 'string') {
    throw new Error('Usuário sem clínica vinculada.');
  }

  if (!isUserRole(rawRole)) {
    throw new Error('Cargo inválido para o usuário autenticado.');
  }

  if (rawRole !== 'doctor') {
    return {
      userId,
      clinicId,
      role: rawRole,
      linkedDoctorId: null,
    };
  }

  const linkedDoctor = await db.query.doctors.findFirst({
    where: and(eq(doctors.userId, userId), eq(doctors.clinicId, clinicId)),
    columns: {
      id: true,
    },
  });

  return {
    userId,
    clinicId,
    role: rawRole,
    linkedDoctorId: linkedDoctor?.id ?? null,
  };
});
