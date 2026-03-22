import { PatientsPageContent } from '@/features/patients/components/patients-page-content';
import { mapPatientRecordToListItem } from '@/features/patients/lib/patient-view-model';
import { db } from '@/lib/db';

export default async function PatientsPage() {
  const patientRecords = await db.query.patients.findMany({
    with: {
      user: true,
    },
    orderBy: (patients, { desc }) => [desc(patients.createdAt)],
  });

  const patients = patientRecords.map(mapPatientRecordToListItem);

  return <PatientsPageContent patients={patients} />;
}
