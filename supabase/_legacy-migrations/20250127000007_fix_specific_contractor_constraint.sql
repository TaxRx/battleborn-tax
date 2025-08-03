-- Fix the specific rd_contractor_year_data_contractor_id_fkey constraint
-- This addresses the exact error: "rd_contractor_year_data_contractor_id_fkey"

-- First, let's see what constraints currently exist
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Current constraints on rd_contractor_year_data table:';
    
    FOR constraint_record IN 
        SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON tc.constraint_name = ccu.constraint_name
        LEFT JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'rd_contractor_year_data'
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE 'Constraint: % | Type: % | Column: % | References: %.% | Delete Rule: %', 
            constraint_record.constraint_name,
            constraint_record.constraint_type,
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name,
            constraint_record.delete_rule;
    END LOOP;
END $$;

-- Drop the specific constraint that's causing the issue
ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_contractor_id_fkey;

-- Also drop any other variations that might exist
ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_business_id_fkey;

ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_business_year_id_fkey;

-- Now check what column actually exists and what it should reference
DO $$
DECLARE
    column_exists boolean;
    table_exists boolean;
BEGIN
    -- Check if contractor_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rd_contractor_year_data' 
        AND column_name = 'contractor_id'
    ) INTO column_exists;
    
    -- Check if rd_businesses table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'rd_businesses'
    ) INTO table_exists;
    
    RAISE NOTICE 'contractor_id column exists: %', column_exists;
    RAISE NOTICE 'rd_businesses table exists: %', table_exists;
    
    -- If both exist, create the CASCADE constraint
    IF column_exists AND table_exists THEN
        ALTER TABLE rd_contractor_year_data
        ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey
        FOREIGN KEY (contractor_id) REFERENCES rd_businesses(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Successfully created CASCADE constraint for contractor_id -> rd_businesses(id)';
    ELSE
        RAISE NOTICE 'Cannot create constraint: contractor_id column exists: %, rd_businesses table exists: %', column_exists, table_exists;
    END IF;
END $$;

-- Handle business_year_id if it exists
DO $$
DECLARE
    column_exists boolean;
    table_exists boolean;
BEGIN
    -- Check if business_year_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rd_contractor_year_data' 
        AND column_name = 'business_year_id'
    ) INTO column_exists;
    
    -- Check if rd_business_years table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'rd_business_years'
    ) INTO table_exists;
    
    RAISE NOTICE 'business_year_id column exists: %', column_exists;
    RAISE NOTICE 'rd_business_years table exists: %', table_exists;
    
    -- If both exist, create the CASCADE constraint
    IF column_exists AND table_exists THEN
        ALTER TABLE rd_contractor_year_data
        ADD CONSTRAINT rd_contractor_year_data_business_year_id_fkey
        FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Successfully created CASCADE constraint for business_year_id -> rd_business_years(id)';
    ELSE
        RAISE NOTICE 'Cannot create constraint: business_year_id column exists: %, rd_business_years table exists: %', column_exists, table_exists;
    END IF;
END $$;

-- Final verification - show the new constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'FINAL: Updated constraints on rd_contractor_year_data table:';
    
    FOR constraint_record IN 
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON tc.constraint_name = ccu.constraint_name
        LEFT JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'rd_contractor_year_data'
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE '✅ Constraint: % | Column: % | References: %.% | Delete Rule: %', 
            constraint_record.constraint_name,
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name,
            constraint_record.delete_rule;
    END LOOP;
    
    RAISE NOTICE 'Migration complete - you should now be able to delete businesses with contractor data';
END $$; 