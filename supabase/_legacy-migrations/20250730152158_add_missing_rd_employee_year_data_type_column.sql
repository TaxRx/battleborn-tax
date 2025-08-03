-- Add Missing Type Column to rd_employee_year_data for Remote Data Import Compatibility
-- Purpose: Add type column present in remote database
-- Date: 2025-07-30

BEGIN;

-- Add missing type column to rd_employee_year_data table
ALTER TABLE public.rd_employee_year_data 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Add comment for new column
COMMENT ON COLUMN public.rd_employee_year_data.type IS 'Employee year data type classification (optional)';

COMMIT;