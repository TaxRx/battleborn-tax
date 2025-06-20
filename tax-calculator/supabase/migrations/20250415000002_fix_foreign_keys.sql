-- Fix foreign key relationships
DO $$ 
BEGIN
    -- Ensure tax_profiles has proper foreign key to profiles
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_profiles_user_id_fkey' 
        AND table_name = 'tax_profiles'
    ) THEN
        ALTER TABLE tax_profiles 
        ADD CONSTRAINT tax_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Ensure user_preferences has proper foreign key to profiles
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_preferences_user_id_fkey' 
        AND table_name = 'user_preferences'
    ) THEN
        ALTER TABLE user_preferences 
        ADD CONSTRAINT user_preferences_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Ensure tax_calculations has proper foreign key to profiles
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_calculations_user_id_fkey' 
        AND table_name = 'tax_calculations'
    ) THEN
        ALTER TABLE tax_calculations 
        ADD CONSTRAINT tax_calculations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Ensure leads has proper foreign key to profiles
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_user_id_fkey' 
        AND table_name = 'leads'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT leads_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verify foreign key relationships
DO $$
BEGIN
    -- Check tax_profiles foreign key
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_profiles_user_id_fkey' 
        AND table_name = 'tax_profiles'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint on tax_profiles.user_id';
    END IF;

    -- Check user_preferences foreign key
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_preferences_user_id_fkey' 
        AND table_name = 'user_preferences'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint on user_preferences.user_id';
    END IF;

    -- Check tax_calculations foreign key
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_calculations_user_id_fkey' 
        AND table_name = 'tax_calculations'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint on tax_calculations.user_id';
    END IF;

    -- Check leads foreign key
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_user_id_fkey' 
        AND table_name = 'leads'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint on leads.user_id';
    END IF;
END $$; 