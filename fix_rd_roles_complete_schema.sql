-- Complete fix for rd_roles table schema issues
-- Run this script in your Supabase SQL Editor to fix all the column errors

-- 1. Add missing description column
ALTER TABLE rd_roles 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add missing is_default column  
ALTER TABLE rd_roles 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 3. Add missing type column
ALTER TABLE rd_roles 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT NULL;

-- 4. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_rd_roles_is_default ON rd_roles(is_default);
CREATE INDEX IF NOT EXISTS idx_rd_roles_type ON rd_roles(type);

-- 5. Add comments to document the columns
COMMENT ON COLUMN rd_roles.description IS 'Role description explaining responsibilities and duties';
COMMENT ON COLUMN rd_roles.is_default IS 'Whether this is a default role for the business';
COMMENT ON COLUMN rd_roles.type IS 'Role type: NULL for Direct Participant, "supervisor" for Supervisor, "admin" for Admin';

-- 6. Update existing roles to have default values
UPDATE rd_roles 
SET description = 'Role description not provided' 
WHERE description IS NULL;

UPDATE rd_roles 
SET is_default = FALSE 
WHERE is_default IS NULL;

-- 7. Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rd_roles' 
ORDER BY ordinal_position; 