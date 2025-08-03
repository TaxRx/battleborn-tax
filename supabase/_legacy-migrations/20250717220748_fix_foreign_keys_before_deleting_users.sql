-- Fix foreign key constraints that reference public.users before deletion
-- Fix #2a: Update FK constraints to reference auth.users instead of public.users
-- This migration updates all foreign key constraints to use auth.users

-- Update clients table constraints
-- Drop the existing FK constraints that reference public.users
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_created_by_fkey;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Add new FK constraints that reference auth.users
ALTER TABLE clients 
ADD CONSTRAINT clients_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ALTER TABLE clients 
-- ADD CONSTRAINT clients_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update profiles table constraint
-- Drop the existing FK constraint that references public.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add new FK constraint that references auth.users
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update security_events table constraint
-- Drop the existing FK constraint that references public.users
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_user_id_fkey;

-- Add new FK constraint that references auth.users
ALTER TABLE security_events 
ADD CONSTRAINT security_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update client_activities table constraint (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'client_activities' 
        AND table_schema = 'public'
    ) THEN
        -- Drop the existing FK constraint that references public.users
        ALTER TABLE client_activities DROP CONSTRAINT IF EXISTS client_activities_user_id_fkey;
        
        -- Add new FK constraint that references auth.users
        ALTER TABLE client_activities 
        ADD CONSTRAINT client_activities_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END;
$$;

-- Update tax_proposals table constraint
-- Drop the existing FK constraint that references public.users
ALTER TABLE tax_proposals DROP CONSTRAINT IF EXISTS tax_proposals_created_by_fkey;

-- Add new FK constraint that references auth.users
ALTER TABLE tax_proposals 
ADD CONSTRAINT tax_proposals_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Note: identities, sessions, mfa_factors, one_time_tokens are in auth schema and already reference auth.users correctly

-- Verify all constraints are updated
DO $$
DECLARE
    fk_count INTEGER;
    fk_record RECORD;
BEGIN
    -- Count remaining FK constraints that reference public.users
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'users' 
    AND ccu.table_schema = 'public'
    AND tc.table_schema = 'public';  -- Only check public schema constraints
    
    IF fk_count > 0 THEN
        -- List remaining constraints
        FOR fk_record IN
            SELECT 
                tc.table_name,
                tc.constraint_name,
                kcu.column_name
            FROM information_schema.referential_constraints rc
            JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'users' 
            AND ccu.table_schema = 'public'
            AND tc.table_schema = 'public'
        LOOP
            RAISE NOTICE 'Remaining FK constraint in public schema: %.% (column: %)', 
                fk_record.table_name, fk_record.constraint_name, fk_record.column_name;
        END LOOP;
        
        RAISE WARNING 'Still have % FK constraints in public schema referencing public.users', fk_count;
    ELSE
        RAISE NOTICE 'Successfully updated all public schema FK constraints to reference auth.users';
    END IF;
END;
$$;