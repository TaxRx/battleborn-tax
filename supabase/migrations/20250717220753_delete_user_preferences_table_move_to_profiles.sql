-- Fix #5: Delete user_preferences table and move fields to profiles
-- The user_preferences table will be deleted and its fields moved to profiles table
-- This migration:
-- 1. Adds theme and notifications_enabled columns to profiles table
-- 2. Migrates any existing user_preferences data to profiles
-- 3. Drops the user_preferences table

-- Check current state
DO $$
DECLARE
    preference_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO preference_count FROM user_preferences;
    RAISE NOTICE 'Found % user_preferences records to migrate', preference_count;
END;
$$;

-- Add theme and notifications_enabled columns to profiles table
DO $$
BEGIN
    -- Add theme column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'theme'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN theme TEXT DEFAULT 'light';
        RAISE NOTICE 'Added theme column to profiles table';
    ELSE
        RAISE NOTICE 'theme column already exists in profiles table';
    END IF;
    
    -- Add notifications_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'notifications_enabled'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added notifications_enabled column to profiles table';
    ELSE
        RAISE NOTICE 'notifications_enabled column already exists in profiles table';
    END IF;
END;
$$;

-- Migrate existing user_preferences data to profiles table
DO $$
DECLARE
    migration_count INTEGER := 0;
    preference_record RECORD;
BEGIN
    -- Update profiles with user preferences data
    FOR preference_record IN
        SELECT 
            up.user_id,
            up.theme,
            up.notifications_enabled
        FROM user_preferences up
        WHERE up.user_id IS NOT NULL
    LOOP
        UPDATE profiles 
        SET 
            theme = COALESCE(preference_record.theme, 'light'),
            notifications_enabled = COALESCE(preference_record.notifications_enabled, true)
        WHERE id = preference_record.user_id;
        
        migration_count := migration_count + 1;
        RAISE NOTICE 'Migrated preferences for user %', preference_record.user_id;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated preferences for % users', migration_count;
END;
$$;

-- Check for any FK constraints that reference user_preferences
DO $$
DECLARE
    constraint_count INTEGER;
    constraint_record RECORD;
BEGIN
    -- Look for FK constraints that reference user_preferences
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'user_preferences' 
    AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_count > 0 THEN
        -- List the constraints
        FOR constraint_record IN
            SELECT tc.table_name, tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'user_preferences' 
            AND tc.constraint_type = 'FOREIGN KEY'
        LOOP
            RAISE NOTICE 'Found FK reference to user_preferences: %.%', 
                constraint_record.table_name, constraint_record.constraint_name;
        END LOOP;
        
        RAISE WARNING 'Found % FK references to user_preferences table', constraint_count;
    ELSE
        RAISE NOTICE 'No FK references to user_preferences table found';
    END IF;
END;
$$;

-- Drop any RLS policies on user_preferences table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop RLS policies on user_preferences table
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'user_preferences'
        AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Dropping RLS policy: %', policy_record.policyname;
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_preferences', policy_record.policyname);
    END LOOP;
END;
$$;

-- Drop any triggers on user_preferences table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'user_preferences'
        AND event_object_schema = 'public'
    LOOP
        RAISE NOTICE 'Dropping trigger: %', trigger_record.trigger_name;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON user_preferences', trigger_record.trigger_name);
    END LOOP;
END;
$$;

-- Drop any indexes on user_preferences table (except primary key)
DO $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'user_preferences'
        AND schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'  -- Skip primary key indexes
    LOOP
        RAISE NOTICE 'Dropping index: %', index_record.indexname;
        EXECUTE format('DROP INDEX IF EXISTS public.%I', index_record.indexname);
    END LOOP;
END;
$$;

-- Finally, drop the user_preferences table
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Verify the table has been dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_preferences' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Failed to drop user_preferences table';
    ELSE
        RAISE NOTICE 'Successfully dropped user_preferences table';
    END IF;
END;
$$;

-- Create indexes on the new columns in profiles for performance
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);
CREATE INDEX IF NOT EXISTS idx_profiles_notifications_enabled ON profiles(notifications_enabled);

-- Add constraints for valid theme values
DO $$
BEGIN
    -- Add check constraint for theme values
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_theme_check'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_theme_check 
        CHECK (theme IN ('light', 'dark', 'system'));
        RAISE NOTICE 'Added theme validation constraint to profiles table';
    ELSE
        RAISE NOTICE 'Theme validation constraint already exists';
    END IF;
END;
$$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Fix #5 completed: Deleted user_preferences table and moved fields to profiles';
    RAISE NOTICE '- Added: theme and notifications_enabled columns to profiles';
    RAISE NOTICE '- Migrated: existing user preferences data to profiles';
    RAISE NOTICE '- Added: performance indexes and validation constraints';
    RAISE NOTICE '- Dropped: user_preferences table completely';
END;
$$;