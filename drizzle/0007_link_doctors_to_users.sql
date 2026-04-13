ALTER TABLE "doctors" ADD COLUMN "user_id" uuid;
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "doctors_user_id_idx" ON "doctors" USING btree ("user_id");
CREATE UNIQUE INDEX "doctors_user_id_unique" ON "doctors" USING btree ("user_id");
