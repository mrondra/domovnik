CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."match_method" AS ENUM('vs_amount', 'vs_only', 'agent', 'manual');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('unmatched', 'matched', 'proposed', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."match_target" AS ENUM('prescription', 'invoice');--> statement-breakpoint
CREATE TABLE "bank_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"iban" text,
	"number" text NOT NULL,
	"bank_code" text NOT NULL,
	"label" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transaction" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"booked_on" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"counterparty_account" text,
	"counterparty_name" text,
	"variable_symbol" text,
	"specific_symbol" text,
	"message" text,
	"match_status" "match_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_match" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"svj_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"target_type" "match_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" "match_method" NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"approval_id" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bank_account_number_unique" ON "bank_account" USING btree ("tenant_id","number","bank_code");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transaction_external_unique" ON "bank_transaction" USING btree ("tenant_id","bank_account_id","external_id");--> statement-breakpoint
CREATE INDEX "bank_transaction_status_idx" ON "bank_transaction" USING btree ("tenant_id","svj_id","match_status");--> statement-breakpoint
CREATE INDEX "payment_match_transaction_idx" ON "payment_match" USING btree ("tenant_id","transaction_id");
--> statement-breakpoint
ALTER TABLE "bank_account" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "bank_account" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "bank_account_tenant_isolation" ON "bank_account";
--> statement-breakpoint
CREATE POLICY "bank_account_tenant_isolation" ON "bank_account" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "bank_transaction" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "bank_transaction" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "bank_transaction_tenant_isolation" ON "bank_transaction";
--> statement-breakpoint
CREATE POLICY "bank_transaction_tenant_isolation" ON "bank_transaction" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
--> statement-breakpoint
ALTER TABLE "payment_match" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "payment_match" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "payment_match_tenant_isolation" ON "payment_match";
--> statement-breakpoint
CREATE POLICY "payment_match_tenant_isolation" ON "payment_match" FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
