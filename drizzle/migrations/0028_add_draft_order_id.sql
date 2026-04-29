-- Add draft_order_id column to orders table for Shopify draft order traceability
ALTER TABLE "orders" ADD COLUMN "draft_order_id" text;
