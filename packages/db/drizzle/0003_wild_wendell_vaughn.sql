CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('invoice', 'contract', 'inspection_report', 'minutes', 'other');--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "document_category" NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text,
	"size" integer,
	"sha256" text NOT NULL,
	"source" text,
	"linked_entity_type" text,
	"linked_entity_id" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "document_storage_key_unique" ON "document" USING btree ("tenant_id","storage_key");--> statement-breakpoint
CREATE INDEX "document_category_idx" ON "document" USING btree ("tenant_id","svj_id","category");--> statement-breakpoint
CREATE INDEX "document_sha256_idx" ON "document" USING btree ("tenant_id","sha256");
--> statement-breakpoint
ALTER TABLE "document" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "document" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "document_tenant_isolation" ON "document";
--> statement-breakpoint
CREATE POLICY "document_tenant_isolation" ON "document" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
