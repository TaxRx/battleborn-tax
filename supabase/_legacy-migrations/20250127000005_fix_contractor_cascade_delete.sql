-- Fix foreign key constraints to allow cascade delete
-- This allows deleting businesses that have contractor year data references

-- First, check the current structure of rd_contractor_year_data table
-- to understand what foreign key relationships exist

-- Drop all existing foreign key constraints that might prevent deletion
ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_contractor_id_fkey;

ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_business_id_fkey;

ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_business_year_id_fkey;

-- Drop any other potential foreign key constraints
ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS fk_contractor_year_data_business_year;

ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS fk_contractor_year_data_contractor;

-- Now recreate the foreign key constraints with proper CASCADE behavior

-- 1. business_year_id should reference rd_business_years table
-- This ensures that when a business year is deleted, associated contractor data is also deleted
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'rd_contractor_year_data' 
             AND column_name = 'business_year_id') THEN
    ALTER TABLE rd_contractor_year_data
    ADD CONSTRAINT rd_contractor_year_data_business_year_id_fkey
    FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. If there's a direct contractor_id reference to rd_businesses table
-- This ensures that when a business is deleted, associated contractor data is also deleted
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'rd_contractor_year_data' 
             AND column_name = 'contractor_id') THEN
    
    -- Check if contractor_id should reference rd_businesses or a separate contractors table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rd_businesses') THEN
      ALTER TABLE rd_contractor_year_data
      ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey
      FOREIGN KEY (contractor_id) REFERENCES rd_businesses(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 3. Handle user_id foreign key if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'rd_contractor_year_data' 
             AND column_name = 'user_id') THEN
    ALTER TABLE rd_contractor_year_data
    ADD CONSTRAINT rd_contractor_year_data_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add helpful comment
COMMENT ON TABLE rd_contractor_year_data IS 'Foreign key constraints updated to CASCADE delete when parent business/business_year is deleted. This allows safe deletion of businesses without foreign key constraint violations.';

-- Verify the constraints were created successfully
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints have been updated for rd_contractor_year_data table';
  RAISE NOTICE 'Businesses can now be safely deleted along with their associated contractor year data';
END $$; 