-- Make role_id nullable in rd_employees table
-- Migration: 20250121000002_make_role_id_nullable_in_rd_employees.sql

-- Remove NOT NULL constraint from role_id column
ALTER TABLE rd_employees 
ALTER COLUMN role_id DROP NOT NULL;

-- Update foreign key constraint to SET NULL instead of CASCADE on role deletion
ALTER TABLE rd_employees 
DROP CONSTRAINT IF EXISTS rd_employees_role_id_fkey;

ALTER TABLE rd_employees 
ADD CONSTRAINT rd_employees_role_id_fkey 
FOREIGN KEY (role_id) REFERENCES rd_roles(id) ON DELETE SET NULL;

-- Add comment to document the change
COMMENT ON COLUMN rd_employees.role_id IS 'Role assignment for employee - nullable to allow employees without assigned roles'; 