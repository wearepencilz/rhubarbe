CREATE TABLE "cake_lead_time_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"min_people" integer NOT NULL,
	"lead_time_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cake_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"label" jsonb NOT NULL,
	"shopify_variant_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_description" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_instructions" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_min_people" integer;--> statement-breakpoint
ALTER TABLE "cake_lead_time_tiers" ADD CONSTRAINT "cake_lead_time_tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cake_variants" ADD CONSTRAINT "cake_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cake_lead_time_tiers_product_id_idx" ON "cake_lead_time_tiers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "cake_variants_product_id_idx" ON "cake_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "cake_variants_sort_order_idx" ON "cake_variants" USING btree ("sort_order");