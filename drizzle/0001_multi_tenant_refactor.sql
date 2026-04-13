CREATE TABLE "clinics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clinic_id" integer;
--> statement-breakpoint
INSERT INTO "clinics" ("name")
SELECT 'Clínica Principal'
WHERE NOT EXISTS (SELECT 1 FROM "clinics")
  AND (
    EXISTS (SELECT 1 FROM "users")
    OR EXISTS (SELECT 1 FROM "doctors")
    OR EXISTS (SELECT 1 FROM "patients")
    OR EXISTS (SELECT 1 FROM "appointments")
  );
--> statement-breakpoint
INSERT INTO "clinics" ("name")
SELECT DISTINCT "clinic_name"
FROM "users"
WHERE "clinic_name" IS NOT NULL
  AND "clinic_name" <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "clinics" c
    WHERE c."name" = "users"."clinic_name"
  );
--> statement-breakpoint
UPDATE "users" u
SET "clinic_id" = c."id"
FROM "clinics" c
WHERE c."name" = COALESCE(NULLIF(u."clinic_name", ''), 'Clínica Principal')
  AND u."clinic_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "users"
	ADD CONSTRAINT "users_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
	ON DELETE SET NULL ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clinic_name";
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "clinic_id" integer;
--> statement-breakpoint
UPDATE "doctors"
SET "clinic_id" = (SELECT "id" FROM "clinics" ORDER BY "id" LIMIT 1)
WHERE "clinic_id" IS NULL
  AND EXISTS (SELECT 1 FROM "clinics");
--> statement-breakpoint
ALTER TABLE "doctors"
	ADD CONSTRAINT "doctors_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
	ON DELETE SET NULL ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "clinic_id" integer;
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "name" varchar(255);
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "email" varchar(255);
--> statement-breakpoint
UPDATE "patients" p
SET
	"name" = u."name",
	"email" = u."email",
	"phone" = COALESCE(p."phone", u."phone"),
	"clinic_id" = COALESCE(p."clinic_id", u."clinic_id")
FROM "users" u
WHERE p."user_id" = u."id";
--> statement-breakpoint
UPDATE "patients"
SET "clinic_id" = (SELECT "id" FROM "clinics" ORDER BY "id" LIMIT 1)
WHERE "clinic_id" IS NULL
  AND EXISTS (SELECT 1 FROM "clinics");
--> statement-breakpoint
UPDATE "patients"
SET "name" = 'Paciente sem nome'
WHERE "name" IS NULL;
--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "patients"
	ADD CONSTRAINT "patients_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
	ON DELETE SET NULL ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "user_id";
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "clinic_id" integer;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "created_by_user_id" integer;
--> statement-breakpoint
UPDATE "appointments" a
SET
	"clinic_id" = u."clinic_id",
	"created_by_user_id" = a."user_id"
FROM "users" u
WHERE a."user_id" = u."id";
--> statement-breakpoint
UPDATE "appointments"
SET "clinic_id" = (SELECT "id" FROM "clinics" ORDER BY "id" LIMIT 1)
WHERE "clinic_id" IS NULL
  AND EXISTS (SELECT 1 FROM "clinics");
--> statement-breakpoint
ALTER TABLE "appointments"
	ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
	ON DELETE SET NULL ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointments"
	ADD CONSTRAINT "appointments_created_by_user_id_users_id_fk"
	FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id")
	ON DELETE SET NULL ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "user_id";
