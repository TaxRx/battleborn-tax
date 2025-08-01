-- Add type column to rd_roles table for role classification
-- Migration: 20250120000005_add_type_to_rd_roles.sql

-- Add type column to rd_roles table
ALTER TABLE rd_roles 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT NULL;

-- Add index for type column
CREATE INDEX IF NOT EXISTS idx_rd_roles_type ON rd_roles(type);

-- Add comment to document the type column
COMMENT ON COLUMN rd_roles.type IS 'Role type: NULL for Direct Participant, "supervisor" for Supervisor, "admin" for Admin';

-- Update existing roles to have NULL type (Direct Participant)
UPDATE rd_roles 
SET type = NULL 
WHERE type IS NULL; 