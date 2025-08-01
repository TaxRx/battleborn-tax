-- Add Missing Columns to rd_roles for Remote Data Import Compatibility
-- Purpose: Add type and description columns present in remote database
-- Date: 2025-07-29

BEGIN;

-- Add missing columns to rd_roles table
ALTER TABLE public.rd_roles 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add comments for new columns
COMMENT ON COLUMN public.rd_roles.type IS 'Role type classification (optional)';
COMMENT ON COLUMN public.rd_roles.description IS 'Role description text (optional)';
COMMENT ON COLUMN public.rd_roles.created_at IS 'Timestamp when role was created';
COMMENT ON COLUMN public.rd_roles.updated_at IS 'Timestamp when role was last updated';

COMMIT;