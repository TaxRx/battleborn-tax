-- Migration: Fix rd_federal_credit foreign key constraints
-- Issue: Multiple foreign key constraints reference wrong table names
-- Error 1: "Key is not present in table 'business_years'" should be "rd_business_years"
-- Error 2: "Key is not present in table 'research_activities'" should be "rd_research_activities"
-- Purpose: Correct the foreign key constraints to reference rd_* tables

-- Drop the incorrect business_year_id foreign key constraint
ALTER TABLE public.rd_federal_credit 
DROP CONSTRAINT IF EXISTS rd_federal_credit_business_year_id_fkey;

-- Drop the incorrect research_activity_id foreign key constraint
ALTER TABLE public.rd_federal_credit 
DROP CONSTRAINT IF EXISTS rd_federal_credit_research_activity_id_fkey;

-- Add the correct business_year_id foreign key constraint
ALTER TABLE public.rd_federal_credit 
ADD CONSTRAINT rd_federal_credit_business_year_id_fkey 
FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;

-- Add the correct research_activity_id foreign key constraint
ALTER TABLE public.rd_federal_credit 
ADD CONSTRAINT rd_federal_credit_research_activity_id_fkey 
FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE;

-- Verify the constraints exist and are correct
DO $$
BEGIN
    -- Check if business_year_id constraint was created successfully
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_federal_credit_business_year_id_fkey'
        AND table_name = 'rd_federal_credit'
    ) THEN
        RAISE EXCEPTION 'Failed to create rd_federal_credit_business_year_id_fkey constraint';
    END IF;
    
    -- Check if research_activity_id constraint was created successfully
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_federal_credit_research_activity_id_fkey'
        AND table_name = 'rd_federal_credit'
    ) THEN
        RAISE EXCEPTION 'Failed to create rd_federal_credit_research_activity_id_fkey constraint';
    END IF;
    
    RAISE NOTICE 'Successfully updated rd_federal_credit foreign key constraints';
    RAISE NOTICE '✅ business_year_id now references rd_business_years(id)';
    RAISE NOTICE '✅ research_activity_id now references rd_research_activities(id)';
END $$; 