CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" text,
	"name" text NOT NULL,
	"latin_name" text,
	"category" text,
	"taxonomy_category" text,
	"origin" text,
	"description" text,
	"story" text,
	"image" text,
	"image_alt" text,
	"allergens" jsonb,
	"roles" jsonb,
	"descriptors" jsonb,
	"tasting_notes" jsonb,
	"texture" jsonb,
	"process" jsonb,
	"attributes" jsonb,
	"used_as" jsonb,
	"available_months" jsonb,
	"seasonal" boolean DEFAULT false NOT NULL,
	"animal_derived" boolean DEFAULT false,
	"vegetarian" boolean DEFAULT true,
	"is_organic" boolean DEFAULT false,
	"source_name" text,
	"source_type" text,
	"supplier" text,
	"farm" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ingredients_legacy_id_idx" ON "ingredients" USING btree ("legacy_id");--> statement-breakpoint
CREATE INDEX "ingredients_name_idx" ON "ingredients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ingredients_category_idx" ON "ingredients" USING btree ("category");