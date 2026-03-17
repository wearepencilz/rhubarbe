-- Migration 008: Fix claim code constraint for 6-character codes
-- Remove the 16-character constraint and allow 6-character codes

-- Drop the old constraint
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS valid_claim_code;

-- Add new constraint that allows both 6 and 16 character codes
ALTER TABLE rewards ADD CONSTRAINT valid_claim_code 
  CHECK (LENGTH(claim_code) IN (6, 16));

-- Make contact validation more flexible (at least one contact method)
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS valid_contact;
ALTER TABLE rewards ADD CONSTRAINT valid_contact 
  CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL);

COMMENT ON CONSTRAINT valid_claim_code ON rewards IS 'Allows both legacy 16-char and new 6-char claim codes';
