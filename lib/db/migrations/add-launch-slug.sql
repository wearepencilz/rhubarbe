-- Add slug column to launches table for shareable URLs
ALTER TABLE launches ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS launches_slug_idx ON launches (slug);
