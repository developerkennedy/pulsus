import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  varchar,
  unique,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Enums
 */
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no-show',
]);

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'receptionist',
  'doctor',
]);

export const availabilityDayOfWeekEnum = pgEnum('availability_day_of_week', [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

/**
 * Tables
 */

/**
 * Users table - Clinics/Users of the system
 */
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    password: text('password').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull().default('receptionist'),
    clinicName: varchar('clinic_name', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    emailUnique: unique().on(t.email),
  }),
);

/**
 * Specialities table - Medical specialties
 */
export const specialities = pgTable('specialities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Doctors table
 */
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  specialityId: integer('speciality_id')
    .notNull()
    .references(() => specialities.id),
  license: varchar('license', { length: 50 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  bio: text('bio'),
  consultationFee: integer('consultation_fee'), // in cents (e.g., 25000 = R$ 250.00)
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const doctorAvailabilities = pgTable('doctor_availabilities', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  dayOfWeek: availabilityDayOfWeekEnum('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Patients table
 */
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  cpf: varchar('cpf', { length: 11 }).notNull().unique(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  gender: varchar('gender', { length: 10 }), // 'M', 'F', 'Other'
  phone: varchar('phone', { length: 20 }),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  emergencyPhone: varchar('emergency_phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Appointments table
 */
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  appointmentDate: timestamp('appointment_date').notNull(),
  status: appointmentStatusEnum('status').notNull().default('scheduled'),
  notes: text('notes'),
  reasonForVisit: varchar('reason_for_visit', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations
 */

export const usersRelations = relations(users, ({ many }) => ({
  patients: many(patients),
  appointments: many(appointments),
}));

export const specialitiesRelations = relations(specialities, ({ many }) => ({
  doctors: many(doctors),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  speciality: one(specialities, {
    fields: [doctors.specialityId],
    references: [specialities.id],
  }),
  appointments: many(appointments),
  availabilities: many(doctorAvailabilities),
}));

export const doctorAvailabilitiesRelations = relations(
  doctorAvailabilities,
  ({ one }) => ({
    doctor: one(doctors, {
      fields: [doctorAvailabilities.doctorId],
      references: [doctors.id],
    }),
  }),
);

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  clinic: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
}));

