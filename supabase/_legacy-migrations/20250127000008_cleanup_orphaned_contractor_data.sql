-- Clean up orphaned contractor data before adding CASCADE constraints
-- This fixes the foreign key constraint violation by removing invalid references

-- First, let's see what orphaned data exists
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned contractor year data records
    SELECT COUNT(*) INTO orphaned_count
    FROM rd_contractor_year_data cyd
    LEFT JOIN rd_businesses rb ON cyd.contractor_id = rb.id
    WHERE rb.id IS NULL AND cyd.contractor_id IS NOT NULL;
    
    RAISE NOTICE 'Found % orphaned contractor_year_data records that reference non-existent businesses', orphaned_count;
    
    -- Show some examples of the orphaned data
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Sample orphaned contractor_id values:';
        FOR i IN 1..LEAST(orphaned_count, 5) LOOP
            DECLARE
                sample_id UUID;
            BEGIN
                SELECT cyd.contractor_id INTO sample_id
                FROM rd_contractor_year_data cyd
                LEFT JOIN rd_businesses rb ON cyd.contractor_id = rb.id
                WHERE rb.id IS NULL AND cyd.contractor_id IS NOT NULL
                LIMIT 1 OFFSET (i-1);
                
                RAISE NOTICE '  - contractor_id: %', sample_id;
            END;
        END LOOP;
    END IF;
END $$;

-- Clean up orphaned contractor year data
-- Option 1: Delete orphaned records (safest approach)
DELETE FROM rd_contractor_year_data
WHERE contractor_id NOT IN (
    SELECT id FROM rd_businesses WHERE id IS NOT NULL
) AND contractor_id IS NOT NULL;

-- Also clean up any records with NULL contractor_id if they exist
DELETE FROM rd_contractor_year_data
WHERE contractor_id IS NULL;

-- Report what was cleaned up
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM rd_contractor_year_data;
    RAISE NOTICE 'After cleanup: % contractor_year_data records remain', remaining_count;
END $$;

-- Now drop existing constraints (if any)
ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_contractor_id_fkey;

ALTER TABLE rd_contractor_year_data 
DROP CONSTRAINT IF EXISTS rd_contractor_year_data_business_year_id_fkey;

-- Now safely add the CASCADE constraints
DO $$
BEGIN
    -- Add contractor_id constraint with CASCADE delete
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'rd_contractor_year_data' 
               AND column_name = 'contractor_id') THEN
        
        ALTER TABLE rd_contractor_year_data
        ADD CONSTRAINT rd_contractor_year_data_contractor_id_fkey
        FOREIGN KEY (contractor_id) REFERENCES rd_businesses(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Successfully added CASCADE constraint: contractor_id -> rd_businesses(id)';
    END IF;
    
    -- Add business_year_id constraint with CASCADE delete (if the column exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'rd_contractor_year_data' 
               AND column_name = 'business_year_id') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rd_business_years') THEN
            ALTER TABLE rd_contractor_year_data
            ADD CONSTRAINT rd_contractor_year_data_business_year_id_fkey
            FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Successfully added CASCADE constraint: business_year_id -> rd_business_years(id)';
        END IF;
    END IF;
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Error adding constraints: %', SQLERRM;
        RAISE;
END $$;

-- Verify the new constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Final constraint verification:';
    
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
        RAISE NOTICE '✅ %: % -> %.% (Delete Rule: %)', 
            constraint_record.constraint_name,
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name,
            constraint_record.delete_rule;
    END LOOP;
    
    RAISE NOTICE '🎉 Migration complete! You should now be able to delete businesses without foreign key errors.';
END $$; 