-- Add description column to rd_roles table
-- Migration: 20250121000001_add_description_to_rd_roles.sql

-- Add description column to rd_roles table if it doesn't exist
ALTER TABLE rd_roles 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the description column
COMMENT ON COLUMN rd_roles.description IS 'Role description explaining responsibilities and duties';

-- Update existing roles to have default descriptions
UPDATE rd_roles 
SET description = 'Role description not provided' 
WHERE description IS NULL; 