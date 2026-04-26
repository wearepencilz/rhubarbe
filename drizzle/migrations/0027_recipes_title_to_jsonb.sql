-- Convert recipes.title from text to jsonb
-- Existing plain-text titles become { "en": "", "fr": "<old value>" }
-- Existing JSON-string titles (from broken saves) are parsed directly

-- Step 1: Add a temporary jsonb column
ALTER TABLE "recipes" ADD COLUMN "title_jsonb" jsonb;

-- Step 2: Migrate existing data
UPDATE "recipes" SET "title_jsonb" = CASE
  WHEN "title" IS NULL THEN NULL
  WHEN "title" LIKE '{%' THEN "title"::jsonb
  WHEN "title" = '[object Object]' THEN '{"en":"","fr":""}'::jsonb
  ELSE jsonb_build_object('en', '', 'fr', "title")
END;

-- Step 3: Drop old column and rename
ALTER TABLE "recipes" DROP COLUMN "title";
ALTER TABLE "recipes" RENAME COLUMN "title_jsonb" TO "title";
