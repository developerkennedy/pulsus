-- Migração: Serial/Integer → UUID
-- Abordagem: DROP + RECREATE (ambiente de desenvolvimento, sem dados de produção)

-- Drop em ordem reversa das FKs
DROP TABLE IF EXISTS "appointments" CASCADE;
DROP TABLE IF EXISTS "doctor_availabilities" CASCADE;
DROP TABLE IF EXISTS "doctors" CASCADE;
DROP TABLE IF EXISTS "patients" CASCADE;
DROP TABLE IF EXISTS "verifications" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "specialities" CASCADE;
DROP TABLE IF EXISTS "clinics" CASCADE;

-- Remove sequências antigas se existirem
DROP SEQUENCE IF EXISTS "clinics_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "users_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "sessions_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "accounts_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "verifications_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "specialities_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "doctors_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "doctor_availabilities_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "patients_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "appointments_id_seq" CASCADE;

-- Recria com UUID

CREATE TABLE "clinics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255),
  "phone" varchar(20),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clinic_id" uuid REFERENCES "clinics"("id") ON DELETE SET NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "role" "user_role" NOT NULL DEFAULT 'receptionist',
  "phone" varchar(20),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");

CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");
CREATE UNIQUE INDEX "accounts_provider_account_unique" ON "accounts" USING btree ("provider_id", "account_id");

CREATE TABLE "verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");

CREATE TABLE "specialities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL UNIQUE,
  "description" text,
  "icon" varchar(50),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "doctors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clinic_id" uuid REFERENCES "clinics"("id") ON DELETE SET NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "speciality_id" uuid NOT NULL REFERENCES "specialities"("id"),
  "license" varchar(50) NOT NULL UNIQUE,
  "phone" varchar(20),
  "bio" text,
  "consultation_fee" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "doctor_availabilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "doctor_id" uuid NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
  "day_of_week" "availability_day_of_week" NOT NULL,
  "start_time" varchar(5) NOT NULL,
  "end_time" varchar(5) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "patients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clinic_id" uuid REFERENCES "clinics"("id") ON DELETE SET NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255),
  "cpf" varchar(11) NOT NULL UNIQUE,
  "date_of_birth" timestamp NOT NULL,
  "gender" varchar(10),
  "phone" varchar(20),
  "emergency_contact" varchar(255),
  "emergency_phone" varchar(20),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clinic_id" uuid REFERENCES "clinics"("id") ON DELETE SET NULL,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "doctor_id" uuid NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "appointment_date" timestamp NOT NULL,
  "status" "appointment_status" NOT NULL DEFAULT 'scheduled',
  "notes" text,
  "reason_for_visit" varchar(255),
  "appointment_fee" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "appointments_clinic_date_idx" ON "appointments" USING btree ("clinic_id", "appointment_date");
CREATE UNIQUE INDEX "appointments_doctor_date_active_unique" ON "appointments" USING btree ("doctor_id", "appointment_date") WHERE status != 'cancelled';
CREATE UNIQUE INDEX "appointments_patient_date_active_unique" ON "appointments" USING btree ("patient_id", "appointment_date") WHERE status != 'cancelled';
