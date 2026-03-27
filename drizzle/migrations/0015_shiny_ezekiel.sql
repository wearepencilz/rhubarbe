ALTER TABLE "cake_variants" ADD COLUMN "description" jsonb;--> statement-breakpoint
ALTER TABLE "launches" ADD COLUMN "pickup_window_start" timestamp;--> statement-breakpoint
ALTER TABLE "launches" ADD COLUMN "pickup_window_end" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "next_available_date" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "serves_per_unit" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_flavour_notes" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_delivery_available" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "volume_variants" ADD COLUMN "description" jsonb;
