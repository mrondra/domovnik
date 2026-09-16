CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."unit_kind" AS ENUM('apartment', 'commercial', 'garage');--> statement-breakpoint
CREATE TABLE "building" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"label" text NOT NULL,
	"street" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "svj" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"name" text NOT NULL,
	"ico" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"committee" uuid[] DEFAULT '{}' NOT NULL,
	"bank_accounts" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"number" text NOT NULL,
	"kind" "unit_kind" NOT NULL,
	"share_numerator" integer NOT NULL,
	"share_denominator" integer NOT NULL,
	"floor_area" numeric(8, 2) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "building_label_unique" ON "building" USING btree ("tenant_id","svj_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "department_code_unique" ON "department" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "svj_ico_unique" ON "svj" USING btree ("tenant_id","ico");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_number_unique" ON "unit" USING btree ("tenant_id","svj_id","number");--> statement-breakpoint
CREATE INDEX "unit_building_idx" ON "unit" USING btree ("tenant_id","building_id");
--> statement-breakpoint
ALTER TABLE "building" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "building" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "building_tenant_isolation" ON "building";
--> statement-breakpoint
CREATE POLICY "building_tenant_isolation" ON "building" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "department" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "department" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "department_tenant_isolation" ON "department";
--> statement-breakpoint
CREATE POLICY "department_tenant_isolation" ON "department" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "svj" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "svj" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "svj_tenant_isolation" ON "svj";
--> statement-breakpoint
CREATE POLICY "svj_tenant_isolation" ON "svj" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "unit" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "unit" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "unit_tenant_isolation" ON "unit";
--> statement-breakpoint
CREATE POLICY "unit_tenant_isolation" ON "unit" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
