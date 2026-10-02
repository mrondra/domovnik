CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."task_activity_kind" AS ENUM('comment', 'status_changed', 'assigned', 'created');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'waiting', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "department_member" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"department_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "task_status" NOT NULL,
	"priority" "task_priority" NOT NULL,
	"department_id" uuid NOT NULL,
	"assignee_id" uuid,
	"due_on" date,
	"origin_type" text,
	"origin_id" uuid,
	"dedupe_key" text,
	"created_by_agent_run_id" uuid,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "task_activity" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"task_id" uuid NOT NULL,
	"kind" "task_activity_kind" NOT NULL,
	"body" text,
	"data" jsonb,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "department_member_unique" ON "department_member" USING btree ("tenant_id","department_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_dedupe_key_unique" ON "task" USING btree ("tenant_id","dedupe_key") WHERE "task"."dedupe_key" is not null;--> statement-breakpoint
CREATE INDEX "task_department_status_idx" ON "task" USING btree ("tenant_id","department_id","status");--> statement-breakpoint
CREATE INDEX "task_assignee_status_idx" ON "task" USING btree ("tenant_id","assignee_id","status");--> statement-breakpoint
CREATE INDEX "task_svj_status_idx" ON "task" USING btree ("tenant_id","svj_id","status");--> statement-breakpoint
CREATE INDEX "task_origin_idx" ON "task" USING btree ("tenant_id","origin_type","origin_id");--> statement-breakpoint
CREATE INDEX "task_activity_task_idx" ON "task_activity" USING btree ("tenant_id","task_id","created_at");
--> statement-breakpoint
ALTER TABLE "department_member" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "department_member" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "department_member_tenant_isolation" ON "department_member";
--> statement-breakpoint
CREATE POLICY "department_member_tenant_isolation" ON "department_member" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "task" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "task" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "task_tenant_isolation" ON "task";
--> statement-breakpoint
CREATE POLICY "task_tenant_isolation" ON "task" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "task_activity" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "task_activity" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "task_activity_tenant_isolation" ON "task_activity";
--> statement-breakpoint
CREATE POLICY "task_activity_tenant_isolation" ON "task_activity" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
