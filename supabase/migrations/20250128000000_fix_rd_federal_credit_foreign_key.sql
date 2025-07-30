-- Migration: Fix rd_federal_credit foreign key constraints
-- Issue: Multiple foreign key constraints reference wrong table names
-- Purpose: Correct all foreign key constraints to reference the proper rd_* tables

-- Drop all incorrect foreign key constraints
ALTER TABLE public.rd_federal_credit 
DROP CONSTRAINT IF EXISTS rd_federal_credit_business_year_id_fkey;

ALTER TABLE public.rd_federal_credit 
DROP CONSTRAINT IF EXISTS rd_federal_credit_client_id_fkey;

ALTER TABLE public.rd_federal_credit 
DROP CONSTRAINT IF EXISTS rd_federal_credit_research_activity_id_fkey;

-- Add the correct foreign key constraints
ALTER TABLE public.rd_federal_credit 
ADD CONSTRAINT rd_federal_credit_business_year_id_fkey 
FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE;

ALTER TABLE public.rd_federal_credit 
ADD CONSTRAINT rd_federal_credit_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.rd_clients(id) ON DELETE CASCADE;

ALTER TABLE public.rd_federal_credit 
ADD CONSTRAINT rd_federal_credit_research_activity_id_fkey 
FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE SET NULL;

-- Verify all constraints exist and are correct
DO $$
BEGIN
    -- Check business_year_id constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_federal_credit_business_year_id_fkey'
        AND table_name = 'rd_federal_credit'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Failed to create rd_federal_credit business_year_id foreign key constraint';
    END IF;
    
    -- Check client_id constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_federal_credit_client_id_fkey'
        AND table_name = 'rd_federal_credit'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Failed to create rd_federal_credit client_id foreign key constraint';
    END IF;
    
    -- Check research_activity_id constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_federal_credit_research_activity_id_fkey'
        AND table_name = 'rd_federal_credit'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Failed to create rd_federal_credit research_activity_id foreign key constraint';
    END IF;
    
    RAISE NOTICE 'All rd_federal_credit foreign key constraints fixed successfully';
END $$; 