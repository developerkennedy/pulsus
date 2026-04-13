DO $$
BEGIN
 IF EXISTS (
  SELECT 1
  FROM "appointments"
  WHERE "status" != 'cancelled'
  GROUP BY "doctor_id", "appointment_date"
  HAVING COUNT(*) > 1
 ) THEN
  RAISE EXCEPTION 'Cannot create appointments_doctor_date_active_unique because duplicate active appointments already exist for the same doctor and time.';
 END IF;

 IF EXISTS (
  SELECT 1
  FROM "appointments"
  WHERE "status" != 'cancelled'
  GROUP BY "patient_id", "appointment_date"
  HAVING COUNT(*) > 1
 ) THEN
  RAISE EXCEPTION 'Cannot create appointments_patient_date_active_unique because duplicate active appointments already exist for the same patient and time.';
 END IF;
END $$;

CREATE INDEX IF NOT EXISTS "appointments_clinic_date_idx"
ON "appointments" USING btree ("clinic_id", "appointment_date");

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_doctor_date_active_unique"
ON "appointments" USING btree ("doctor_id", "appointment_date")
WHERE "status" != 'cancelled';

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_patient_date_active_unique"
ON "appointments" USING btree ("patient_id", "appointment_date")
WHERE "status" != 'cancelled';
