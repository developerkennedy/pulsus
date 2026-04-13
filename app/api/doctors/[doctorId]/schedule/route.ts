import { and, eq, gte, lt, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getRequiredClinicId } from '@/features/auth/lib/get-required-clinic-id';
import { isValidUuid } from '@/lib/is-valid-uuid';
import {
  addMonths,
  buildDoctorScheduleSnapshot,
  getDefaultScheduleMonth,
  parseMonthKey,
} from '@/features/appointments/lib/appointment-scheduling';
import { db } from '@/lib/db';
import { appointments, doctors } from '@/lib/db/schema';

type RouteContext = {
  params: Promise<{
    doctorId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  let clinicId: string;

  try {
    clinicId = await getRequiredClinicId();
  } catch {
    return NextResponse.json(
      { message: 'Sessão inválida para consultar a agenda do médico.' },
      { status: 401 },
    );
  }

  const { doctorId } = await context.params;

  if (!isValidUuid(doctorId)) {
    return NextResponse.json(
      { message: 'Médico inválido para consulta de agenda.' },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const requestedMonth = url.searchParams.get('month') ?? getDefaultScheduleMonth();
  const parsedMonth = parseMonthKey(requestedMonth);

  if (!parsedMonth) {
    return NextResponse.json(
      { message: 'Mês inválido para consulta da agenda.' },
      { status: 400 },
    );
  }

  const appointmentIdToIgnore = url.searchParams.get('appointmentId') || null;
  const nextMonth = addMonths(parsedMonth, 1);

  const doctorRecord = await db.query.doctors.findFirst({
    where: and(
      eq(doctors.id, doctorId),
      eq(doctors.clinicId, clinicId),
      eq(doctors.isActive, true),
    ),
    columns: {
      id: true,
    },
    with: {
      availabilities: {
        columns: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (!doctorRecord) {
    return NextResponse.json(
      { message: 'Médico não encontrado na clínica atual.' },
      { status: 404 },
    );
  }

  const appointmentConditions = [
    eq(appointments.clinicId, clinicId),
    eq(appointments.doctorId, doctorId),
    ne(appointments.status, 'cancelled'),
    gte(appointments.appointmentDate, parsedMonth),
    lt(appointments.appointmentDate, nextMonth),
  ];

  if (appointmentIdToIgnore) {
    appointmentConditions.push(ne(appointments.id, appointmentIdToIgnore));
  }

  const bookedAppointments = await db.query.appointments.findMany({
    where: and(...appointmentConditions),
    columns: {
      appointmentDate: true,
    },
    orderBy: (appointmentEntries, { asc }) => [
      asc(appointmentEntries.appointmentDate),
    ],
  });

  const snapshot = buildDoctorScheduleSnapshot({
    month: requestedMonth,
    availabilities: doctorRecord.availabilities,
    bookedAppointmentDates: bookedAppointments.map(
      (appointment) => appointment.appointmentDate,
    ),
  });

  return NextResponse.json(snapshot);
}
