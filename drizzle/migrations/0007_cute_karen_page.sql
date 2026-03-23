ALTER TABLE "orders" ADD COLUMN "shopify_order_id" text;--> statement-breakpoint
CREATE INDEX "orders_shopify_order_id_idx" ON "orders" USING btree ("shopify_order_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shopify_order_id_unique" UNIQUE("shopify_order_id");