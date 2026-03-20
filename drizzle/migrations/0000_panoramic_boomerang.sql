CREATE TABLE "launch_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"launch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"min_quantity_override" integer,
	"max_quantity_override" integer,
	"quantity_step_override" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "launches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb NOT NULL,
	"intro_copy" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"order_opens" timestamp NOT NULL,
	"order_closes" timestamp NOT NULL,
	"pickup_date" timestamp NOT NULL,
	"pickup_location_id" uuid,
	"pickup_instructions" jsonb,
	"pickup_slot_config" jsonb,
	"pickup_slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"pickup_date" timestamp NOT NULL,
	"pickup_location_id" uuid NOT NULL,
	"pickup_location_name" text NOT NULL,
	"pickup_slot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"special_instructions" text,
	"subtotal" integer NOT NULL,
	"tax" integer NOT NULL,
	"total" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "pickup_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_name" text NOT NULL,
	"public_label" jsonb NOT NULL,
	"address" text NOT NULL,
	"pickup_instructions" jsonb NOT NULL,
	"contact_details" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"map_or_directions_link" text,
	"operational_notes_for_staff" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"shopify_product_id" text,
	"shopify_product_handle" text,
	"default_min_quantity" integer DEFAULT 1 NOT NULL,
	"default_quantity_step" integer DEFAULT 1 NOT NULL,
	"default_max_quantity" integer,
	"default_pickup_required" boolean DEFAULT false NOT NULL,
	"online_orderable" boolean DEFAULT true NOT NULL,
	"pickup_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "launch_products" ADD CONSTRAINT "launch_products_launch_id_launches_id_fk" FOREIGN KEY ("launch_id") REFERENCES "public"."launches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launch_products" ADD CONSTRAINT "launch_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launches" ADD CONSTRAINT "launches_pickup_location_id_pickup_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."pickup_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "launch_products_launch_id_idx" ON "launch_products" USING btree ("launch_id");--> statement-breakpoint
CREATE INDEX "launch_products_product_id_idx" ON "launch_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "launch_products_unique" ON "launch_products" USING btree ("launch_id","product_id");--> statement-breakpoint
CREATE INDEX "launches_status_idx" ON "launches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "launches_pickup_date_idx" ON "launches" USING btree ("pickup_date");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_pickup_date_idx" ON "order_items" USING btree ("pickup_date");--> statement-breakpoint
CREATE INDEX "order_items_pickup_location_id_idx" ON "order_items" USING btree ("pickup_location_id");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_order_date_idx" ON "orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "pickup_locations_active_idx" ON "pickup_locations" USING btree ("active");--> statement-breakpoint
CREATE INDEX "pickup_locations_sort_order_idx" ON "pickup_locations" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");