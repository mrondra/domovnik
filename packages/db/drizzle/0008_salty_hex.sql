CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."accounting_adapter" AS ENUM('mock', 'mserver');--> statement-breakpoint
CREATE TYPE "public"."conflict_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."receivables_adapter" AS ENUM('internal', 'pohoda_other_receivables');--> statement-breakpoint
CREATE TYPE "public"."sync_kind" AS ENUM('post_invoice', 'liquidate', 'import_statements', 'import_receivables');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "accounting_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"accounting_adapter" "accounting_adapter" NOT NULL,
	"receivables_adapter" "receivables_adapter" NOT NULL,
	"company_ico" text NOT NULL,
	"last_sync_at" timestamp with time zone,
	"config" jsonb
);
--> statement-breakpoint
CREATE TABLE "pohoda_mock_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"kind" text NOT NULL,
	"xml" text NOT NULL,
	"state" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_conflict" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"field" text NOT NULL,
	"ours" jsonb,
	"theirs" jsonb,
	"status" "conflict_status" NOT NULL,
	"resolution" text
);
--> statement-breakpoint
CREATE TABLE "sync_job" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"kind" "sync_kind" NOT NULL,
	"status" "sync_status" NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_link_svj_unique" ON "accounting_link" USING btree ("tenant_id","svj_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pohoda_mock_store_ref_unique" ON "pohoda_mock_store" USING btree ("tenant_id","svj_id","ref");--> statement-breakpoint
CREATE INDEX "sync_conflict_status_idx" ON "sync_conflict" USING btree ("tenant_id","svj_id","status");--> statement-breakpoint
CREATE INDEX "sync_job_status_idx" ON "sync_job" USING btree ("tenant_id","svj_id","status");
--> statement-breakpoint
ALTER TABLE "accounting_link" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "accounting_link" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "accounting_link_tenant_isolation" ON "accounting_link";
--> statement-breakpoint
CREATE POLICY "accounting_link_tenant_isolation" ON "accounting_link" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "pohoda_mock_store" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pohoda_mock_store" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "pohoda_mock_store_tenant_isolation" ON "pohoda_mock_store";
--> statement-breakpoint
CREATE POLICY "pohoda_mock_store_tenant_isolation" ON "pohoda_mock_store" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "sync_conflict" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sync_conflict" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "sync_conflict_tenant_isolation" ON "sync_conflict";
--> statement-breakpoint
CREATE POLICY "sync_conflict_tenant_isolation" ON "sync_conflict" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "sync_job" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sync_job" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "sync_job_tenant_isolation" ON "sync_job";
--> statement-breakpoint
CREATE POLICY "sync_job_tenant_isolation" ON "sync_job" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
