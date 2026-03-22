import { DoctorsPageContent } from '@/features/doctors/components/doctors-page-content';
import { mapDoctorRecordToListItem } from '@/features/doctors/lib/doctor-mappers';
import { db } from '@/lib/db';

export default async function DoctorsPage() {
  const [doctorRecords, specialities] = await Promise.all([
    db.query.doctors.findMany({
      with: {
        availabilities: true,
        speciality: true,
      },
      orderBy: (doctors, { asc }) => [asc(doctors.name)],
    }),
    db.query.specialities.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (specialities, { asc }) => [asc(specialities.name)],
    }),
  ]);

  const doctors = doctorRecords.map(mapDoctorRecordToListItem);

  return (
    <DoctorsPageContent
      doctors={doctors}
      specialities={specialities}
    />
  );
}
