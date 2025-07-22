-- Remove deprecated columns from profiles table
-- These columns are no longer used and have been replaced by the accounts system

-- First, drop the view that depends on the deprecated columns
DROP VIEW IF EXISTS users_with_auth;

-- Drop deprecated columns
ALTER TABLE profiles 
DROP COLUMN IF EXISTS is_admin,
DROP COLUMN IF EXISTS has_completed_tax_profile,
DROP COLUMN IF EXISTS partner_id,
DROP COLUMN IF EXISTS access_level,
DROP COLUMN IF EXISTS admin_role;

-- Recreate the users_with_auth view without deprecated columns
CREATE VIEW users_with_auth AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    au.email AS auth_email,
    au.created_at AS auth_created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM profiles p
JOIN auth.users au ON p.id = au.id;

-- Add comment for migration
COMMENT ON TABLE profiles IS 'Profiles table - deprecated columns removed in favor of accounts-based system';
COMMENT ON VIEW users_with_auth IS 'View combining profile and auth data without deprecated columns';