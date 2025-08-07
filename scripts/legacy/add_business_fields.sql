-- Add new fields to rd_businesses table
-- Run this script in your Supabase SQL editor

-- Add website field
ALTER TABLE rd_businesses 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add NAICS code field
ALTER TABLE rd_businesses 
ADD COLUMN IF NOT EXISTS naics_code TEXT;

-- Add image path field for logo
ALTER TABLE rd_businesses 
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add comments for documentation
COMMENT ON COLUMN rd_businesses.website IS 'Business website URL';
COMMENT ON COLUMN rd_businesses.naics_code IS 'NAICS code for business classification';
COMMENT ON COLUMN rd_businesses.image_path IS 'Path to company logo image in storage';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rd_businesses' 
AND column_name IN ('website', 'naics_code', 'image_path')
ORDER BY column_name; 