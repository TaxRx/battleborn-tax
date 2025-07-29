-- Migration: Add unique constraint to rd_reports table
-- Created: 2025-01-22
-- Purpose: Add unique constraint on (business_year_id, type) to support ON CONFLICT in report saving

-- Add unique constraint to rd_reports table
-- This ensures only one report per business year and type combination
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'rd_reports_business_year_type_unique' 
    AND table_name = 'rd_reports'
  ) THEN
    -- Add the unique constraint
    ALTER TABLE public.rd_reports 
    ADD CONSTRAINT rd_reports_business_year_type_unique 
    UNIQUE (business_year_id, type);
    
    RAISE NOTICE 'Added unique constraint rd_reports_business_year_type_unique';
  ELSE
    RAISE NOTICE 'Unique constraint rd_reports_business_year_type_unique already exists';
  END IF;
END $$;

-- Add comment to document the constraint
COMMENT ON CONSTRAINT rd_reports_business_year_type_unique ON public.rd_reports 
IS 'Ensures only one report per business year and type combination - supports ON CONFLICT for upsert operations';

-- Verify the constraint was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'rd_reports_business_year_type_unique' 
    AND table_name = 'rd_reports'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: Unique constraint rd_reports_business_year_type_unique is now active';
  ELSE
    RAISE WARNING '❌ FAILED: Unique constraint was not created successfully';
  END IF;
END $$; 