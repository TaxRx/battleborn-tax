-- Migration: Add non_rd_percentage column to rd_employee_year_data table
-- Created: 2025-01-22
-- Purpose: Store employee-specific non-R&D time percentage for consistent Applied% calculations

-- Add non_rd_percentage column to rd_employee_year_data table
DO $$
BEGIN
  -- Add non_rd_percentage column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rd_employee_year_data' AND column_name = 'non_rd_percentage') THEN
    ALTER TABLE public.rd_employee_year_data ADD COLUMN non_rd_percentage NUMERIC(5,2) DEFAULT 0;
  END IF;
END $$;

-- Add constraint to ensure valid percentage range (0-100)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'rd_employee_year_data_non_rd_percentage_check') THEN
    ALTER TABLE public.rd_employee_year_data DROP CONSTRAINT rd_employee_year_data_non_rd_percentage_check;
  END IF;
  
  -- Add new constraint
  ALTER TABLE public.rd_employee_year_data 
  ADD CONSTRAINT rd_employee_year_data_non_rd_percentage_check 
  CHECK (non_rd_percentage >= 0 AND non_rd_percentage <= 100);
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.rd_employee_year_data.non_rd_percentage IS 'Percentage of employee time allocated to non-R&D activities (0-100). Used for calculating total Applied% consistently between allocation modal and roster display.';

-- Set default value for existing records
UPDATE public.rd_employee_year_data 
SET non_rd_percentage = 0 
WHERE non_rd_percentage IS NULL; 