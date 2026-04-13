ALTER TABLE "doctors" DROP CONSTRAINT IF EXISTS "doctors_email_unique";
ALTER TABLE "doctors" DROP CONSTRAINT IF EXISTS "doctors_license_unique";
ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_cpf_unique";

CREATE UNIQUE INDEX "doctors_clinic_email_unique"
  ON "doctors" USING btree ("clinic_id", "email");

CREATE UNIQUE INDEX "doctors_clinic_license_unique"
  ON "doctors" USING btree ("clinic_id", "license");

CREATE UNIQUE INDEX "patients_clinic_cpf_unique"
  ON "patients" USING btree ("clinic_id", "cpf");
