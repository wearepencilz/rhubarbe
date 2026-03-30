ALTER TABLE "cake_variants" ADD COLUMN IF NOT EXISTS "description" jsonb;--> statement-breakpoint
ALTER TABLE "launches" ADD COLUMN IF NOT EXISTS "pickup_window_start" timestamp;--> statement-breakpoint
ALTER TABLE "launches" ADD COLUMN IF NOT EXISTS "pickup_window_end" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "next_available_date" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "serves_per_unit" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cake_flavour_notes" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cake_delivery_available" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "volume_variants" ADD COLUMN IF NOT EXISTS "description" jsonb;
