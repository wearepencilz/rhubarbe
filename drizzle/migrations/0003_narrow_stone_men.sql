CREATE TABLE "product_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"quantity" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "legacy_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "currency" text DEFAULT 'CAD';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "serves" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_card_copy" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tasting_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allergens" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "key_notes" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variants" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inventory_tracked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "availability_mode" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "date_selection_type" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slot_selection_type" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variant_type" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sync_status" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sync_error" text;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_ingredients_product_id_idx" ON "product_ingredients" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_ingredients_ingredient_id_idx" ON "product_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "products_legacy_id_idx" ON "products" USING btree ("legacy_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");