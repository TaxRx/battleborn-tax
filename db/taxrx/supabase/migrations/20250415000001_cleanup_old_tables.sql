-- Clean up old table definitions
DO $$ 
BEGIN
    -- First, drop all dependent policies only if the tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
        DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
        DROP POLICY IF EXISTS "Admins can update leads" ON leads;
        DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
        DROP POLICY IF EXISTS "Users can view own leads" ON leads;
        DROP POLICY IF EXISTS "Users can update own leads" ON leads;
        DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tax_calculations') THEN
        DROP POLICY IF EXISTS "Admins can view all tax calculations" ON tax_calculations;
        DROP POLICY IF EXISTS "Admins can update tax calculations" ON tax_calculations;
        DROP POLICY IF EXISTS "Admins can delete tax calculations" ON tax_calculations;
        DROP POLICY IF EXISTS "Users can view own tax calculations" ON tax_calculations;
        DROP POLICY IF EXISTS "Users can update own tax calculations" ON tax_calculations;
        DROP POLICY IF EXISTS "Users can delete own tax calculations" ON tax_calculations;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        DROP POLICY IF EXISTS "Admins can view all user preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Admins can update user preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Admins can delete user preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can view own user preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can update own user preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can delete own user preferences" ON user_preferences;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tax_profiles') THEN
        DROP POLICY IF EXISTS "Admins can view all tax profiles" ON tax_profiles;
        DROP POLICY IF EXISTS "Admins can update tax profiles" ON tax_profiles;
        DROP POLICY IF EXISTS "Admins can delete tax profiles" ON tax_profiles;
        DROP POLICY IF EXISTS "Users can view own tax profiles" ON tax_profiles;
        DROP POLICY IF EXISTS "Users can update own tax profiles" ON tax_profiles;
        DROP POLICY IF EXISTS "Users can delete own tax profiles" ON tax_profiles;
    END IF;

    -- Drop old RLS policies for user_profiles if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

        -- Drop old triggers
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        DROP TRIGGER IF EXISTS handle_new_user ON user_profiles;
    END IF;

    -- Drop the auth.users trigger first
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- Now we can safely drop the function
    DROP FUNCTION IF EXISTS handle_new_user();

    -- Now we can safely drop the tables with CASCADE
    DROP TABLE IF EXISTS user_profiles CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
END $$; 