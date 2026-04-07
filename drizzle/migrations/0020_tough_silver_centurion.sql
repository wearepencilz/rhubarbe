CREATE TABLE "cake_addon_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_product_id" uuid NOT NULL,
	"addon_product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cake_pricing_grid" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"size_value" text NOT NULL,
	"flavour_handle" text NOT NULL,
	"price_in_cents" integer NOT NULL,
	"shopify_variant_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cake_lead_time_tiers" ADD COLUMN "delivery_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "launches" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "volume_unit_label" text DEFAULT 'quantity' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_product_type" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_flavour_config" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_tier_detail_config" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cake_max_flavours" integer;--> statement-breakpoint
ALTER TABLE "cake_addon_links" ADD CONSTRAINT "cake_addon_links_parent_product_id_products_id_fk" FOREIGN KEY ("parent_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cake_addon_links" ADD CONSTRAINT "cake_addon_links_addon_product_id_products_id_fk" FOREIGN KEY ("addon_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cake_pricing_grid" ADD CONSTRAINT "cake_pricing_grid_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cake_addon_links_parent_idx" ON "cake_addon_links" USING btree ("parent_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cake_addon_links_unique" ON "cake_addon_links" USING btree ("parent_product_id","addon_product_id");--> statement-breakpoint
CREATE INDEX "cake_pricing_grid_product_id_idx" ON "cake_pricing_grid" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cake_pricing_grid_unique_cell" ON "cake_pricing_grid" USING btree ("product_id","size_value","flavour_handle");--> statement-breakpoint
CREATE INDEX "launches_slug_idx" ON "launches" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "launches" ADD CONSTRAINT "launches_slug_unique" UNIQUE("slug");