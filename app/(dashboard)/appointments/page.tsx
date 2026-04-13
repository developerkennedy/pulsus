import { and, count, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { getUserAccessContext } from '@/features/auth/lib/get-user-access-context';
import { hasPermission } from '@/features/auth/lib/permissions';
import { AppointmentsPageContent } from '@/features/appointments/components/appointments-page-content';
import { normalizeAppointmentStatusFilter } from '@/features/appointments/lib/appointment-filters';
import { mapAppointmentRecordToListItem } from '@/features/appointments/lib/appointment-mappers';
import {
  getAppointmentsPaginationMeta,
  normalizeAppointmentPage,
} from '@/features/appointments/lib/appointment-pagination';
import { db } from '@/lib/db';
import {
  appointments as appointmentsTable,
  doctors as doctorsTable,
  patients as patientsTable,
} from '@/lib/db/schema';

type AppointmentsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    page?: string | string[];
  }>;
};

export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const accessContext = await getUserAccessContext();

  if (!hasPermission(accessContext.role, 'appointment.read')) {
    redirect('/');
  }

  const { status, page } = await searchParams;
  const currentFilter = normalizeAppointmentStatusFilter(status);
  const requestedPage = normalizeAppointmentPage(page);
  const statusWhereClause =
    currentFilter === 'all'
      ? undefined
      : eq(appointmentsTable.status, currentFilter);
  const baseWhereClause =
    accessContext.role === 'doctor'
      ? and(
          eq(appointmentsTable.clinicId, accessContext.clinicId),
          eq(
            appointmentsTable.doctorId,
            accessContext.linkedDoctorId ??
              '00000000-0000-0000-0000-000000000000',
          ),
        )
      : eq(appointmentsTable.clinicId, accessContext.clinicId);
  const whereClause = statusWhereClause
    ? and(baseWhereClause, statusWhereClause)
    : baseWhereClause;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(appointmentsTable)
    .where(whereClause);

  const pagination = getAppointmentsPaginationMeta(totalCount, requestedPage);

  const [appointmentRecords, doctorRecords, patientRecords] = await Promise.all([
    db.query.appointments.findMany({
      where: whereClause,
      with: {
        doctor: {
          columns: {
            id: true,
            name: true,
          },
          with: {
            speciality: {
              columns: {
                name: true,
              },
            },
          },
        },
        patient: {
          columns: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (appointments, { desc }) => [desc(appointments.appointmentDate)],
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
    }),
    hasPermission(accessContext.role, 'appointment.manage')
      ? db.query.doctors.findMany({
          where: and(
            eq(doctorsTable.clinicId, accessContext.clinicId),
            eq(doctorsTable.isActive, true),
          ),
          columns: {
            id: true,
            name: true,
          },
          with: {
            speciality: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: (doctors, { asc }) => [asc(doctors.name)],
        })
      : Promise.resolve([]),
    hasPermission(accessContext.role, 'appointment.manage')
      ? db.query.patients.findMany({
          where: and(
            eq(patientsTable.clinicId, accessContext.clinicId),
            eq(patientsTable.isActive, true),
          ),
          columns: {
            id: true,
            name: true,
          },
          orderBy: (patients, { asc }) => [asc(patients.name)],
        })
      : Promise.resolve([]),
  ]);

  const appointments = appointmentRecords.map(mapAppointmentRecordToListItem);
  const doctors = doctorRecords.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialityName: doctor.speciality?.name ?? 'Especialidade não informada',
  }));
  const patients = patientRecords.map((patient) => ({
    id: patient.id,
    name: patient.name,
  }));

  return (
    <AppointmentsPageContent
      appointments={appointments}
      doctors={doctors}
      patients={patients}
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
