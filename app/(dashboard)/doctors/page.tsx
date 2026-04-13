import { and, count, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { getUserAccessContext } from '@/features/auth/lib/get-user-access-context';
import { hasPermission } from '@/features/auth/lib/permissions';
import { DoctorsPageContent } from '@/features/doctors/components/doctors-page-content';
import { normalizeDoctorStatusFilter } from '@/features/doctors/lib/doctor-filters';
import { mapDoctorRecordToListItem } from '@/features/doctors/lib/doctor-mappers';
import {
  getDoctorsPaginationMeta,
  normalizeDoctorPage,
} from '@/features/doctors/lib/doctor-pagination';
import { db } from '@/lib/db';
import { doctors as doctorsTable } from '@/lib/db/schema';

type DoctorsPageProps = {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[] }>;
};

export default async function DoctorsPage({
  searchParams,
}: DoctorsPageProps) {
  const accessContext = await getUserAccessContext();

  if (!hasPermission(accessContext.role, 'doctor.read')) {
    redirect('/');
  }

  const { status, page } = await searchParams;
  const currentFilter = normalizeDoctorStatusFilter(status);
  const requestedPage = normalizeDoctorPage(page);
  const statusWhereClause =
    currentFilter === 'all'
      ? undefined
      : eq(doctorsTable.isActive, currentFilter === 'active');
  const baseWhereClause =
    accessContext.role === 'doctor'
      ? and(
          eq(doctorsTable.clinicId, accessContext.clinicId),
          eq(doctorsTable.userId, accessContext.userId),
        )
      : eq(doctorsTable.clinicId, accessContext.clinicId);
  const whereClause = statusWhereClause
    ? and(baseWhereClause, statusWhereClause)
    : baseWhereClause;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(doctorsTable)
    .where(whereClause);

  const pagination = getDoctorsPaginationMeta(totalCount, requestedPage);

  const [doctorRecords, specialities] = await Promise.all([
    db.query.doctors.findMany({
      where: whereClause,
      with: {
        availabilities: true,
        speciality: true,
      },
      orderBy: (doctors, { asc }) => [asc(doctors.name)],
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
    }),
    hasPermission(accessContext.role, 'doctor.manage')
      ? db.query.specialities.findMany({
          columns: {
            id: true,
            name: true,
          },
          orderBy: (specialities, { asc }) => [asc(specialities.name)],
        })
      : Promise.resolve([]),
  ]);

  const doctors = doctorRecords.map(mapDoctorRecordToListItem);
  const accessNotice =
    accessContext.role === 'doctor' && !accessContext.linkedDoctorId
      ? 'Sua conta de médico ainda não está vinculada a um cadastro de médico. Peça ao administrador da clínica para concluir esse vínculo.'
      : null;

  return (
    <DoctorsPageContent
      doctors={doctors}
      specialities={specialities}
      currentFilter={currentFilter}
      pagination={pagination}
      userRole={accessContext.role}
      accessNotice={accessNotice}
    />
  );
}
