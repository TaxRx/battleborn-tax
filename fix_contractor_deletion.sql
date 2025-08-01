-- Fix contractor deletion foreign key constraint issue
-- This script ensures the foreign key constraints are properly set up for CASCADE deletion

-- First, let's check the current state of the foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('rd_contractor_year_data', 'rd_contractor_subcomponents')
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'contractor_id';

-- Drop existing foreign key constraints if they exist
DO $$
BEGIN
    -- Drop rd_contractor_year_data foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_contractor_year_data_contractor_id_fkey'
        AND table_name = 'rd_contractor_year_data'
    ) THEN
        ALTER TABLE public.rd_contractor_year_data 
        DROP CONSTRAINT rd_contractor_year_data_contractor_id_fkey;
    END IF;

    -- Drop rd_contractor_subcomponents foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rd_contractor_subcomponents_contractor_id_fkey'
        AND table_name = 'rd_contractor_subcomponents'
    ) THEN
        ALTER TABLE public.rd_contractor_subcomponents 
        DROP CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey;
    END IF;
END $$;

-- Recreate the foreign key constraints with CASCADE delete
ALTER TABLE public.rd_contractor_year_data 
ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey 
FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id) ON DELETE CASCADE;

ALTER TABLE public.rd_contractor_subcomponents 
ADD CONSTRAINT rd_contractor_subcomponents_contractor_id_fkey 
FOREIGN KEY (contractor_id) REFERENCES public.rd_contractors(id) ON DELETE CASCADE;

-- Verify the constraints are properly set up
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('rd_contractor_year_data', 'rd_contractor_subcomponents')
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'contractor_id';

-- Test deletion by creating a temporary contractor and related records
-- (This is optional and can be commented out)
/*
DO $$
DECLARE
    test_contractor_id uuid;
    test_business_year_id uuid;
    test_subcomponent_id uuid;
BEGIN
    -- Get a business year for testing
    SELECT id INTO test_business_year_id FROM public.rd_business_years LIMIT 1;
    
    -- Get a subcomponent for testing
    SELECT id INTO test_subcomponent_id FROM public.rd_research_subcomponents LIMIT 1;
    
    -- Create a test contractor
    INSERT INTO public.rd_contractors (business_id, first_name, last_name, role_id, amount)
    VALUES (
        (SELECT business_id FROM public.rd_business_years WHERE id = test_business_year_id LIMIT 1),
        'Test',
        'Contractor',
        (SELECT id FROM public.rd_roles LIMIT 1),
        10000
    ) RETURNING id INTO test_contractor_id;
    
    -- Create related records
    INSERT INTO public.rd_contractor_year_data (contractor_id, business_year_id, applied_percent, calculated_qre, activity_roles)
    VALUES (test_contractor_id, test_business_year_id, 50.00, 5000.00, '{}');
    
    INSERT INTO public.rd_contractor_subcomponents (contractor_id, subcomponent_id, business_year_id, time_percentage, applied_percentage, is_included, baseline_applied_percent)
    VALUES (test_contractor_id, test_subcomponent_id, test_business_year_id, 50.00, 50.00, true, 50.00);
    
    -- Test deletion
    DELETE FROM public.rd_contractors WHERE id = test_contractor_id;
    
    -- Verify related records were deleted
    IF EXISTS (SELECT 1 FROM public.rd_contractor_year_data WHERE contractor_id = test_contractor_id) THEN
        RAISE EXCEPTION 'Contractor year data was not deleted';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.rd_contractor_subcomponents WHERE contractor_id = test_contractor_id) THEN
        RAISE EXCEPTION 'Contractor subcomponents were not deleted';
    END IF;
    
    RAISE NOTICE 'Test successful: Contractor deletion with CASCADE works correctly';
END $$;
*/ 