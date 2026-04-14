ALTER TABLE "cake_variants" ADD COLUMN "allergens" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "lead_time_days" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "catering_type" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "catering_description" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "catering_flavour_name" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "catering_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dietary_tags" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "temperature_tags" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "order_minimum" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "order_scope" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variant_minimum" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "increment" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_max_people" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "max_advance_days" integer;--> statement-breakpoint
ALTER TABLE "taxonomy_values" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "volume_variants" ADD COLUMN "allergens" jsonb;