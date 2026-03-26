ALTER TABLE "products" ALTER COLUMN "availability_mode" SET DEFAULT 'always_available';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "availability_mode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "date_selection_type" SET DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "date_selection_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slot_selection_type" SET DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slot_selection_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_behavior" text DEFAULT 'always_taxable' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_threshold" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_unit_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shopify_tax_exempt_variant_id" text;