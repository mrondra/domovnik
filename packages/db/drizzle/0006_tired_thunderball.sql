CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "demo_scenario" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "demo_scenario_code_unique" ON "demo_scenario" USING btree ("tenant_id","code");
--> statement-breakpoint
ALTER TABLE "demo_scenario" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "demo_scenario" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "demo_scenario_tenant_isolation" ON "demo_scenario";
--> statement-breakpoint
CREATE POLICY "demo_scenario_tenant_isolation" ON "demo_scenario" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
