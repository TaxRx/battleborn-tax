-- Fix #3: Clean up profiles table structure
-- This migration:
-- 1. Deletes partner_id, admin_role, access_level columns from profiles
-- 2. Moves has_completed_tax_profile to clients table
-- 3. Makes account_id a required field in profiles

-- First, add has_completed_tax_profile to clients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'has_completed_tax_profile'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD COLUMN has_completed_tax_profile BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added has_completed_tax_profile column to clients table';
    ELSE
        RAISE NOTICE 'has_completed_tax_profile column already exists in clients table';
    END IF;
END;
$$;

-- Migrate existing has_completed_tax_profile data from profiles to clients
DO $$
DECLARE
    migration_count INTEGER := 0;
    profile_record RECORD;
BEGIN
    -- Update clients table with profile tax completion status
    FOR profile_record IN
        SELECT 
            p.id as profile_id,
            p.has_completed_tax_profile,
            c.id as client_id
        FROM profiles p
        JOIN clients c ON c.user_id = p.id
        WHERE p.has_completed_tax_profile IS NOT NULL
    LOOP
        UPDATE clients 
        SET has_completed_tax_profile = profile_record.has_completed_tax_profile
        WHERE id = profile_record.client_id;
        
        migration_count := migration_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Migrated has_completed_tax_profile for % client records', migration_count;
END;
$$;

-- Make account_id required in profiles table
-- First, check if there are any profiles without account_id
DO $$
DECLARE
    null_account_count INTEGER;
    profile_record RECORD;
BEGIN
    SELECT COUNT(*) INTO null_account_count
    FROM profiles
    WHERE account_id IS NULL;
    
    IF null_account_count > 0 THEN
        RAISE WARNING 'Found % profiles without account_id - these need to be fixed before making account_id required', null_account_count;
        
        -- List the profiles without account_id
        FOR profile_record IN
            SELECT id, email, full_name
            FROM profiles
            WHERE account_id IS NULL
        LOOP
            RAISE NOTICE 'Profile without account_id: % (email: %, name: %)', 
                profile_record.id, profile_record.email, profile_record.full_name;
        END LOOP;
        
        RAISE EXCEPTION 'Cannot make account_id required while % profiles have NULL account_id', null_account_count;
    ELSE
        RAISE NOTICE 'All profiles have account_id - safe to make it required';
    END IF;
END;
$$;

-- Make account_id NOT NULL
ALTER TABLE profiles ALTER COLUMN account_id SET NOT NULL;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_account_id_fkey'
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for profiles.account_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for profiles.account_id already exists';
    END IF;
END;
$$;

-- Drop the columns to be removed
-- Drop partner_id column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'partner_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles DROP COLUMN partner_id;
        RAISE NOTICE 'Dropped partner_id column from profiles table';
    ELSE
        RAISE NOTICE 'partner_id column does not exist in profiles table';
    END IF;
END;
$$;

-- Drop admin_role column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'admin_role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles DROP COLUMN admin_role;
        RAISE NOTICE 'Dropped admin_role column from profiles table';
    ELSE
        RAISE NOTICE 'admin_role column does not exist in profiles table';
    END IF;
END;
$$;

-- Drop access_level column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'access_level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles DROP COLUMN access_level;
        RAISE NOTICE 'Dropped access_level column from profiles table';
    ELSE
        RAISE NOTICE 'access_level column does not exist in profiles table';
    END IF;
END;
$$;

-- Handle view dependencies before dropping has_completed_tax_profile column
-- Drop users_with_auth view that depends on has_completed_tax_profile
DROP VIEW IF EXISTS users_with_auth;

-- Drop has_completed_tax_profile column from profiles (now moved to clients)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'has_completed_tax_profile'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles DROP COLUMN has_completed_tax_profile;
        RAISE NOTICE 'Dropped has_completed_tax_profile column from profiles table (moved to clients)';
    ELSE
        RAISE NOTICE 'has_completed_tax_profile column does not exist in profiles table';
    END IF;
END;
$$;

-- Recreate users_with_auth view without has_completed_tax_profile column
-- (It will now need to join with clients table if that field is needed)
CREATE OR REPLACE VIEW users_with_auth AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_admin,
    p.created_at,
    p.updated_at,
    au.email AS auth_email,
    au.created_at AS auth_created_at,
    au.last_sign_in_at
FROM profiles p
JOIN auth.users au ON p.id = au.id;

-- Create index on clients.has_completed_tax_profile for performance
CREATE INDEX IF NOT EXISTS idx_clients_has_completed_tax_profile 
ON clients(has_completed_tax_profile);

-- Update any RLS policies that might reference the dropped columns
-- (This is mainly for safety, in case any policies reference these columns)

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Fix #3 completed: Cleaned up profiles table structure';
    RAISE NOTICE '- Removed: partner_id, admin_role, access_level columns';
    RAISE NOTICE '- Moved: has_completed_tax_profile to clients table';
    RAISE NOTICE '- Made: account_id required field with FK constraint';
END;
$$;