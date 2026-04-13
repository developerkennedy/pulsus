import { and, count, eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { PatientsPageContent } from '@/features/patients/components/patients-page-content';
import { getUserAccessContext } from '@/features/auth/lib/get-user-access-context';
import { hasPermission } from '@/features/auth/lib/permissions';
import { normalizePatientStatusFilter } from '@/features/patients/lib/patient-filters';
import {
  getPatientsPaginationMeta,
  normalizePatientPage,
} from '@/features/patients/lib/patient-pagination';
import { mapPatientRecordToListItem } from '@/features/patients/lib/patient-view-model';
import { db } from '@/lib/db';
import {
  appointments as appointmentsTable,
  patients as patientsTable,
} from '@/lib/db/schema';

type PatientsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    page?: string | string[];
  }>;
};

const UNLINKED_DOCTOR_FALLBACK_ID = '00000000-0000-0000-0000-000000000000';

export default async function PatientsPage({
  searchParams,
}: PatientsPageProps) {
  const accessContext = await getUserAccessContext();

  if (!hasPermission(accessContext.role, 'patient.read')) {
    redirect('/');
  }

  const { status, page } = await searchParams;

  const currentFilter = normalizePatientStatusFilter(status);
  const requestedPage = normalizePatientPage(page);
  const statusWhereClause =
    currentFilter === 'all'
      ? undefined
      : eq(patientsTable.isActive, currentFilter === 'active');
  const doctorPatientIds =
    accessContext.role === 'doctor'
      ? db
          .selectDistinct({ patientId: appointmentsTable.patientId })
          .from(appointmentsTable)
          .where(
            and(
              eq(appointmentsTable.clinicId, accessContext.clinicId),
              eq(
                appointmentsTable.doctorId,
                accessContext.linkedDoctorId ?? UNLINKED_DOCTOR_FALLBACK_ID,
              ),
            ),
          )
      : null;
  const baseWhereClause =
    accessContext.role === 'doctor'
      ? and(
          eq(patientsTable.clinicId, accessContext.clinicId),
          inArray(patientsTable.id, doctorPatientIds!),
        )
      : eq(patientsTable.clinicId, accessContext.clinicId);
  const whereClause = statusWhereClause
    ? and(baseWhereClause, statusWhereClause)
    : baseWhereClause;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(patientsTable)
    .where(whereClause);

  const pagination = getPatientsPaginationMeta(totalCount, requestedPage);

  const patientRecords = await db.query.patients.findMany({
    where: whereClause,
    orderBy: (patients, { desc }) => [desc(patients.createdAt)],
    limit: pagination.pageSize,
    offset: (pagination.currentPage - 1) * pagination.pageSize,
  });

  const patientList = patientRecords.map(mapPatientRecordToListItem);

  return (
    <PatientsPageContent
      patients={patientList}
      currentFilter={currentFilter}
      pagination={pagination}
      userRole={accessContext.role}
      accessNotice={
        accessContext.role === 'doctor' && !accessContext.linkedDoctorId
          ? 'Sua conta de médico ainda não está vinculada a um cadastro de médico. Peça ao administrador da clínica para concluir esse vínculo.'
          : null
      }
    />
  );
}
