-- Products table: new catering-specific columns (ADDITIVE ONLY)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "catering_type" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "catering_description" jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "catering_flavour_name" jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "catering_end_date" timestamp;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dietary_tags" jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "temperature_tags" jsonb;

-- Cake variants table: allergens column for per-variant allergen assignment (ADDITIVE ONLY)
ALTER TABLE "cake_variants" ADD COLUMN IF NOT EXISTS "allergens" jsonb;

-- Volume variants table: allergens column for per-variant allergen assignment (ADDITIVE ONLY)
ALTER TABLE "volume_variants" ADD COLUMN IF NOT EXISTS "allergens" jsonb;

-- Index on catering_type for grouped queries
CREATE INDEX IF NOT EXISTS "products_catering_type_idx" ON "products" ("catering_type");
