CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('received', 'extracted', 'needs_review', 'pending_approval', 'approved', 'rejected', 'posted', 'paid');--> statement-breakpoint
CREATE TABLE "budget_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"category" text NOT NULL,
	"planned_amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"budget_category" text NOT NULL,
	"monthly_amount" numeric(12, 2),
	"valid_from" date NOT NULL,
	"valid_to" date,
	"document_id" uuid
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"status" "invoice_status" NOT NULL,
	"supplier_id" uuid,
	"contract_id" uuid,
	"document_id" uuid NOT NULL,
	"external_number" text,
	"variable_symbol" text,
	"issued_on" date,
	"due_on" date,
	"amount_total" numeric(12, 2),
	"amount_vat" numeric(12, 2),
	"currency" text DEFAULT 'CZK' NOT NULL,
	"budget_category" text,
	"extraction" jsonb,
	"checks" jsonb,
	"agent_run_id" uuid,
	"approval_id" uuid,
	"accounting_ref" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"name" text NOT NULL,
	"ico" text NOT NULL,
	"dic" text,
	"bank_account" text,
	"email" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "budget_line_unique" ON "budget_line" USING btree ("tenant_id","svj_id","year","category");--> statement-breakpoint
CREATE INDEX "contract_supplier_idx" ON "contract" USING btree ("tenant_id","svj_id","supplier_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("tenant_id","svj_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_external_number_unique" ON "invoice" USING btree ("tenant_id","supplier_id","external_number") WHERE "invoice"."external_number" is not null;--> statement-breakpoint
CREATE INDEX "invoice_line_idx" ON "invoice_line" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_ico_unique" ON "supplier" USING btree ("tenant_id","ico");
--> statement-breakpoint
ALTER TABLE "budget_line" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "budget_line" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "budget_line_tenant_isolation" ON "budget_line";
--> statement-breakpoint
CREATE POLICY "budget_line_tenant_isolation" ON "budget_line" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "contract" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "contract" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "contract_tenant_isolation" ON "contract";
--> statement-breakpoint
CREATE POLICY "contract_tenant_isolation" ON "contract" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "invoice" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invoice" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "invoice_tenant_isolation" ON "invoice";
--> statement-breakpoint
CREATE POLICY "invoice_tenant_isolation" ON "invoice" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "invoice_line" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invoice_line" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "invoice_line_tenant_isolation" ON "invoice_line";
--> statement-breakpoint
CREATE POLICY "invoice_line_tenant_isolation" ON "invoice_line" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "supplier" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "supplier" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "supplier_tenant_isolation" ON "supplier";
--> statement-breakpoint
CREATE POLICY "supplier_tenant_isolation" ON "supplier" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
