ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "order_minimum" integer;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "order_scope" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variant_minimum" integer;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "increment" integer;
