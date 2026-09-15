CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
ALTER TABLE "approval" ADD COLUMN "executed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "via" text;
