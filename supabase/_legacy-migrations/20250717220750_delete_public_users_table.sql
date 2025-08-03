-- Delete public.users table after fixing all FK references
-- Fix #2b: Final step to remove public.users table
-- This migration safely removes the public.users table after all references have been updated

-- First, check that no policies still reference the users table
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Count policies that still reference the users table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND qual LIKE '%FROM users u%';
    
    IF policy_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete public.users table: % policies still reference it. Run the policy fix migration first.', policy_count;
    END IF;
    
    RAISE NOTICE 'Pre-deletion check passed: No policies reference public.users table';
END;
$$;

-- Log foreign key constraints that will be dropped
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    -- List the constraints that will be dropped
    FOR fk_record IN
        SELECT 
            tc.table_name,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name as referenced_table,
            ccu.column_name as referenced_column
        FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'users' 
        AND ccu.table_schema = 'public'
    LOOP
        RAISE NOTICE 'Will drop FK constraint: %.% (column: %) references users.%', 
            fk_record.table_name, fk_record.constraint_name, fk_record.column_name, fk_record.referenced_column;
    END LOOP;
END;
$$;

-- Check if the users table actually exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'public.users table does not exist - nothing to delete';
        RETURN;
    END IF;
    
    RAISE NOTICE 'public.users table exists and will be deleted';
END;
$$;

-- Drop any remaining triggers that might reference the users table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Look for triggers on the users table
    FOR trigger_record IN
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE event_object_table = 'users'
        AND event_object_schema = 'public'
    LOOP
        RAISE NOTICE 'Dropping trigger % on users table', trigger_record.trigger_name;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.users', trigger_record.trigger_name);
    END LOOP;
END;
$$;

-- Drop any constraints on the users table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Look for constraints on the users table (except primary key)
    FOR constraint_record IN
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND table_schema = 'public'
        AND constraint_type != 'PRIMARY KEY'
    LOOP
        RAISE NOTICE 'Dropping constraint % (type: %) on users table', constraint_record.constraint_name, constraint_record.constraint_type;
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
    END LOOP;
END;
$$;

-- Drop FK constraints from public schema only (auth schema constraints will be handled by CASCADE)
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop FK constraints from public schema that reference public.users
    FOR constraint_record IN
        SELECT 
            tc.table_schema,
            tc.table_name,
            tc.constraint_name
        FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'users' 
        AND ccu.table_schema = 'public'
        AND tc.table_schema = 'public'  -- Only drop constraints from public schema
    LOOP
        RAISE NOTICE 'Dropping FK constraint from public schema: %.%.%', 
            constraint_record.table_schema, constraint_record.table_name, constraint_record.constraint_name;
        
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', 
            constraint_record.table_schema, 
            constraint_record.table_name, 
            constraint_record.constraint_name);
    END LOOP;
    
    RAISE NOTICE 'Auth schema constraints will be handled by CASCADE when dropping the table';
END;
$$;

-- Finally, drop the users table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Verify the table has been deleted
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Failed to delete public.users table';
    ELSE
        RAISE NOTICE 'Successfully deleted public.users table';
    END IF;
END;
$$;

-- Add comment for documentation
-- COMMENT ON MIGRATION IS 'Safely deleted public.users table after updating all references to use auth.users and admin helper functions';

-- Log completion using DO block
DO $$
BEGIN
    RAISE NOTICE 'Fix #2 completed: public.users table has been safely deleted';
END;
$$;