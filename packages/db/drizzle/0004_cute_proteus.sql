CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."balance_entry_kind" AS ENUM('prescription', 'payment', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."prescription_source" AS ENUM('internal', 'pohoda');--> statement-breakpoint
CREATE TABLE "prescription" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"variable_symbol" text NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"due_date" date NOT NULL,
	"source" "prescription_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_item" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_balance_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"kind" "balance_entry_kind" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reference_type" text,
	"reference_id" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "prescription_period_unique" ON "prescription" USING btree ("tenant_id","svj_id","unit_id","year","month");--> statement-breakpoint
CREATE INDEX "prescription_vs_idx" ON "prescription" USING btree ("tenant_id","svj_id","variable_symbol");--> statement-breakpoint
CREATE INDEX "prescription_item_idx" ON "prescription_item" USING btree ("tenant_id","prescription_id");--> statement-breakpoint
CREATE INDEX "unit_balance_entry_idx" ON "unit_balance_entry" USING btree ("tenant_id","svj_id","unit_id","entry_date");
--> statement-breakpoint
ALTER TABLE "prescription" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "prescription" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "prescription_tenant_isolation" ON "prescription";
--> statement-breakpoint
CREATE POLICY "prescription_tenant_isolation" ON "prescription" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "prescription_item" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "prescription_item" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "prescription_item_tenant_isolation" ON "prescription_item";
--> statement-breakpoint
CREATE POLICY "prescription_item_tenant_isolation" ON "prescription_item" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "unit_balance_entry" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "unit_balance_entry" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "unit_balance_entry_tenant_isolation" ON "unit_balance_entry";
--> statement-breakpoint
CREATE POLICY "unit_balance_entry_tenant_isolation" ON "unit_balance_entry" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
