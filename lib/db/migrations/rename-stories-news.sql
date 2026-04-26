-- Migration: Rename stories → journal, news → recipes
-- Run with: npx tsx scripts/run-migration-rename-content-types.ts

-- ═══════════════════════════════════════════════════════════
-- 1. Stories → Journal
-- ═══════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS stories RENAME TO journal;
ALTER INDEX IF EXISTS stories_slug_idx RENAME TO journal_slug_idx;
ALTER INDEX IF EXISTS stories_status_idx RENAME TO journal_status_idx;
ALTER INDEX IF EXISTS stories_category_idx RENAME TO journal_category_idx;

-- ═══════════════════════════════════════════════════════════
-- 2. News → Recipes (with new columns)
-- ═══════════════════════════════════════════════════════════

-- Add new columns before rename
ALTER TABLE news ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE news ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- Backfill existing rows
UPDATE news SET
  status = 'published',
  published_at = created_at,
  slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(title, 'untitled-' || id::text), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Rename table
ALTER TABLE news RENAME TO recipes;
ALTER INDEX IF EXISTS news_legacy_id_idx RENAME TO recipes_legacy_id_idx;

-- Add new indexes
CREATE INDEX IF NOT EXISTS recipes_slug_idx ON recipes (slug);
CREATE INDEX IF NOT EXISTS recipes_status_idx ON recipes (status);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes (category);
