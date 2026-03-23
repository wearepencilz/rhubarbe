CREATE TABLE "taxonomy_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "launch_products" DROP CONSTRAINT "launch_products_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "launch_products" ALTER COLUMN "product_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "launch_products" ADD COLUMN "product_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "taxonomy_values_category_idx" ON "taxonomy_values" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_values_category_value_uniq" ON "taxonomy_values" USING btree ("category","value");