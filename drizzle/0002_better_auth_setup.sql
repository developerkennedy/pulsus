ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" integer NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "sessions"
 ADD CONSTRAINT "sessions_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
 ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_unique" ON "sessions" USING btree ("token");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" integer NOT NULL,
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

DO $$ BEGIN
 ALTER TABLE "accounts"
 ADD CONSTRAINT "accounts_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
 ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" USING btree ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_unique" ON "accounts" USING btree ("provider_id","account_id");

CREATE TABLE IF NOT EXISTS "verifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications" USING btree ("identifier");
