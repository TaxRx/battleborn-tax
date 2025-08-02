-- Migration: Remove deprecated columns from clients table
-- Purpose: Remove affiliate_id, user_id, and partner_id columns from public.clients table
-- Date: 2025-07-17

BEGIN;

-- First, drop dependent objects before removing columns

-- Drop views that depend on the columns we're removing
DROP VIEW IF EXISTS client_access_summary CASCADE;
DROP VIEW IF EXISTS tax_proposals_with_client_info CASCADE;

-- Drop RLS policies that depend on affiliate_id
DROP POLICY IF EXISTS "Client users can view their clients" ON clients;
DROP POLICY IF EXISTS "Client users can update their clients" ON clients;

-- Remove affiliate_id column from clients table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'affiliate_id'
        AND table_schema = 'public'
    ) THEN
        -- First drop any foreign key constraints that reference this column
        DO $inner$
        BEGIN
            -- Drop constraint if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name LIKE '%affiliate_id%' 
                AND table_name = 'clients'
                AND table_schema = 'public'
            ) THEN
                EXECUTE 'ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_affiliate_id_fkey';
                RAISE NOTICE 'Dropped foreign key constraint on affiliate_id';
            END IF;
        END $inner$;
        
        -- Drop any indexes on this column
        DROP INDEX IF EXISTS idx_clients_affiliate_id;
        
        -- Drop the column
        ALTER TABLE clients DROP COLUMN affiliate_id;
        RAISE NOTICE 'Removed affiliate_id column from clients table';
    ELSE
        RAISE NOTICE 'affiliate_id column does not exist in clients table';
    END IF;
END;
$$;

-- Remove user_id column from clients table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        -- First drop any foreign key constraints that reference this column
        DO $inner$
        BEGIN
            -- Drop constraint if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name LIKE '%user_id%' 
                AND table_name = 'clients'
                AND table_schema = 'public'
            ) THEN
                EXECUTE 'ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey';
                RAISE NOTICE 'Dropped foreign key constraint on user_id';
            END IF;
        END $inner$;
        
        -- Drop any indexes on this column
        DROP INDEX IF EXISTS idx_clients_user_id;
        
        -- Drop the column
        ALTER TABLE clients DROP COLUMN user_id;
        RAISE NOTICE 'Removed user_id column from clients table';
    ELSE
        RAISE NOTICE 'user_id column does not exist in clients table';
    END IF;
END;
$$;

-- Remove partner_id column from clients table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'partner_id'
        AND table_schema = 'public'
    ) THEN
        -- First drop any foreign key constraints that reference this column
        DO $inner$
        BEGIN
            -- Drop constraint if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name LIKE '%partner_id%' 
                AND table_name = 'clients'
                AND table_schema = 'public'
            ) THEN
                EXECUTE 'ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_partner_id_fkey';
                RAISE NOTICE 'Dropped foreign key constraint on partner_id';
            END IF;
        END $inner$;
        
        -- Drop any indexes on this column
        DROP INDEX IF EXISTS idx_clients_partner_id;
        
        -- Drop the column
        ALTER TABLE clients DROP COLUMN partner_id;
        RAISE NOTICE 'Removed partner_id column from clients table';
    ELSE
        RAISE NOTICE 'partner_id column does not exist in clients table';
    END IF;
END;
$$;

-- Update any views that might reference these dropped columns
-- Drop and recreate any views that use the old columns
DO $$
BEGIN
    -- Check if any views reference the dropped columns and handle them
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND view_definition LIKE '%affiliate_id%'
        OR view_definition LIKE '%user_id%' 
        OR view_definition LIKE '%partner_id%'
    ) THEN
        RAISE NOTICE 'Some views may reference the dropped columns and might need manual updates';
    END IF;
END;
$$;

-- Clean up any RLS policies that might reference the dropped columns
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Check for policies that might reference the dropped columns
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients'
    LOOP
        -- Log that policies exist and might need review
        RAISE NOTICE 'Found RLS policy: %.% - % (review if it references dropped columns)', 
            policy_record.schemaname, policy_record.tablename, policy_record.policyname;
    END LOOP;
END;
$$;

-- Add comment to document the cleanup
COMMENT ON TABLE clients IS 'Clients table cleaned up - removed affiliate_id, user_id, partner_id columns. Client relationships now managed through client_users junction table and accounts table.';

-- Final validation
DO $$
DECLARE
    remaining_columns TEXT[];
BEGIN
    -- Get list of remaining columns
    SELECT ARRAY_AGG(column_name ORDER BY ordinal_position) 
    INTO remaining_columns
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Clients table cleanup complete. Remaining columns: %', remaining_columns;
END;
$$;

COMMIT;