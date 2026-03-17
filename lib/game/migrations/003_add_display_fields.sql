-- Add display_title and description columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS display_title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment
COMMENT ON COLUMN campaigns.display_title IS 'Public-facing title for the campaign (optional, defaults to name)';
COMMENT ON COLUMN campaigns.description IS 'Public description of the campaign shown on game page';
