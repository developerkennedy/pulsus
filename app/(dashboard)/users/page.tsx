import { and, count, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { getUserAccessContext } from '@/features/auth/lib/get-user-access-context';
import { hasPermission } from '@/features/auth/lib/permissions';
import { UsersPageContent } from '@/features/users/components/users-page-content';
import { normalizeUserStatusFilter } from '@/features/users/lib/user-filters';
import {
  mapDoctorRecordToUserDoctorOption,
  mapUserRecordToListItem,
} from '@/features/users/lib/user-mappers';
import {
  getUsersPaginationMeta,
  normalizeUserPage,
} from '@/features/users/lib/user-pagination';
import { db } from '@/lib/db';
import { doctors as doctorsTable, users as usersTable } from '@/lib/db/schema';

type UsersPageProps = {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[] }>;
};

export default async function UsersPage({
  searchParams,
}: UsersPageProps) {
  const accessContext = await getUserAccessContext();
  const clinicId = accessContext.clinicId;

  if (!hasPermission(accessContext.role, 'user.read')) {
    redirect('/');
  }

  const { status, page } = await searchParams;
  const currentFilter = normalizeUserStatusFilter(status);
  const requestedPage = normalizeUserPage(page);
  const statusWhereClause =
    currentFilter === 'all'
      ? undefined
      : eq(usersTable.isActive, currentFilter === 'active');
  const whereClause = statusWhereClause
    ? and(eq(usersTable.clinicId, clinicId), statusWhereClause)
    : eq(usersTable.clinicId, clinicId);

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(usersTable)
    .where(whereClause);

  const pagination = getUsersPaginationMeta(totalCount, requestedPage);

  const [userRecords, doctorRecords] = await Promise.all([
    db.query.users.findMany({
      where: whereClause,
      orderBy: (users, { asc }) => [asc(users.name)],
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
    }),
    db.query.doctors.findMany({
      where: eq(doctorsTable.clinicId, clinicId),
      columns: {
        id: true,
        name: true,
        isActive: true,
        userId: true,
      },
      with: {
        speciality: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (doctors, { asc }) => [asc(doctors.name)],
    }),
  ]);

  const linkedDoctorByUserId = new Map(
    doctorRecords
      .filter((doctor) => doctor.userId)
      .map((doctor) => [
        doctor.userId as string,
        {
          id: doctor.id,
          name: doctor.name,
        },
      ]),
  );

  const users = userRecords.map((user) =>
    mapUserRecordToListItem(user, linkedDoctorByUserId.get(user.id) ?? null),
  );
  const doctorOptions = doctorRecords.map(mapDoctorRecordToUserDoctorOption);

  return (
    <UsersPageContent
      users={users}
      doctorOptions={doctorOptions}
      currentFilter={currentFilter}
      pagination={pagination}
    />
  );
}
