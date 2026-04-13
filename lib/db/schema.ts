import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  boolean,
  varchar,
  unique,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

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


export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id').references(() => clinics.id, {
      onDelete: 'set null',
    }),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('receptionist'),
    phone: varchar('phone', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    emailUnique: unique().on(t.email),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    tokenUnique: uniqueIndex('sessions_token_unique').on(t.token),
    userIdIdx: index('sessions_user_id_idx').on(t.userId),
  }),
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index('accounts_user_id_idx').on(t.userId),
    providerAccountUnique: uniqueIndex('accounts_provider_account_unique').on(
      t.providerId,
      t.accountId,
    ),
  }),
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    identifierIdx: index('verifications_identifier_idx').on(t.identifier),
  }),
);

export const specialities = pgTable('specialities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const doctors = pgTable(
  'doctors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id').references(() => clinics.id, {
      onDelete: 'set null',
    }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    specialityId: uuid('speciality_id')
      .notNull()
      .references(() => specialities.id),
    license: varchar('license', { length: 50 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    bio: text('bio'),
    consultationFee: integer('consultation_fee'), // in cents (e.g., 25000 = R$ 250.00)
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    clinicIdIdx: index('doctors_clinic_id_idx').on(t.clinicId),
    clinicActiveIdx: index('doctors_clinic_active_idx').on(t.clinicId, t.isActive),
    clinicEmailUnique: uniqueIndex('doctors_clinic_email_unique').on(
      t.clinicId,
      t.email,
    ),
    clinicLicenseUnique: uniqueIndex('doctors_clinic_license_unique').on(
      t.clinicId,
      t.license,
    ),
    specialityIdIdx: index('doctors_speciality_id_idx').on(t.specialityId),
    userIdIdx: index('doctors_user_id_idx').on(t.userId),
    userIdUnique: uniqueIndex('doctors_user_id_unique').on(t.userId),
  }),
);

export const doctorAvailabilities = pgTable(
  'doctor_availabilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
    dayOfWeek: availabilityDayOfWeekEnum('day_of_week').notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(),
    endTime: varchar('end_time', { length: 5 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    doctorDayIdx: index('doctor_availabilities_doctor_day_idx').on(
      t.doctorId,
      t.dayOfWeek,
    ),
  }),
);

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id').references(() => clinics.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    cpf: text('cpf').notNull(),
    cpfHash: varchar('cpf_hash', { length: 64 }),
    dateOfBirth: timestamp('date_of_birth').notNull(),
    gender: varchar('gender', { length: 10 }), // 'M', 'F', 'Other'
    phone: varchar('phone', { length: 20 }),
    emergencyContact: varchar('emergency_contact', { length: 255 }),
    emergencyPhone: varchar('emergency_phone', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    clinicIdIdx: index('patients_clinic_id_idx').on(t.clinicId),
    clinicActiveIdx: index('patients_clinic_active_idx').on(t.clinicId, t.isActive),
    clinicCpfHashUnique: uniqueIndex('patients_clinic_cpf_hash_unique').on(
      t.clinicId,
      t.cpfHash,
    ),
  }),
);

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id').references(() => clinics.id, {
      onDelete: 'set null',
    }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    appointmentDate: timestamp('appointment_date').notNull(),
    status: appointmentStatusEnum('status').notNull().default('scheduled'),
    notes: text('notes'),
    reasonForVisit: varchar('reason_for_visit', { length: 255 }),
    appointmentFee: integer('appointment_fee'), // snapshot do consultationFee do médico no momento do agendamento (em centavos)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    clinicDateIdx: index('appointments_clinic_date_idx').on(
      t.clinicId,
      t.appointmentDate,
    ),
    doctorScheduleUniqueActive: uniqueIndex(
      'appointments_doctor_date_active_unique',
    )
      .on(t.doctorId, t.appointmentDate)
      .where(sql`${t.status} != 'cancelled'`),
    patientScheduleUniqueActive: uniqueIndex(
      'appointments_patient_date_active_unique',
    )
      .on(t.patientId, t.appointmentDate)
      .where(sql`${t.status} != 'cancelled'`),
  }),
);


export const clinicsRelations = relations(clinics, ({ many }) => ({
  users: many(users),
  doctors: many(doctors),
  patients: many(patients),
  appointments: many(appointments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [users.clinicId],
    references: [clinics.id],
  }),
  createdAppointments: many(appointments),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const specialitiesRelations = relations(specialities, ({ many }) => ({
  doctors: many(doctors),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [doctors.clinicId],
    references: [clinics.id],
  }),
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
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
  clinic: one(clinics, {
    fields: [patients.clinicId],
    references: [clinics.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  clinic: one(clinics, {
    fields: [appointments.clinicId],
    references: [clinics.id],
  }),
  createdByUser: one(users, {
    fields: [appointments.createdByUserId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
}));
