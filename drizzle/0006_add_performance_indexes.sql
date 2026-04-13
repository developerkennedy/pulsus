-- Índices de performance: doctors e patients por clinicId e isActive
-- Elimina full table scans nas queries multi-tenant mais frequentes

CREATE INDEX IF NOT EXISTS "doctors_clinic_id_idx" ON "doctors" USING btree ("clinic_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctors_clinic_active_idx" ON "doctors" USING btree ("clinic_id", "is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctors_speciality_id_idx" ON "doctors" USING btree ("speciality_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patients_clinic_id_idx" ON "patients" USING btree ("clinic_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patients_clinic_active_idx" ON "patients" USING btree ("clinic_id", "is_active");
