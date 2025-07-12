-- Fix all user references to point to profiles instead of auth.users
-- Migration: 20250712100006_fix_user_references_to_profiles.sql

-- This migration changes all foreign key references from auth.users to profiles
-- Since profiles.id = auth.users.id (1:1 relationship), data integrity is maintained

-- 1. Fix tax_calculations table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tax_calculations') THEN
        -- Drop existing foreign key constraint
        ALTER TABLE tax_calculations DROP CONSTRAINT IF EXISTS tax_calculations_user_id_fkey;
        
        -- Add new foreign key to profiles
        ALTER TABLE tax_calculations 
        ADD CONSTRAINT tax_calculations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Fix tax_proposals table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tax_proposals') THEN
        -- Drop existing foreign key constraint
        ALTER TABLE tax_proposals DROP CONSTRAINT IF EXISTS tax_proposals_user_id_fkey;
        
        -- Add new foreign key to profiles
        ALTER TABLE tax_proposals 
        ADD CONSTRAINT tax_proposals_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Fix client_users table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_users') THEN
        -- Drop existing foreign key constraints
        ALTER TABLE client_users DROP CONSTRAINT IF EXISTS client_users_user_id_fkey;
        ALTER TABLE client_users DROP CONSTRAINT IF EXISTS client_users_invited_by_fkey;
        
        -- Add new foreign keys to profiles
        ALTER TABLE client_users 
        ADD CONSTRAINT client_users_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE client_users 
        ADD CONSTRAINT client_users_invited_by_fkey 
        FOREIGN KEY (invited_by) REFERENCES profiles(id);
    END IF;
END $$;

-- 4. Fix tax_estimates table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tax_estimates') THEN
        -- Drop existing foreign key constraint
        ALTER TABLE tax_estimates DROP CONSTRAINT IF EXISTS tax_estimates_user_id_fkey;
        
        -- Add new foreign key to profiles
        ALTER TABLE tax_estimates 
        ADD CONSTRAINT tax_estimates_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Fix rd_employees table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rd_employees') THEN
        -- Drop existing foreign key constraint
        ALTER TABLE rd_employees DROP CONSTRAINT IF EXISTS rd_employees_user_id_fkey;
        
        -- Add new foreign key to profiles
        ALTER TABLE rd_employees 
        ADD CONSTRAINT rd_employees_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;
END $$;

-- 6. Fix rd_contractors table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rd_contractors') THEN
        -- Drop existing foreign key constraint
        ALTER TABLE rd_contractors DROP CONSTRAINT IF EXISTS rd_contractors_user_id_fkey;
        
        -- Add new foreign key to profiles
        ALTER TABLE rd_contractors 
        ADD CONSTRAINT rd_contractors_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;
END $$;

-- 7. Fix calculations table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calculations') THEN
        -- Drop existing foreign key constraint
        ALTER TABLE calculations DROP CONSTRAINT IF EXISTS calculations_user_id_fkey;
        
        -- Add new foreign key to profiles
        ALTER TABLE calculations 
        ADD CONSTRAINT calculations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. Update any RLS policies that reference auth.uid() to work with profiles
-- Note: auth.uid() still works since profiles.id = auth.users.id

-- 9. Update helper functions to use profiles consistently
-- Update the user access functions to reference profiles table
CREATE OR REPLACE FUNCTION user_has_client_access(check_user_id UUID, check_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_users cu
        JOIN profiles p ON cu.user_id = p.id
        WHERE cu.user_id = check_user_id
        AND cu.client_id = check_client_id
        AND cu.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add comments to document the change
COMMENT ON TABLE profiles IS 'Primary user table for application. All business logic should reference this table, not auth.users directly.';

-- 11. Create a view to easily get user info with auth data if needed
CREATE OR REPLACE VIEW users_with_auth AS
SELECT 
    p.*,
    au.email as auth_email,
    au.created_at as auth_created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM profiles p
JOIN auth.users au ON p.id = au.id;

COMMENT ON VIEW users_with_auth IS 'Convenience view that joins profiles with auth.users data when auth info is needed';

-- 12. Add indexes for the new foreign key relationships
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_id_profiles ON tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_proposals_user_id_profiles ON tax_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_estimates_user_id_profiles ON tax_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_user_id_profiles ON calculations(user_id);

-- Add a constraint to ensure profiles.id always matches auth.users.id
-- This is already enforced by the FK constraint, but adding for clarity
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_matches_auth_users;
-- Note: The existing FK constraint already ensures this, so we don't need to add another

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Successfully updated all user references to point to profiles table instead of auth.users';
END $$; 