-- Fix rd_roles table missing description column
-- Run this script in your Supabase SQL Editor to fix the "Could not find the 'description' column" error

-- Add description column to rd_roles table if it doesn't exist
ALTER TABLE rd_roles 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the description column
COMMENT ON COLUMN rd_roles.description IS 'Role description explaining responsibilities and duties';

-- Update existing roles to have default descriptions
UPDATE rd_roles 
SET description = 'Role description not provided' 
WHERE description IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rd_roles' 
ORDER BY ordinal_position; 