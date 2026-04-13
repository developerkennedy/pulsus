CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_email_unique";--> statement-breakpoint
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_license_unique";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_cpf_unique";--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "doctor_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "patient_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "doctor_availabilities" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "doctor_availabilities" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "doctor_availabilities" ALTER COLUMN "doctor_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "doctors" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "doctors" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "doctors" ALTER COLUMN "speciality_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "specialities" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "specialities" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "clinic_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "appointment_fee" integer;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "clinic_id" uuid;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "clinic_id" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clinic_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_unique" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_clinic_date_idx" ON "appointments" USING btree ("clinic_id","appointment_date");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_doctor_date_active_unique" ON "appointments" USING btree ("doctor_id","appointment_date") WHERE "appointments"."status" != 'cancelled';--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_patient_date_active_unique" ON "appointments" USING btree ("patient_id","appointment_date") WHERE "appointments"."status" != 'cancelled';--> statement-breakpoint
CREATE INDEX "doctors_clinic_id_idx" ON "doctors" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "doctors_clinic_active_idx" ON "doctors" USING btree ("clinic_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_clinic_email_unique" ON "doctors" USING btree ("clinic_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_clinic_license_unique" ON "doctors" USING btree ("clinic_id","license");--> statement-breakpoint
CREATE INDEX "doctors_speciality_id_idx" ON "doctors" USING btree ("speciality_id");--> statement-breakpoint
CREATE INDEX "doctors_user_id_idx" ON "doctors" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_user_id_unique" ON "doctors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "patients_clinic_id_idx" ON "patients" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "patients_clinic_active_idx" ON "patients" USING btree ("clinic_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "patients_clinic_cpf_unique" ON "patients" USING btree ("clinic_id","cpf");--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clinic_name";