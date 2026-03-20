import { db } from '@/lib/db';
import {
  appointments,
  NewAppointment,
  doctors,
  patients,
  users,
  specialities,
} from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Get all appointments for a clinic
 */
export async function getAppointmentsByClinic(userId: number) {
  return db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status,
      notes: appointments.notes,
      reasonForVisit: appointments.reasonForVisit,
      createdAt: appointments.createdAt,
      doctor: {
        id: doctors.id,
        name: users.name,
        license: doctors.license,
        speciality: specialities.name,
      },
      patient: {
        id: patients.id,
        name: users.name,
        phone: patients.phone,
      },
    })
    .from(appointments)
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(specialities, eq(doctors.specialityId, specialities.id))
    .innerJoin(users, eq(appointments.userId, users.id))
    .where(eq(appointments.userId, userId));
}

/**
 * Get appointments for a specific doctor
 */
export async function getAppointmentsByDoctor(doctorId: number) {
  return db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status,
      notes: appointments.notes,
      reasonForVisit: appointments.reasonForVisit,
      createdAt: appointments.createdAt,
      patient: {
        id: patients.id,
        name: users.name,
        phone: patients.phone,
        cpf: patients.cpf,
      },
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(patients.userId, users.id))
    .where(eq(appointments.doctorId, doctorId));
}

/**
 * Get appointments for a specific patient
 */
export async function getAppointmentsByPatient(patientId: number) {
  return db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status,
      notes: appointments.notes,
      reasonForVisit: appointments.reasonForVisit,
      createdAt: appointments.createdAt,
      doctor: {
        id: doctors.id,
        name: users.name,
        license: doctors.license,
        speciality: specialities.name,
      },
    })
    .from(appointments)
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .innerJoin(users, eq(doctors.userId, users.id))
    .innerJoin(specialities, eq(doctors.specialityId, specialities.id))
    .where(eq(appointments.patientId, patientId));
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: number) {
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Get appointments between dates
 */
export async function getAppointmentsBetweenDates(
  startDate: Date,
  endDate: Date,
  userId: number,
) {
  return db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status,
      doctor: {
        id: doctors.id,
        name: users.name,
      },
      patient: {
        id: patients.id,
        name: users.name,
        phone: patients.phone,
      },
    })
    .from(appointments)
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate),
      ),
    );
}

/**
 * Create or update appointment (upsert)
 * Updates if appointment with same doctor, patient, and date exists
 * Otherwise creates new appointment
 */
export async function upsertAppointment(data: NewAppointment) {
  return db
    .insert(appointments)
    .values(data)
    .onConflictDoUpdate({
      target: [
        appointments.doctorId,
        appointments.patientId,
        appointments.appointmentDate,
      ],
      set: {
        status: data.status,
        notes: data.notes,
        reasonForVisit: data.reasonForVisit,
        updatedAt: new Date(),
      },
    })
    .returning();
}

/**
 * Update appointment by ID (direct update)
 */
export async function updateAppointmentById(
  id: number,
  data: Partial<NewAppointment>,
) {
  return db
    .update(appointments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(id: number, notes?: string) {
  return db
    .update(appointments)
    .set({
      status: 'cancelled',
      notes: notes || appointments.notes,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, id))
    .returning();
}

/**
 * Get upcoming appointments for a clinic
 */
export async function getUpcomingAppointments(userId: number) {
  const now = new Date();
  return db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status,
      doctor: {
        id: doctors.id,
        name: users.name,
      },
      patient: {
        id: patients.id,
        name: users.name,
      },
    })
    .from(appointments)
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.appointmentDate, now),
      ),
    );
}
