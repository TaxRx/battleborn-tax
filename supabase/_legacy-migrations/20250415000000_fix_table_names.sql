-- Fix table names and standardize on profiles
DO $$ 
BEGIN
    -- Check if user_profiles table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Drop existing profiles table if it exists
        DROP TABLE IF EXISTS profiles;
        
        -- Rename user_profiles to profiles
        ALTER TABLE user_profiles RENAME TO profiles;
        
        -- Update all foreign key references
        ALTER TABLE tax_profiles 
            DROP CONSTRAINT IF EXISTS tax_profiles_user_id_fkey,
            ADD CONSTRAINT tax_profiles_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
            
        -- Update RLS policies
        DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
        
        -- Recreate policies for profiles table
        CREATE POLICY "Users can view own profile"
            ON profiles FOR SELECT
            USING (auth.uid() = id);
            
        CREATE POLICY "Users can update own profile"
            ON profiles FOR UPDATE
            USING (auth.uid() = id);
            
        CREATE POLICY "Users can insert own profile"
            ON profiles FOR INSERT
            WITH CHECK (auth.uid() = id);
            
        CREATE POLICY "Admins can view all profiles"
            ON profiles FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND is_admin = true
                )
            );
    END IF;
END $$;

-- Add any missing columns from user_profiles to profiles
DO $$
BEGIN
    -- Add has_completed_tax_profile if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'has_completed_tax_profile'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN has_completed_tax_profile BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add business_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'business_name'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN business_name TEXT;
    END IF;

    -- Add business_address if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'business_address'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN business_address TEXT;
    END IF;

    -- Add entity_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN entity_type TEXT;
    END IF;

    -- Add filing_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'filing_status'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN filing_status TEXT;
    END IF;

    -- Add state if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN state TEXT;
    END IF;

    -- Add dependents if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'dependents'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN dependents INTEGER DEFAULT 0;
    END IF;
END $$; 