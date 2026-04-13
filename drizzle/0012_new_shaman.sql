DROP INDEX "patients_clinic_cpf_unique";--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "cpf" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "cpf_hash" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "patients_clinic_cpf_hash_unique" ON "patients" USING btree ("clinic_id","cpf_hash");