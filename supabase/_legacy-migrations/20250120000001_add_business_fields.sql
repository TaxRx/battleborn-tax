-- Add new fields to rd_businesses table
-- Migration: 20250120000001_add_business_fields.sql

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

-- Create logos storage bucket if it doesn't exist
-- Note: This requires the storage extension to be enabled
-- The bucket will be created automatically when first file is uploaded 