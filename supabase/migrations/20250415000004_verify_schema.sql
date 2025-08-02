-- Verify table structure and policies
DO $$
BEGIN
    -- Check if profiles table exists and has required columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Profiles table does not exist';
    END IF;

    -- Verify required columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id'
    ) THEN
        RAISE EXCEPTION 'Profiles table missing id column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        RAISE EXCEPTION 'Profiles table missing email column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        RAISE EXCEPTION 'Profiles table missing full_name column';
    END IF;

    -- Verify RLS is enabled
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on profiles table';
    END IF;

    -- Verify policies exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        RAISE EXCEPTION 'Missing Users can view own profile policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        RAISE EXCEPTION 'Missing Users can update own profile policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        RAISE EXCEPTION 'Missing Users can insert own profile policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        RAISE EXCEPTION 'Missing Admins can view all profiles policy';
    END IF;

    -- Verify foreign key relationships
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_profiles_user_id_fkey'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint tax_profiles_user_id_fkey';
    END IF;

    -- Verify indexes
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'profiles_email_idx'
    ) THEN
        RAISE EXCEPTION 'Missing index profiles_email_idx';
    END IF;

    -- If we get here, all checks passed
    RAISE NOTICE 'All schema verifications passed successfully';
END $$; 