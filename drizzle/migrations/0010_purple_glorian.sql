CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_email" text NOT NULL,
	"template_key" text NOT NULL,
	"order_id" text,
	"status" text NOT NULL,
	"error_message" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_key" text NOT NULL,
	"subject" jsonb NOT NULL,
	"body" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_template_key_unique" UNIQUE("template_key")
);
--> statement-breakpoint
CREATE TABLE "volume_lead_time_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"min_quantity" integer NOT NULL,
	"lead_time_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volume_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"label" jsonb NOT NULL,
	"shopify_variant_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" text DEFAULT 'launch' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "allergen_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "volume_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "volume_description" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "volume_instructions" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "volume_min_order_quantity" integer;--> statement-breakpoint
ALTER TABLE "volume_lead_time_tiers" ADD CONSTRAINT "volume_lead_time_tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volume_variants" ADD CONSTRAINT "volume_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "volume_lead_time_tiers_product_id_idx" ON "volume_lead_time_tiers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "volume_variants_product_id_idx" ON "volume_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "volume_variants_sort_order_idx" ON "volume_variants" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "orders_order_type_idx" ON "orders" USING btree ("order_type");