-- Add and optimize indexes
DO $$ 
BEGIN
    -- Add index on email for faster lookups
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_email'
    ) THEN
        CREATE INDEX idx_profiles_email ON profiles(email);
    END IF;

    -- Add index on user_id for foreign key lookups
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'tax_profiles' 
        AND indexname = 'idx_tax_profiles_user_id'
    ) THEN
        CREATE INDEX idx_tax_profiles_user_id ON tax_profiles(user_id);
    END IF;

    -- Add index on user_id for foreign key lookups
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'user_preferences' 
        AND indexname = 'idx_user_preferences_user_id'
    ) THEN
        CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
    END IF;

    -- Add index on user_id for foreign key lookups
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'tax_calculations' 
        AND indexname = 'idx_tax_calculations_user_id'
    ) THEN
        CREATE INDEX idx_tax_calculations_user_id ON tax_calculations(user_id);
    END IF;

    -- Add index on user_id for foreign key lookups
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'leads' 
        AND indexname = 'idx_leads_user_id'
    ) THEN
        CREATE INDEX idx_leads_user_id ON leads(user_id);
    END IF;

    -- Add index on created_at for sorting
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_created_at'
    ) THEN
        CREATE INDEX idx_profiles_created_at ON profiles(created_at);
    END IF;

    -- Add index on updated_at for sorting
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_updated_at'
    ) THEN
        CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);
    END IF;
END $$;

-- Verify indexes
DO $$
BEGIN
    -- Check profiles indexes
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_email'
    ) THEN
        RAISE EXCEPTION 'Missing index on profiles.email';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_created_at'
    ) THEN
        RAISE EXCEPTION 'Missing index on profiles.created_at';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_updated_at'
    ) THEN
        RAISE EXCEPTION 'Missing index on profiles.updated_at';
    END IF;

    -- Check foreign key indexes
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'tax_profiles' 
        AND indexname = 'idx_tax_profiles_user_id'
    ) THEN
        RAISE EXCEPTION 'Missing index on tax_profiles.user_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'user_preferences' 
        AND indexname = 'idx_user_preferences_user_id'
    ) THEN
        RAISE EXCEPTION 'Missing index on user_preferences.user_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'tax_calculations' 
        AND indexname = 'idx_tax_calculations_user_id'
    ) THEN
        RAISE EXCEPTION 'Missing index on tax_calculations.user_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'leads' 
        AND indexname = 'idx_leads_user_id'
    ) THEN
        RAISE EXCEPTION 'Missing index on leads.user_id';
    END IF;
END $$; 