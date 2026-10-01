CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
ALTER TABLE "contract" ADD COLUMN "covers" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "specializations" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "contact_person" text;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
